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
        """
        Retrieves all dashboards.

        :return: JSON
        """
        return jsonify(dashboards=self.dashboards_service.get_dashboards())

    @validate_with(DashboardPostSchema())
    def post_dashboards(self, body: dict):
        """
        Creates a new dashboard.

        :param body: A dict that has been validated against DashboardPostSchema.
        :return: JSON
        """
        try:
            self.dashboards_service.create_dashboard(body['type'], body['name'], body['data'])
        except ValueError as e:
            return jsonify(success=False, error=str(e)), 400

        return jsonify(success=True)

    def get_dashboards_by_type(self, type_: str):
        """
        Retrieves dashboards by type.

        :param type_: The type of dashboard to retrieve.
        :return:
        """
        try:
            return jsonify(dashboards=self.dashboards_service.get_dashboards(type_))
        except ValueError as e:
            return jsonify(error=str(e)), 400

    def get_dashboard(self, type_: str, name: str):
        """
        Fetches dashboard from database given type and name.

        :param type_: str, the type of dashboard
        :param name: str, the name of the dashboard
        :return:
        """
        try:
            return jsonify(dashboard=self.dashboards_service.get_dashboard(type_, name))
        except NotFoundError as e:
            return jsonify(error=str(e)), 404

    def put_dashboard(self, type_: str, name: str):
        """
        Allows a user to modify a dashboard. Currently only allows for updating the data attribute of a dashboard, and
        not renaming it.

        :param type_: str, the type of dashboard
        :param name: str, the name of the dashboard
        :return: JSON response.
        """
        body = request.get_json()

        if body is None:
            return jsonify(error='Request body must be JSON'), 400

        data = body.get('data')

        if data is None:
            return jsonify(error='Request body must contain "data" attribute'), 400

        try:
            self.dashboards_service.update_dashboard(type_, name, data)
        except NotFoundError as e:
            return jsonify(success=False, error=str(e)), 404

        return jsonify(success=True)

    def delete_dashboard(self, type_: str, name: str):
        """
        Deletes a dashboard with a given type and name.

        :param type_: str, the type of dashboard
        :param name: str, the name of the dashboard
        :return:
        """
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
