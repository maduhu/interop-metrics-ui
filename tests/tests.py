from metric_web_data.metric_cassandra import *
from metric_web_data.metric_metadata import Environment, Application, Metric

env = Environment("test_env")
app = Application("test_app")
metric_1 = Metric("a.b.c", ['col1', 'col2'])
metric_2 = Metric("a.b.d", ['col3'])

app.add_metric(metric_1)
app.add_metric(metric_2)

env.add_application(app)

available_counter_metrics = get_counter_metadata()
for env in available_counter_metrics:
    print(env.environment_name)
    for app in env.apps:
        print('-' + app.application_name)
        for metric in app.metrics:
            print('--' + metric.metric_name)

result = get_counter_metric_timeseries(['count'], 'ft-env', 'ft-app', 'my.counter', '2011-02-03 04:05')
[print(row) for row in result]

result = get_timer_metric_timeseries(['mean', 'p99'], 'dev-dfsp1', 'interop-spsp-clientproxy', 'l1p.spsp.payments.api.PaymentsPutProxyTime', '2011-02-03 04:05')
[print(row) for row in result]
