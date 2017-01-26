import os

from flask import Flask

from metrics_server.core_controller import CoreController
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

        module_dir = os.path.dirname(os.path.realpath(__file__))
        template_dir = module_dir + '/templates'
        static_folder = os.path.realpath(config['server']['assets'])

        self.flask_app = Flask(__name__, template_folder=template_dir, static_folder=static_folder)
        self.flask_app.debug = config.get('debug')
        self.init_services()
        self.init_controllers()

    def add_service(self, service_class):
        """
        Instantiates and adds a service to the services dict.

        :param service_class: The class the instantiate.
        :return:
        """
        self.services[service_class.__name__] = service_class(self.config, self.services)

    def init_services(self):
        """
        Initialize all service classes needed to bootstrap the metrics server.

        :return:
        """
        self.add_service(MetricsService)

    def add_controller(self, controller_class):
        """
        Instantiates and adds a controller to the controllers dict.

        :param controller_class: The class to instantiate
        :return:
        """
        self.controllers[controller_class.__name__] = controller_class(self.config, self.flask_app, self.services)

    def init_controllers(self):
        """
        Initialize all controllers needed to bootstrap the metrics server.

        :return:
        """
        self.add_controller(CoreController)
        self.add_controller(MetricsController)
