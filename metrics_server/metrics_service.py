from datetime import datetime, timedelta

import pytz
from cassandra.cluster import Cluster
from cassandra.query import dict_factory

from metrics_server.base_service import BaseService
from metrics_server.errors import NotFoundError

KEYSPACE = 'metric_data'
TABLE_NAMES = ['raw_counter_with_interval', 'raw_timer_with_interval']
TIMESTAMP_COLUMNS = ['metric_timestamp', 'previous_metric_timestamp']
COUNTER_COLUMNS = ['count', 'previous_count']
TIMER_COLUMNS = ['count', 'previous_count', 'p75', 'p95', 'p98', 'p99', 'p999', 'one_min_rate', 'fifteen_min_rate',
                 'five_min_rate', 'max', 'mean', 'mean_rate', 'median', 'min', 'std_dev']
COLUMN_MAP = {
    'raw_counter_with_interval': COUNTER_COLUMNS,
    'raw_timer_with_interval': TIMER_COLUMNS
}


class MetricsService(BaseService):
    """
    MetricsService is used to retrieve metrics data and metadata from a database.

    TODO: figure out if we should make retrieving timers different than counters (probably not)
    TODO: figure out response format for get_available_metrics, should probably include available dimensions for each
        metric, or at least their type (counter or timer).
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
        self.cluster = Cluster([config['host']])
        self.session = self.cluster.connect(KEYSPACE)
        self.session.row_factory = dict_factory

    def get_distinct_metrics_for_table(self, table):
        all_rows = []
        rows = self.session.execute(f'SELECT DISTINCT environment, application, metric_name FROM {table};')

        for row in rows:
            row['table'] = table
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

    def get_available_metrics(self, environment, application):
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

    def get_metrics_data(self, environment, application, table, metric, start_timestamp=None, end_timestamp=None):
        """
        Retrieve data from DB for a given environment, application, and metric.

        TODO: will probably want to allow this method to limit the number of rows returned.

        :param environment: The environment you want to retrieve data from.
        :param application: The application you want to retrieve data from.
        :param table: The table you want to retrieve data from.
        :param metric: The metric you want to retrieve data from.
        :param start_timestamp: The timestamp you want to start retrieving data for. Defaults to 24 hours ago.
        :param end_timestamp: The timestamp you want to receive data until. Defaults to now.
        :return: list of rows.
        """
        if end_timestamp is None:
            end_timestamp = datetime.now(tz=pytz.timezone('GMT'))

        if start_timestamp is None:
            start_timestamp = end_timestamp - timedelta(hours=24)

        data = []
        table_columns = COLUMN_MAP.get(table)

        if table_columns is None:
            raise NotFoundError(f'table "{table}" does not exist.')

        all_columns = table_columns + TIMESTAMP_COLUMNS
        column_str = ', '.join(all_columns)
        # Hard limit of 100 right now because without timestamp filters it's super easy to get ~100k rows.
        # TODO: add a start_timestamp and end_timestamp
        query = f"""SELECT {column_str} FROM {table} WHERE environment = %s AND application = %s AND metric_name= %s
        AND metric_timestamp >= %s AND metric_timestamp <= %s;"""
        rows = self.session.execute(query, [environment, application, metric, start_timestamp, end_timestamp])

        for row in rows:
            data.append(row)

        return data
