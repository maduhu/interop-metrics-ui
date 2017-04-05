from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import pytz
from cassandra.cluster import Cluster, dict_factory

from metrics_server.base_service import BaseService
from metrics_server.errors import NotFoundError, ConfigurationError


KEYSPACE = 'metric_data'
TABLE_NAMES = ['raw_counter_with_interval', 'raw_timer_with_interval']
TIMESTAMP_COLUMNS = ['metric_timestamp', 'previous_metric_timestamp']
COUNTER_COLUMNS = {'count', 'previous_count', 'interval_count'}
TIMER_COLUMNS = {
    'count', 'previous_count', 'interval_count', 'p75', 'p95', 'p98', 'p99', 'p999', 'max', 'mean', 'median', 'min',
    'std_dev', 'one_min_rate', 'five_min_rate', 'fifteen_min_rate', 'mean_rate'
}
COLUMN_MAP = {
    'raw_counter_with_interval': COUNTER_COLUMNS,
    'raw_timer_with_interval': TIMER_COLUMNS
}
AGGREGATOR_MAP = {
    'raw_counter_with_interval': {
        'count': np.max,
        'previous_count': np.max,
        'interval_count': np.sum
    },
    'raw_timer_with_interval': {
        'count': np.max,
        'interval_count': np.sum,
        'previous_count': np.max,
        'p75': np.max,
        'p95': np.max,
        'p98': np.max,
        'p99': np.max,
        'p999': np.max,
        'one_min_rate': np.max,
        'five_min_rate': np.max,
        'fifteen_min_rate': np.max,
        'mean_rate': np.mean,
        'median': np.max,
        'max': np.max,
        'min': np.min,
        'mean': np.mean,
        'std_dev': np.max
    }
}


def interval_count(df: pd.DataFrame):
    return df.assign(interval_count=df['count'] - df['previous_count']).drop(['count', 'previous_count'], axis=1)


