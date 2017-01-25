from flask import render_template

from metrics_server.base_controller import BaseController


class CoreController(BaseController):
    def index(self):
        """
        Returns the index.html template file.

        TODO: Actually render something in the index.html.

        :return:
        """
        return render_template('index.html')

    def add_routes(self):
        self.add_route('/', self.index, ['GET'])
