import json
from datetime import datetime, timedelta

import pytest
import pytz
from dateutil.parser import parse

from metrics_server.cassandra_service import CassandraService
from metrics_server.errors import ConfigurationError, NotFoundError
from metrics_server.metrics_service import MetricsService, TABLE_NAMES
from tests.utils import MockResultSet

TEST_DATE = datetime(2017, 1, 1, tzinfo=pytz.UTC).isoformat()


def metric_key(m):
    """
    Key function for sorting metrics returned from MetricsService.get_metrics

    :param m: dict
    :return: str
    """
    return m['metric_name'] + m['table']


@pytest.fixture()
def counter_metrics():
    """
    fixture to return some fake counter metrics. These are not constants because the MetricsService does mutate the data
    returned from Cassandra, which could lead to some subtle bugs in the test code if re-used.

    :return: list[dict]
    """
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
    """
    fixture to return some fake timer metrics. These are not constants because the MetricsService does mutate the data
    returned from Cassandra, which could lead to some subtle bugs in the test code if re-used.

    :return: list[dict]
    """
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
def metric_data():
    """
    Reads some test data from a JSON file and puts it into a MockResultSet. Used to test that we properly downsample
    large datasets. This dataset is 2097 rows.

    :return:
    """
    with open('./tests/data/get_metric_data.json') as f:
        data = json.load(f)

    for row in data:
        row['metric_timestamp'] = parse(row['metric_timestamp'])

    return MockResultSet(data)


def test_get_distinct_metrics_for_table(patched_ms: MetricsService):
    """
    Test that get_distinct_metrics_for_table injects table name into returned results.

    :param patched_ms: fixture
    :return:
    """
    fake_metrics = [
        {'environment': 'foo', 'application': 'bar', 'metric_name': 'baz_one'},
        {'environment': 'foo', 'application': 'bar', 'metric_name': 'baz_two'}
    ]
    fake_ts = [{'metric_timestamp': datetime.now()}]
    patched_ms.session.execute.side_effect = [fake_metrics, fake_ts, fake_ts]
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
    fake_ts = [{'metric_timestamp': datetime.now()}]
    fake_counters = [{'environment': 'foo', 'application': 'bar', 'metric_name': 'baz_counter'}]
    fake_timers = [{'environment': 'foo', 'application': 'bar', 'metric_name': 'baz_timer'}]
    patched_ms.session.execute.side_effect = [fake_counters, fake_ts, fake_timers, fake_ts]
    metrics = patched_ms.get_all_distinct_metrics()

    for idx, name in enumerate(TABLE_NAMES):
        assert metrics[idx]['table'] == name


def test_get_environments(patched_ms: MetricsService, counter_metrics, timer_metrics):
    """
    Test that get_environments works as expected.

    :param patched_ms: fixture
    :param counter_metrics: fixture
    :param timer_metrics: fixture
    :return:
    """
    counter_timestamps = [[{'metric_timestamp': datetime.now()}] for x in counter_metrics]
    timer_timestamps = [[{'metric_timestamp': datetime.now()}] for x in timer_metrics]
    patched_ms.session.execute.side_effect = [counter_metrics] + counter_timestamps + [timer_metrics] + timer_timestamps
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
    """
    Test that get_applications works as expected.

    :param patched_ms: fixture
    :param counter_metrics: fixture
    :param timer_metrics: fixture
    :param environment: environment to query for
    :param expected: expected result
    :return:
    """
    counter_timestamps = [[{'metric_timestamp': datetime.now()}] for x in counter_metrics]
    timer_timestamps = [[{'metric_timestamp': datetime.now()}] for x in timer_metrics]
    patched_ms.session.execute.side_effect = [counter_metrics] + counter_timestamps + [timer_metrics] + timer_timestamps
    environments = patched_ms.get_applications(environment)

    assert expected == set(environments)


