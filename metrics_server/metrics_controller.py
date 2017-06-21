import pytz
from dateutil.parser import parse
from flask import jsonify
from flask import request

from metrics_server.base_controller import BaseController
from metrics_server.errors import NotFoundError
from metrics_server.metrics_service import MetricsService


class MetricsController(BaseController):
    @property
    def metrics_service(self) -> MetricsService:
        return self.services['MetricsService']

    def distinct_metrics(self):
        """
        Retrieves the list of distinct metrics from the database.
        :return:
        """
        return jsonify(data={'metrics': self.metrics_service.get_all_distinct_metrics()})

    @staticmethod
    def _parse_timestamp(timestamp):
        if timestamp is not None:
            timestamp = parse(timestamp)

            if timestamp.tzinfo is None:
                timestamp = pytz.utc.localize(timestamp)
            else:
                timestamp = timestamp.astimezone(pytz.utc)

        return timestamp

    def metric(self, table, env, app, metric):
        """
        Returns all of the available data for a metric.

        :param env: The environment we want data from.
        :param app: The application we want data from.
        :param table: The table we want data from.
        :param metric: The metric we want data from.
        :return: JSON
        """

        cols = request.args.get('columns', '').split(',')
        cols = [col.strip() for col in cols if col.strip() != '']

        if len(cols) == 0:
            return jsonify(error='You must specify at least one column'), 400

        try:
            size = int(request.args.get('size', ''))
        except ValueError:
            size = 1000

        try:
            start_ts = self._parse_timestamp(request.args.get('start_timestamp', None))
        except ValueError:
            return jsonify(error='Invalid start_timestamp'), 400

        try:
            end_ts = self._parse_timestamp(request.args.get('end_timestamp', None))
        except ValueError:
            return jsonify(error='Invalid end_timestamp'), 400

        try:
            rows = self.metrics_service.get_metric_data(env, app, table, metric, cols, start_ts, end_ts, size)
        except NotFoundError as e:
            return jsonify(error=str(e)), 404

        # TODO: return a generator so we can stream the data to the client, this allows for us to quickly start sending
        # the response.
        # https://blog.al4.co.nz/2016/01/streaming-json-with-flask/
        # http://flask.pocoo.org/docs/0.12/patterns/streaming/

        return jsonify(
            data={
                'environment': env,
                'application': app,
                'table': table,
                'metric': metric,
                'rows': rows  # This is a DataFrame, to see how it's encoded take a look at data_frame_encoder.py
            }
        )

    def add_routes(self):
        self.add_route('/api/v1/metrics', self.distinct_metrics, ['GET'])
        self.add_route('/api/v1/metrics/<table>/<env>/<app>/<metric>', self.metric, ['GET'])