class MetricsService(BaseService):
    """
    MetricsService is used to retrieve metrics data and metadata from a Cassandra database.
    """
    def __init__(self, config, services):
        super().__init__(config, services)
        self._init_cassandra()

    def _init_cassandra(self):
        """
        Initialize our Cassandra database so we can start querying it.

        :return:
        """
        config = self.config.get('cassandra')

        if config is None:
            raise ConfigurationError('No cassandra section found in config.')

        host = config.get('host')

        if host is None:
            raise ConfigurationError('No host value found in cassandra section.')

        self.cluster = Cluster([config['host']])
        self.session = self.cluster.connect(KEYSPACE)
        self.session.row_factory = dict_factory

        # Note: we have to set the default fetch size to None in order for us to use pandas without taking a huge
        # performance hit. If we set the fetch_size then we need to page through results and append rows to the
        # dataframe, which is bad because it has to copy the old dataframe, then append the new rows.
        self.session.default_fetch_size = None

    def get_distinct_metrics_for_table(self, table):
        """
        Queries for and returns all of the distinct metrics in a table.

        :param table: str, the table to query against.
        :return: list of dicts representing the environment, application, metric_name, and table.
        """
        all_rows = []
        metadata_cols = ['metric_timestamp']

        if 'timer' in table:
            metadata_cols += ['duration_unit', 'rate_unit']

        metadata_query = (
            f'SELECT {", ".join(metadata_cols)} '
            f'FROM {table} '
            'WHERE environment = %s '
            'AND application = %s '
            'AND metric_name = %s '
            'ORDER BY metric_timestamp DESC '
            'LIMIT 1;'
        )
        rows = self.session.execute(f'SELECT DISTINCT environment, application, metric_name FROM {table};')

        for row in rows:
            query_args = [row['environment'], row['application'], row['metric_name']]
            metadata = self.session.execute(metadata_query, query_args)[0]
            row['table'] = table
            row['last_timestamp'] = pytz.utc.localize(metadata['metric_timestamp']).isoformat()
            row['duration_unit'] = metadata.get('duration_unit')
            row['rate_unit'] = metadata.get('rate_unit')
            all_rows.append(row)

        return all_rows

    def get_all_distinct_metrics(self):
        """
        Retrieve all of the unique metrics available from the DB.

        :return:
        """
        all_rows = []

        for table in TABLE_NAMES:
            all_rows = all_rows + self.get_distinct_metrics_for_table(table)

        return all_rows

    def get_environments(self):
        """
        Retrieve environments from DB

        :return: list of strings
        """
        environments = set()
        distinct_metrics = self.get_all_distinct_metrics()

        for metric in distinct_metrics:
            environments.add(metric['environment'])

        return list(environments)

    def get_applications(self, environment):
        """
        Retrieve applications from DB for a given environment.

        :param environment: The environment you want to get applications from.
        :return: list of strings
        """
        applications = set()
        distinct_metrics = self.get_all_distinct_metrics()

        for metric in distinct_metrics:
            if metric['environment'] == environment:
                # Can't filter only one partition key, so have to manually filter here.
                applications.add(metric['application'])

        return list(applications)

    def get_metrics(self, environment, application):
        """
        Retrieve available metrics from DB for a given environment and application.

        :param environment: The environment you want to get metrics from.
        :param application: The application you want to get metrics from.
        :return: list of strings
        """
        available_metrics = []
        all_metrics = self.get_all_distinct_metrics()

        for metric in all_metrics:
            if metric['environment'] == environment and metric['application'] == application:
                metric.pop('environment')
                metric.pop('application')
                available_metrics.append(metric)

        return available_metrics

    def get_metric_data(self, environment, application, table, metric, columns, start_timestamp=None,
                        end_timestamp=None, size=1000) -> pd.DataFrame:
        """
        Retrieve data from DB for a given environment, application, and metric.

        :param environment: The environment you want to retrieve data from.
        :param application: The application you want to retrieve data from.
        :param table: The table you want to retrieve data from.
        :param metric: The metric you want to retrieve data from.
        :param columns: A list of stings representing the column names to select.
        :param start_timestamp: The timestamp you want to start retrieving data for. Defaults to 24 hours ago.
        :param end_timestamp: The timestamp you want to receive data until. Defaults to now.
        :param size: The desired number of rows to return. We will do what we can to return as close to as many rows as
            requested, however when down sampling we cannot always get exactly the desired amount. Also, sometimes there
            just isn't enough data in the database.
        :return: list of rows.
        """
        query_columns = ['metric_timestamp']
        is_interval_count = False

        if end_timestamp is None:
            end_timestamp = datetime.now(tz=pytz.utc)

        if start_timestamp is None:
            start_timestamp = end_timestamp - timedelta(hours=24)

        table_columns = COLUMN_MAP.get(table)

        if table_columns is None:
            raise NotFoundError(f'table "{table}" does not exist')

        for column in columns:
            if column not in table_columns:
                raise NotFoundError(f'column "{column}" not in table "{table}"')

            if column == 'interval_count':
                query_columns += ['count', 'previous_count']
                is_interval_count = True
            else:
                query_columns.append(column)

        column_str = ', '.join(query_columns)
        query = (
            f'SELECT {column_str} FROM {table} WHERE environment=%s AND application=%s AND metric_name=%s '
            'AND metric_timestamp >= %s AND metric_timestamp <= %s;'
        )
        params = [environment, application, metric, start_timestamp, end_timestamp]
        rows = self.session.execute(query, params).current_rows

        if len(rows) == 0:
            rows = pd.DataFrame([], columns=query_columns)
        else:
            rows = pd.DataFrame(rows).set_index(['metric_timestamp']).tz_localize('UTC')

        if is_interval_count:
            rows = interval_count(rows)

        if len(rows) > size:
            # If we got more rows from the database than we want, then we resample.
            seconds = (end_timestamp - start_timestamp).total_seconds()
            bucket_size = int(seconds // size)
            aggregators = {}

            for column in columns:
                aggregators[column] = AGGREGATOR_MAP[table][column]

            rows = rows.resample(f'{bucket_size}S').agg(aggregators)

        return rows.reset_index()
