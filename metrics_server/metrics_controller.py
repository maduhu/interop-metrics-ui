import pytz
from dateutil.parser import parse
from flask import jsonify
from flask import request

from metrics_server.base_controller import BaseController
from metrics_server.metrics_service import MetricsService


class MetricsController(BaseController):
    @property
    def metrics_service(self) -> MetricsService:
        return self.services['MetricsService']

    def environments(self):
        """
        Returns all of the available environments that we can retrieve metrics for.

        :return: JSON
        """
        return jsonify(data={'environments': self.metrics_service.get_environments()})
    
    def applications(self, env):
        """
        Returns all of the available applications for an environment.

        :param env: The environment.
        :return: JSON
        """
        return jsonify(data={'environment': env, 'applications': self.metrics_service.get_applications(env)})
    
    def metrics(self, env, app):
        """
        Returns all of the available metrics for an account and application. Each metric belongs to a table

        :param env: The environment.
        :param app: The application.
        :return: JSON
        """
        return jsonify(
            data={
                'environment': env,
                'application': app,
                'metrics': self.metrics_service.get_available_metrics(env, app)
            }
        )

    @staticmethod
    def _parse_timestamp(timestamp):
        gmt = pytz.timezone('GMT')

        if timestamp is not None:
            timestamp = parse(timestamp)

            if timestamp.tzinfo is None:
                timestamp = gmt.localize(timestamp)
            else:
                timestamp = timestamp.astimezone(gmt)

        return timestamp
    
    def metric(self, env, app, table, metric):
        """
        Returns all of the available data for a metric.

        :param env: The environment we want data from.
        :param app: The application we want data from.
        :param table: The table we want data from.
        :param metric: The metric we want data from.
        :return: JSON
        """

        try:
            start_timestamp = self._parse_timestamp(request.args.get('start_timestamp', None))
        except ValueError:
            return jsonify(error='Invalid start_timestamp'), 400

        try:
            end_timestamp = self._parse_timestamp(request.args.get('end_timestamp', None))
        except ValueError:
            return jsonify(error='Invalid end_timestamp'), 400

        return jsonify(
            data={
                'environment': env,
                'application': app,
                'table': table,
                'metric': metric,
                'rows': self.metrics_service.get_metrics_data(env, app, table, metric, start_timestamp, end_timestamp)
            }
        )

    def add_routes(self):
        self.add_route('/api/v1/environments/', self.environments, ['GET'])
        self.add_route('/api/v1/environments/<env>/applications', self.applications, ['GET'])
        self.add_route('/api/v1/environments/<env>/applications/<app>/metrics', self.metrics, ['GET'])
        self.add_route('/api/v1/environments/<env>/applications/<app>/metrics/<table>/<metric>', self.metric, ['GET'])
