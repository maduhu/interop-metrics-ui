class Environment:
    def __init__(self, environment_name):
        self.environment_name = environment_name
        self.apps = set()

    def add_application(self, app):
        self.apps.add(app)


class Application:
    def __init__(self, application_name):
        self.application_name = application_name
        self.metrics = set()

    def add_metric(self, metric):
        self.metrics.add(metric)

    def get_metric_root_categories(self):
        pass


class Metric:
    def __init__(self, metric_name):
        self.metric_name = metric_name

# nohup  sudo bin/kafka-server-start.sh config/server.properties > kafka.log &
# nohup sudo bin/zookeeper-server-start.sh config/zookeeper.properties > zookeeper.log &