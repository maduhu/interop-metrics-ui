import pytest

from metrics_server.cassandra_service import CassandraService
from metrics_server.metrics_service import MetricsService


@pytest.fixture()
def patched_cs(mocker):
    """
    This fixture patches the Cluster class imported in metrics_server.cassandra_service. Tests that use this fixture can
    then set return_value or side_effect on the CassandraService.session object in order to unit test scenarios that
    would normally send a query to the Cassandra server.

    :param mocker: pytest.mock fixture.
    :return: MetricsService with patched Cassandra Cluster class.
    """
    mocker.patch('metrics_server.cassandra_service.Cluster')
    config = {'cassandra': {'host': '0.0.0.0'}}
    return CassandraService(config, {})


@pytest.fixture()
def patched_ms(patched_cs):
    """
    This fixture patches the Cluster class imported in metrics_server.metrics_service. Tests that use this fixture can
    then set return_value or side_effect on the MetricsService.session object in order to unit test scenarios that would
    normally send a query to the Cassandra server.

    :param mocker: pytest.mock fixture.
    :return: MetricsService with patched Cassandra Cluster class.
    """
    return MetricsService({}, {'CassandraService': patched_cs})
