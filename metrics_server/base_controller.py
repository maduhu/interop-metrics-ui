import functools
from abc import ABCMeta, abstractmethod

from flask import Flask, request, jsonify


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


def validate_with(schema):
    """
    Validates that the body of the request is valid JSON and checks that it is valid according to the Marshmallow schema
    passed into the decorator.

    :param schema: An instantiated Marshmallow schema. 
    :return: 
    """
    def decorator(fun):
        @functools.wraps(fun)
        def wrapper(*args, **kwargs):
            body = request.get_json()

            if body is None:
                return jsonify(error='Request body must be JSON'), 400

            data, errors = schema.load(body)

            if len(errors) > 0:
                return jsonify(errors=errors), 400

            kwargs['body'] = data

            return fun(*args, **kwargs)

        return wrapper

    return decorator
