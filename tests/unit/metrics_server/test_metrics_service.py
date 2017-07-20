import json
from datetime import datetime, timedelta

import pytest
import pytz
from dateutil.parser import parse

from metrics_server.errors import NotFoundError
from metrics_server.metrics_service import MetricsService, TABLE_NAMES, validate_columns
from tests.utils import MockResultSet

TEST_DATE = datetime(2017, 1, 1, tzinfo=pytz.UTC).isoformat()


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


def test_validate_columns_good():
    test_columns = ['count', 'previous_count']
    columns, is_interval_count = validate_columns('raw_timer_with_interval', test_columns)
    assert is_interval_count is False
    assert test_columns == columns


@pytest.mark.parametrize('table,columns,expected_error', [
    ('raw_timer_with_interval', ['count', 'interval_count', 'i do not exist'], 'column(s)'),
    ('i do not exist', ['count'], 'table'),
])
def test_validate_columns_bad(table, columns, expected_error):
    """
    Test validate columns with bad table and bad column values
    """
    with pytest.raises(NotFoundError) as exc_info:
        validate_columns(table, columns)

    assert str(exc_info.value).startswith(expected_error)


@pytest.mark.parametrize('columns,expected_columns', [
    (['interval_count'], ['count', 'previous_count']),
    (['interval_count', 'p99'], ['count', 'previous_count', 'p99']),
])
def test_validate_columns_interval(columns, expected_columns):
    actual_columns, is_interval_count = validate_columns('raw_timer_with_interval', columns)
    assert is_interval_count
    assert expected_columns == actual_columns
