import json

from cassandra.cluster import Session

from metrics_server.base_service import BaseService
from metrics_server.errors import NotFoundError

DASHBOARD_TYPES = ('time_series', 'alert')
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
        """
        Retrieves dashboards from database by type, if type is not specified it retrieves all dashboards.

        :param type_:
        :return:
        """
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
        """
        Retrieves dashboard from database by type and name. Raises a NotFoundError if not found.

        :param type_: str, the type of dashboard
        :param name: str, the name of the dashboard
        :return: dict representation of dashboard object
        """
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
        """
        Adds a new dashboard to the database. Raises a ValueError if a dashboard already exists with the given name
        and type, or if an invalid type is provided.

        :param type_: str, the type of dashboard
        :param name: str, the name of the dashboard
        :param data: dict, the data for the dashboard
        :return: None
        """
        if type_ is not None and type_ not in DASHBOARD_TYPES:
            raise ValueError(f'Invalid dashboard type "{type_}"')

        data = json.dumps(data)
        resp = self.session.execute(INSERT_CQL, [type_, name, data])[0]

        if resp['[applied]'] is False:
            raise ValueError(f'Dashboard with type "{type_}" and name "{name}" already exists')

    def update_dashboard(self, type_, name, data):
        """
        Updates an already existing dashboard. Raises a NotFoundError if no dashboard exists with the specified type
        and name.

        :param type_: str, the type of dashboard
        :param name: str, the name of the dashboard
        :param data: dict, the data for the dashboard
        :return: None
        """
        # Raise a not found error if the dashboard does not exist.
        self.get_dashboard(type_, name)
        data = json.dumps(data)
        self.session.execute(UPDATE_CQL, [type_, name, data])

    def delete_dashboard(self, type_, name):
        """
        Deletes a dashboard. Raises a NotFoundError if no dashboard exists with the specified type and name.

        :param type_: str, the type of dashboard
        :param name: str, the name of the dashboard
        :return: None
        """
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
