import pytest

from metrics_server.cassandra_service import CassandraService
from metrics_server.errors import ConfigurationError


def test_init(patched_cs):
    """
    Tests the initialization of the MetricsService class

    :param patched_cs: fixture.
    :return:
    """
    assert patched_cs.cluster is not None
    assert patched_cs.session is not None


def test_no_cassandra():
    """
    Test that no cassandra config throws error.

    :return:
    """
    with pytest.raises(ConfigurationError):
        CassandraService({}, {})


def test_no_host():
    """
    Test that invalid cassandra config throws error.

    :return:
    """
    with pytest.raises(ConfigurationError):
        CassandraService({'cassandra': {}}, {})
