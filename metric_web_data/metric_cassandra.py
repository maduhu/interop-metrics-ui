from cassandra.cluster import Cluster
from metric_web_data.metric_metadata import Application, Environment, Metric

cluster = Cluster(['52.26.168.223'])
session = cluster.connect('metric_data')


def get_available_metrics_metadata(metric_table, available_metric_statistics):
    environments = {}
    applications = {}

    rows = session.execute('select distinct environment, application, metric_name from %s' % metric_table)

    for metric_name_row in rows:
        env_key = metric_name_row.environment
        env_app_key = metric_name_row.environment + '.' + metric_name_row.application
        new_metric = Metric(metric_name_row.metric_name, available_metric_statistics)
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
    counter_statistics = ['count', 'previous_count']
    return get_available_metrics_metadata('metric_data.raw_counter_with_interval', counter_statistics)


def get_timer_metadata():
    timer_statistics = ['count', 'previous_count', 'p75', 'p95', 'p98', 'p99', 'p999', 'one_min_rate', 'fifteen_min_rate', 'five_min_rate', 'max', 'mean', 'mean_rate', 'median', 'min', 'std_dev']
    return get_available_metrics_metadata('metric_data.raw_timer_with_interval', timer_statistics)


def get_counter_metric_timeseries(statistics, environment, application, metric_name, from_timestamp, end_timestamp=None):
    return get_metric_timeseries('metric_data.raw_counter_with_interval', statistics, environment, application, metric_name, from_timestamp, end_timestamp)


def get_timer_metric_timeseries(statistics, environment, application, metric_name, from_timestamp, end_timestamp=None):
    return get_metric_timeseries('metric_data.raw_timer_with_interval', statistics, environment, application, metric_name, from_timestamp, end_timestamp)


def get_metric_timeseries(table, statistics, environment, application, metric_name, from_timestamp, end_timestamp=None):
    columns = ', '.join(statistics)
    query = 'select metric_timestamp, previous_metric_timestamp, ' + columns + ' from ' + table + ' where environment = %s and ' \
                                                    'application = %s and metric_name = %s and metric_timestamp >= %s'
    params = [environment, application, metric_name, from_timestamp]
    if end_timestamp is not None:
        query += ' and metric_timestamp <= %s'
        params += end_timestamp
    query += ' limit 100'
    print(query)

    rows = session.execute(query, params)
    timeseries = []
    for row in rows:
        timeseries.append(row)

    return timeseries
