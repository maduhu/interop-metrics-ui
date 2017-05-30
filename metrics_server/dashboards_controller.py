from flask import jsonify, request
from marshmallow import Schema, fields

from metrics_server.base_controller import BaseController, validate_with
from metrics_server.dashboards_service import DashboardsService
from metrics_server.errors import NotFoundError


class DashboardPostSchema(Schema):
    name = fields.Str(required=True)
    type = fields.Str(required=True)
    data = fields.Dict(required=True)


class DashboardsController(BaseController):
    @property
    def dashboards_service(self) -> DashboardsService:
        return self.services['DashboardsService']

    def get_dashboards(self):
        return jsonify(dashboards=self.dashboards_service.get_dashboards())

    @validate_with(DashboardPostSchema())
    def post_dashboards(self, body: dict):
        try:
            self.dashboards_service.create_dashboard(body['type'], body['name'], body['data'])
        except NotFoundError as e:
            return jsonify(success=False, error=str(e)), 404

        return jsonify(success=True)

    def get_dashboards_by_type(self, type_: str):
        try:
            return jsonify(dashboards=self.dashboards_service.get_dashboards(type_))
        except ValueError as e:
            return jsonify(error=str(e)), 400

    def get_dashboard(self, type_: str, name: str):
        try:
            return jsonify(dashboard=self.dashboards_service.get_dashboard(type_, name))
        except NotFoundError as e:
            return jsonify(error=str(e)), 404

    def put_dashboard(self, type_: str, name: str):
        body = request.get_json()

        if body is None:
            return jsonify(error='Request body must be JSON'), 400

        data = body.get('data')

        if data is None:
            return jsonify(error='Request body must contain "data" attribute'), 400

        try:
            self.dashboards_service.update_dashboard(type_, name, None)
        except NotFoundError as e:
            return jsonify(success=False, error=str(e)), 404

        return jsonify(success=True)

    def delete_dashboard(self, type_: str, name: str):
        try:
            self.dashboards_service.delete_dashboard(type_, name)
        except NotFoundError as e:
            return jsonify(success=False, error=str(e)), 404

        return jsonify(success=True)

    def add_routes(self):
        self.add_route('/api/v1/dashboards', self.get_dashboards, ['GET'])
        self.add_route('/api/v1/dashboards', self.post_dashboards, ['POST'])
        self.add_route('/api/v1/dashboards/<type_>', self.get_dashboards_by_type, ['GET'])
        self.add_route('/api/v1/dashboards/<type_>/<name>', self.get_dashboard, ['GET'])
        self.add_route('/api/v1/dashboards/<type_>/<name>', self.put_dashboard, ['PUT'])
        self.add_route('/api/v1/dashboards/<type_>/<name>', self.delete_dashboard, ['DELETE'])
