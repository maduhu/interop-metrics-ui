from cassandra.cluster import Cluster, dict_factory

from metrics_server.base_service import BaseService
from metrics_server.errors import ConfigurationError

KEYSPACE = 'metric_data'


class CassandraService(BaseService):
    """
    This service just stores a cluster and connection configured for the metric_data keyspace. Use this in your other
    services if you don't need any special settings.
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
