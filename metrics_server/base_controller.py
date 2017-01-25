from abc import ABCMeta, abstractmethod

from flask import Flask


class BaseController(metaclass=ABCMeta):
    def __init__(self, config, flask_app: Flask, services):
        self.config = config
        self.flask_app = flask_app
        self.services = services
        self.add_routes()

    def add_route(self, path, fn, methods):
        """
        Add a new route to the Flask object. Similar to the @route decorator.
        :param path: The URL path to add
        :param fn: The method to execute when the URL is matched.
        :param methods: A list of the methods allowed.
        :return:
        """
        self.flask_app.add_url_rule(path, fn.__name__, fn, methods=methods)

    @abstractmethod
    def add_routes(self):
        raise NotImplementedError()