@pytest.mark.parametrize(
    'environment,application,expected',
    [
        ('dev', 'test_app_1', [
            {'metric_name': 'my.test.counter', 'table': 'raw_counter_with_interval', 'last_timestamp': TEST_DATE,
             'duration_unit': None, 'rate_unit': None},
            {'metric_name': 'my.test.timer', 'table': 'raw_timer_with_interval', 'last_timestamp': TEST_DATE,
             'duration_unit': 'milliseconds', 'rate_unit': 'calls/second'},
            {'metric_name': 'another.test.timer', 'table': 'raw_timer_with_interval', 'last_timestamp': TEST_DATE,
             'duration_unit': 'milliseconds', 'rate_unit': 'calls/second'},
        ]),
        ('prod', 'test_app_2', []),
        ('dev', 'not_in_the_data', []),
        ('not_in_the_data', 'neither_is_this', [])
    ]
)
def test_get_metrics(patched_ms: MetricsService, counter_metrics, timer_metrics, environment, application, expected):
    """
    Test that get_metrics works as intended.

    :param patched_ms: fixture
    :param counter_metrics: fixture
    :param timer_metrics: fixture
    :param environment: environment to query for
    :param application: application to query for
    :param expected: expected result
    :return:
    """
    mt = datetime(2017, 1, 1)
    du = 'milliseconds'
    ru = 'calls/second'
    counter_timestamps = [[{'metric_timestamp': mt}] for _ in counter_metrics]
    timer_timestamps = [[{'metric_timestamp': mt, 'duration_unit': du, 'rate_unit': ru}] for _ in timer_metrics]
    patched_ms.session.execute.side_effect = [counter_metrics] + counter_timestamps + [timer_metrics] + timer_timestamps
    metrics = sorted(patched_ms.get_metrics(environment, application), key=metric_key)
    expected = sorted(expected, key=metric_key)

    assert expected == metrics


@pytest.mark.parametrize(
    'args,expected',
    [
        (['', '', 'not_real_table', '', []], 'table "not_real_table"'),
        (['', '', TABLE_NAMES[0], '', ['not_real_column']], 'column(s) (not_real_column)')
    ]
)
def test_get_metric_data_invalid_args(patched_ms: MetricsService, args, expected):
    """
    Test that get_metric_data properly validates arguments.

    :param patched_ms: fixture
    :param args: the args to pass to get_metric_data
    :param expected: string expected to be part of the exception thrown
    :return:
    """
    with pytest.raises(NotFoundError) as exc_info:
        patched_ms.get_metric_data(*args)

    assert expected in str(exc_info.value)


def test_get_metric_data(patched_ms: MetricsService):
    """
    Here we check that timestamps are UTC and that small datasets returned from the DB are not altered.

    :param patched_ms: fixture
    :return:
    """
    test_date = datetime.utcnow()
    patched_ms.session.execute.return_value = MockResultSet([
        {'metric_timestamp': test_date, 'count': 100},
        {'metric_timestamp': test_date + timedelta(seconds=5), 'count': 100},
        {'metric_timestamp': test_date + timedelta(seconds=10), 'count': 104},
        {'metric_timestamp': test_date + timedelta(seconds=55), 'count': 120}
    ])
    resp = patched_ms.get_metric_data('dev', 'fake_app', 'raw_counter_with_interval', 'fake_metric', ['count'])

    assert len(resp) == 4  # Check that we're not resampling a small result set.
    assert resp['metric_timestamp'][0].tzinfo.zone == 'UTC'  # Check that timestamps are UTC


def test_get_metric_data_resample(patched_ms: MetricsService, metric_data: MockResultSet):
    """
    This tests that get_metric_data is downsampling the data based on the size arg. MetricServic.get_metric_data does
    not return exactly the size you request, so here we don't test for exact numbers, we just check that the number of
    returned rows is close enough to the size we wanted.

    :param patched_ms: fixture
    :param metric_data: fixture
    :return:
    """
    start = metric_data.current_rows[0]['metric_timestamp']
    end = metric_data.current_rows[-1]['metric_timestamp']
    patched_ms.session.execute.return_value = metric_data
    resp = patched_ms.get_metric_data('dev', 'fake_app', 'raw_timer_with_interval', 'fake_metric', ['median'],
                                      start, end)

    assert abs(len(resp) - 1000) < 100

    resp = patched_ms.get_metric_data('dev', 'fake_app', 'raw_timer_with_interval', 'fake_metric', ['median'],
                                             start, end, 500)

    assert abs(len(resp) - 500) < 100
