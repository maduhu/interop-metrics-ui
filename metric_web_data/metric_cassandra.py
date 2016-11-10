from cassandra.cluster import Cluster
from metric_web_data.category import *

cluster = Cluster(['52.26.168.223'])
session = cluster.connect('metric_data')


def get_available_metrics_metadata(metric_table):
    environments = {}
    applications = {}

    rows = session.execute('select distinct environment, application, metric_name from %s' % metric_table)

    for metric_name_row in rows:
        env_key = metric_name_row.environment
        env_app_key = metric_name_row.environment + '.' + metric_name_row.application
        new_metric = Metric(metric_name_row.metric_name)
        if env_key not in environments:
            new_env = Environment(metric_name_row.environment)
            new_app = Application(metric_name_row.application)
            new_app.add_metric(new_metric)
            new_env.add_application(new_app)
            environments[new_env.environment_name] = new_env
            applications[env_app_key] = new_app
        elif env_app_key not in applications:
            new_app = Application(metric_name_row.application)
            new_app.add_metric(new_metric)
            applications[env_app_key] = new_app
            environments[env_key].add_application(new_app)
        else:
            applications[env_app_key].add_metric(new_metric)

    return environments.values()


def get_counter_metadata():
    return get_available_metrics_metadata('metric_data.raw_counter_with_interval')


def get_timer_metadata():
    return get_available_metrics_metadata('metric_data.raw_timer_with_interval')

# timer_rows = session. execute('select * from metric_data.raw_timer_with_interval limit 100')
# for timer_row in timer_rows:
#     print (timer_row.environment, timer_row.application, timer_row.metric_name, timer_row.metric_timestamp, timer_row.mean, timer_row.p99)