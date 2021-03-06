from typing import Type

from flask import Flask

from metrics_server.alerts_controller import AlertsController
from metrics_server.alerts_service import AlertsService
from metrics_server.cassandra_service import CassandraService
from metrics_server.dashboards_controller import DashboardsController
from metrics_server.dashboards_service import DashboardsService
from metrics_server.data_frame_encoder import DataFrameEncoder
from metrics_server.metrics_controller import MetricsController
from metrics_server.metrics_service import MetricsService


class App:
    """
    App is a class that contains everything needed to bootstrap a Flask application and serve the metrics server.
    """
    def __init__(self, config):
        self.config = config
        self.controllers = {}
        self.services = {}
        self.flask_app = Flask(__name__)
        self.flask_app.json_encoder = DataFrameEncoder
        self.flask_app.debug = config.get('debug', False)
        self._init_services()
        self._init_controllers()

    def add_service(self, service_class: Type):
        """
        Instantiates and adds a service to the services dict.

        :param service_class: The class the instantiate.
        :return:
        """
        self.services[service_class.__name__] = service_class(self.config, self.services)

    def _init_services(self):
        """
        Initialize all service classes needed to bootstrap the metrics server.

        :return:
        """
        self.add_service(CassandraService)
        self.add_service(MetricsService)
        self.add_service(DashboardsService)
        self.add_service(AlertsService)

    def add_controller(self, controller_class: Type):
        """
        Instantiates and adds a controller to the controllers dict.

        :param controller_class: The class to instantiate
        :return:
        """
        self.controllers[controller_class.__name__] = controller_class(self.config, self.flask_app, self.services)

    def _init_controllers(self):
        """
        Initialize all controllers needed to bootstrap the metrics server.

        :return:
        """
        self.add_controller(MetricsController)
        self.add_controller(DashboardsController)
        self.add_controller(AlertsController)
