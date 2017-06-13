from cassandra.cluster import Session

from metrics_server.base_service import BaseService
from metrics_server.metrics_service import validate_columns


class AlertsService(BaseService):
    def __init__(self, config, services):
        super().__init__(config, services)
        self._session = self.services['CassandraService'].session

    @property
    def session(self) -> Session:
        return self._session

    def get_alert_data(self, environment, application, table, metric, measure, warning, error, start, end):
        columns, is_interval_count = validate_columns(table, [measure])
        columns = ['metric_timestamp'] + columns
        query = (
            f'SELECT {", ".join(columns)} FROM {table} '
            'WHERE environment = %s '
            'AND application = %s '
            'AND metric_name = %s '
            'AND metric_timestamp >= %s '
            'AND metric_timestamp <= %s '
        )
        rows = self.session.execute(query, [environment, application, metric, start, end]).current_rows
        warnings = []
        errors = []

        for row in rows:
            if is_interval_count:
                value = row['count'] - row['previous_count']
            else:
                value = row[measure]

            serialized = {measure: value, 'metric_timestamp': row['metric_timestamp']}

            if value >= error:
                errors.append(serialized)
            elif value >= warning:
                warnings.append(serialized)

        return warnings, errors
