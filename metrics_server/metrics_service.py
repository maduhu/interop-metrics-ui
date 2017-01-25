from metrics_server.base_service import BaseService


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
        print(config)

    def get_environments(self):
        """
        Retrieve environments from DB

        :return: list of strings
        """
        pass

    def get_applications(self, environment):
        """
        Retrieve applications from DB for a given environment.

        :param environment: The environment you want to get applications from.
        :return: list of strings
        """
        pass

    def get_available_metrics(self, environment, application):
        """
        Retrieve available metrics from DB for a given environment and application.

        :param environment: The environment you want to get metrics from.
        :param application: The application you want to get metrics from.
        :return: list of strings
        """
        pass

    def get_metrics_data(self, environment, application, metric):
        """
        Retrieve data from DB for a given environment, application, and metric.

        TODO: will probably want to allow this method to limit the number of rows returned.

        :param environment: The environment you want to retrieve data for.
        :param application: The application you want to retrieve data for.
        :param metric: The metric you want to retrieve data for.
        :return: list of rows.
        """
        pass
