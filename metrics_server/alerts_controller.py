from flask import jsonify
from marshmallow import Schema, fields

from metrics_server.alerts_service import AlertsService
from metrics_server.base_controller import BaseController, validate_with


class AlertSchema(Schema):
    measure = fields.String(required=True)
    # TODO: add validation that checks if warning is less than error
    warning = fields.Float(required=True)
    error = fields.Float(required=True)
    start = fields.DateTime(required=True)
    end = fields.DateTime(required=True)


class FakeSchema(Schema):
    hello = fields.String(required=True)


class AlertsController(BaseController):
    @property
    def alerts_service(self) -> AlertsService:
        return self.services['AlertsService']

    @validate_with(AlertSchema(), validate_query_args=True)
    def alert(self, env, app, table, metric, body: dict):
        warnings, errors = self.alerts_service.get_alert_data(env, app, table, metric, body['measure'], body['warning'],
                                                              body['error'], body['start'], body['end'])
        return jsonify(warnings=warnings, errors=errors), 200

    def add_routes(self):
        self.add_route('/api/v1/alerts/<env>/<app>/<table>/<metric>', self.alert, ['GET'])
