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


def validate_with(schema, validate_query_args: bool=False):
    """
    Validates that the body of the request is valid JSON and checks that it is valid according to the Marshmallow schema
    passed into the decorator.

    :param schema: An instantiated Marshmallow schema.
    :param validate_query_args: bool, flag to validate query args. Defaults to False.
    :return:
    """
    def decorator(fun):
        @functools.wraps(fun)
        def wrapper(*args, **kwargs):
            data_to_validate = {}  # Everything to be validated will get merged into this dict
            body = request.get_json()
            query_args = request.args

            if body is None and query_args is False:
                return jsonify(error='Request body must be JSON'), 400

            if body is not None:
                data_to_validate.update(body)

            if validate_query_args is True:
                # Note the usage of flat=True here, this means the Werkzeug MultiDict class will lose data, so this
                # may not be ideal for parsing query_args. We may want to make this configurable in the future if we
                # find ourselves needing to leverage MultiDict functionality.
                data_to_validate.update(query_args.to_dict(flat=True))

            data, errors = schema.load(data_to_validate)

            if len(errors) > 0:
                return jsonify(errors=errors), 400

            kwargs['body'] = data

            return fun(*args, **kwargs)

        return wrapper

    return decorator
