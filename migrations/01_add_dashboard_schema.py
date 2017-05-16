import json
from argparse import ArgumentParser

from cassandra.cluster import Cluster, dict_factory

DASHBOARDS_TABLE = """
CREATE TABLE dashboards (
    name text,
    type text,
    data text,
    PRIMARY KEY (type, name)
) WITH CLUSTERING ORDER BY (name ASC);
"""


def read_config():
    parser = ArgumentParser(description='Run migrations on Cassandra cluster')
    parser.add_argument('config', default=None)
    args = parser.parse_args()

    with open(args.config) as f:
        config = json.load(f)

    return config


def init_session(config):
    print('connecting to cassandra...')
    cluster = Cluster([config['cassandra']['host']], port=9042)
    keyspace = config['cassandra'].get('keyspace', 'metric_data')  # Allow optional keyspace in config for testing.
    session = cluster.connect(keyspace)
    session.row_factory = dict_factory

    return session


def perform_migration(session):
    print('running migration...')
    session.execute(DASHBOARDS_TABLE)
    print('migration complete!')


def main():
    config = read_config()
    session = init_session(config)
    perform_migration(session)


if __name__ == '__main__':
    main()
