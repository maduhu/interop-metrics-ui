import json

from cassandra.cluster import Session

from metrics_server.base_service import BaseService
from metrics_server.errors import NotFoundError

DASHBOARD_TYPES = ('metric', 'alert')
INSERT_CQL = 'INSERT INTO dashboards (type, name, data) VALUES (%s, %s, %s) IF NOT EXISTS;'
UPDATE_CQL = 'UPDATE dashboards SET data = %s WHERE type = %s AND name = %s;'
DELETE_CQL = 'DELETE FROM dashboards WHERE type = %s and name = %s;'


class DashboardsService(BaseService):
    """
    Service used to create, retrieve, update, and delete dashboards.
    """
    def __init__(self, config, services):
        super().__init__(config, services)
        self._session = self.services['CassandraService'].session

    @property
    def session(self) -> Session:
        return self._session

    def get_dashboards(self, type_=None):
        if type_ is not None and type_ not in DASHBOARD_TYPES:
            raise ValueError(f'Invalid dashboard type "{type_}"')

        query = 'SELECT * FROM dashboards'
        params = None

        if type_ is not None:
            query += ' WHERE type = %s'
            params = [type_]

        rows = self.session.execute(query, params)
        dashboards = []

        for row in rows:
            dashboards.append({
                'type': row['type'],
                'name': row['name'],
                'data': json.loads(row['data']),
            })

        return dashboards

    def get_dashboard(self, type_, name):
        query = 'SELECT * FROM dashboards WHERE type = %s AND name = %s'
        rows = self.session.execute(query, [type_, name]).current_rows

        if len(rows) == 0:
            raise NotFoundError(f'No dashboard found with type = "{type_}" and name = "{name}"')

        row = rows[0]

        return {
            'type': row['type'],
            'name': row['name'],
            'data': json.loads(row['data']),
        }

    def create_dashboard(self, type_, name, data):
        if type_ is not None and type_ not in DASHBOARD_TYPES:
            raise ValueError(f'Invalid dashboard type "{type_}"')

        data = json.dumps(data)
        resp = self.session.execute(INSERT_CQL, [type_, name, data])[0]

        if resp['[applied]'] is False:
            raise ValueError(f'Dashboard with type "{type_}" and name "{name}" already exists')

    def update_dashboard(self, type_, name, data):
        # Raise a not found error if the dashboard does not exist.
        self.get_dashboard(type_, name)
        data = json.dumps(data)
        self.session.execute(UPDATE_CQL, [type_, name, data])

    def delete_dashboard(self, type_, name):
        # Raise a not found error if the dashboard does not exist.
        self.get_dashboard(type_, name)
        self.session.execute(DELETE_CQL, [type_, name])


if __name__ == '__main__':
    from metrics_server.cassandra_service import CassandraService
    config = {'cassandra': {'host': 'localhost'}}
    services = {}
    services['CassandraService'] = CassandraService(config, services)
    ds = DashboardsService(config, services)
    dashboards = ds.get_dashboards()
    print(f'There are {len(dashboards)} dashboards')
    # dash_data = {'name': 'test_2', 'charts': [], 'version': '3.0'}
    # # ds.create_dashboard('metric', 'test_3', dash_data)
    # dashboard = ds.get_dashboard('metric', 'test_2')
    # print(dashboard)
    ds.delete_dashboard('metric', 'test_2')
    dashboards = ds.get_dashboards()
    print(f'There are {len(dashboards)} dashboards')
    ds.get_dashboard('metric', 'test_2')
