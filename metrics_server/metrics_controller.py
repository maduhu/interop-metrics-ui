from flask import jsonify

from metrics_server.base_controller import BaseController


class MetricsController(BaseController):
    def environments(self):
        """
        Returns all of the available environments that we can retrieve metrics for.

        :return: JSON
        """
        return jsonify(data={'environments': []})
    
    def applications(self, environment_id):
        """
        Returns all of the available applications for an environment.

        :param environment_id: The unique id of the environment.
        :return: JSON
        """
        return jsonify(data={'environment': environment_id, 'applications': []})
    
    def metrics(self, environment_id, application_id):
        """
        Returns all of hte available metrics for an account and application.

        :param environment_id: The unique id of the environment.
        :param application_id: The unique id of the application.
        :return: JSON
        """
        return jsonify(data={'environment': environment_id, 'application': application_id, 'metrics': []})
    
    def metric(self, environment_id, application_id, metric_id):
        """
        Returns all of the available data for a metric.

        :param environment_id: The unique id of the environment.
        :param application_id: The unique id of the application.
        :param metric_id: The unique id of the metric we want data for.
        :return: JSON
        """
        return jsonify(
            data={
                'environment': environment_id,
                'application': application_id,
                'metric': metric_id,
                'rows': []
            }
        )

    def add_routes(self):
        self.add_route('/api/v1/environments/', self.environments, ['GET'])
        self.add_route('/api/v1/environments/<environment_id>/applications', self.applications, ['GET'])
        self.add_route('/api/v1/environments/<environment_id>/applications/<application_id>/metrics', self.metrics,
                       ['GET'])
        self.add_route('/api/v1/environments/<environment_id>/applications/<application_id>/metrics/<metric_id>',
                       self.metric, ['GET'])
