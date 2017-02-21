from datetime import datetime

import pytest
import dateutil
from dateutil.parser import parse

from metrics_server.errors import ConfigurationError, NotFoundError
from metrics_server.metrics_service import MetricsService, TABLE_NAMES


def metric_key(m):
    return m['metric_name'] + m['table']

@pytest.fixture()
def counter_metrics():
    return [{
        'application': 'test_app_1',
        'environment': 'dev',
        'metric_name': 'my.test.counter'
    }, {
        'application': 'test_app_1',
        'environment': 'staging',
        'metric_name': 'my.test.counter'
    }, {
        'application': 'test_app_1',
        'environment': 'prod',
        'metric_name': 'my.test.counter'
    }, {
        'application': 'test_app_1',
        'environment': 'prod',
        'metric_name': 'another.test.metric.counter'
    }, {
        'application': 'test_app_2',
        'environment': 'dev',
        'metric_name': 'counter.one'
    }, {
        'application': 'test_app_2',
        'environment': 'dev',
        'metric_name': 'my.test.counter'
    }, {
        'application': 'test_app_2',
        'environment': 'dev',
        'metric_name': 'counter.two'
    }]


@pytest.fixture()
def timer_metrics():
    return [{
        'application': 'test_app_1',
        'environment': 'dev',
        'metric_name': 'my.test.timer'
    }, {
        'application': 'test_app_1',
        'environment': 'staging',
        'metric_name': 'my.test.timer'
    }, {
        'application': 'test_app_1',
        'environment': 'prod',
        'metric_name': 'my.test.timer'
    }, {
        'application': 'test_app_1',
        'environment': 'dev',
        'metric_name': 'another.test.timer'
    }, {
        'application': 'test_app_2',
        'environment': 'dev',
        'metric_name': 'timer.one'
    }, {
        'application': 'test_app_2',
        'environment': 'dev',
        'metric_name': 'timer.two'
    }]


@pytest.fixture()
def patched_ms(mocker):
    mocker.patch('metrics_server.metrics_service.Cluster')
    return MetricsService({'cassandra': {'host': '0.0.0.0'}}, {})


def test_init(patched_ms):
    """
    Tests the initialization of the MetricsService class

    :param mocker: pytest.mock fixture
    :return:
    """
    assert patched_ms.cluster is not None
    assert patched_ms.session is not None


def test_no_cassandra():
    with pytest.raises(ConfigurationError):
        MetricsService({}, {})


def test_no_host():
    with pytest.raises(ConfigurationError):
        MetricsService({'cassandra': {}}, {})


def test_get_distinct_metrics_for_table(patched_ms: MetricsService):
    patched_ms.session.execute.return_value = [{}, {}]

    metrics = patched_ms.get_distinct_metrics_for_table('test_table')

    assert len(metrics) == 2
    assert metrics[0]['table'] == 'test_table'


def test_get_all_distinct_metrics(patched_ms: MetricsService):
    """
    Tests that we query all of the tables in metrics_service.TABLE_NAMES, and that each row returned has the table name
    injected into it.

    :param patched_ms: fixture
    :return:
    """
    patched_ms.session.execute.side_effect = [[{}], [{}]]
    metrics = patched_ms.get_all_distinct_metrics()

    for idx, name in enumerate(TABLE_NAMES):
        assert metrics[idx]['table'] == name


def test_get_environments(patched_ms: MetricsService, counter_metrics, timer_metrics):
    patched_ms.session.execute.side_effect = [counter_metrics, timer_metrics]
    expected = {'dev', 'staging', 'prod'}
    environments = patched_ms.get_environments()

    assert expected == set(environments)


@pytest.mark.parametrize(
    'environment,expected',
    [
        ('prod', {'test_app_1', }),
        ('staging', {'test_app_1'}),
        ('dev', {'test_app_1', 'test_app_2', }),
        ('not_in_data', set())
    ]
)
def test_get_applications(patched_ms: MetricsService, counter_metrics, timer_metrics, environment, expected):
    patched_ms.session.execute.side_effect = [counter_metrics, timer_metrics]
    environments = patched_ms.get_applications(environment)

    assert expected == set(environments)


@pytest.mark.parametrize(
    'environment,application,expected',
    [
        ('dev', 'test_app_1', [
            {'metric_name': 'my.test.counter', 'table': 'raw_counter_with_interval'},
            {'metric_name': 'my.test.timer', 'table': 'raw_timer_with_interval'},
            {'metric_name': 'another.test.timer', 'table': 'raw_timer_with_interval'}
        ]),
        ('prod', 'test_app_2', []),
        ('dev', 'not_in_the_data', []),
        ('not_in_the_data', 'neither_is_this', [])
    ]
)
def test_get_metrics(patched_ms: MetricsService, counter_metrics, timer_metrics, environment, application, expected):
    patched_ms.session.execute.side_effect = [counter_metrics, timer_metrics]
    metrics = sorted(patched_ms.get_metrics(environment, application), key=metric_key)
    expected = sorted(expected, key=metric_key)

    assert expected == metrics


@pytest.mark.parametrize('args,expected', [
    (['', '', 'not_real_table', '', []], 'table "not_real_table"'),
    (['', '', TABLE_NAMES[0], '', ['not_real_column']], 'column "not_real_column"')
])
def test_get_metric_data_invalid_args(patched_ms: MetricsService, args, expected):
    with pytest.raises(NotFoundError) as exc_info:
        patched_ms.get_metric_data(*args)

    assert expected in str(exc_info.value)


def test_get_metric_data(patched_ms: MetricsService):
    """
    The main thing that we do to the data on the way out is
    :param patched_ms:
    :return:
    """
    test_date = datetime.utcnow()
    patched_ms.session.execute.side_effect = [
        [{'metric_timestamp': test_date, 'previous_metric_timestamp': test_date}]
    ]
    metric_data = patched_ms.get_metric_data('dev', 'fake_app', 'raw_counter_with_interval', 'fake_metric', ['count'])
    metric_timestamp = metric_data[0]['metric_timestamp']
    previous_metric_timestamp = metric_data[0]['previous_metric_timestamp']

    assert isinstance(metric_timestamp, str)
    assert parse(metric_timestamp).tzinfo == dateutil.tz.tzutc()
    assert isinstance(previous_metric_timestamp, str)
    assert parse(previous_metric_timestamp).tzinfo == dateutil.tz.tzutc()
