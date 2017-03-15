import os
from argparse import ArgumentParser
import json

from waitress import serve

from metrics_server.app import App

TRUTHY = {'true', '1', 'yes', 'on'}


def read_config_from_env():
    env = os.environ
    cassandra = env.get('METRICS_SERVER_CASSANDRA')
    config = {
        'debug': env.get('METRICS_SERVER_DEBUG', '').lower() in TRUTHY,
        'server': {
            'host': env.get('METRICS_SERVER_HOST', '0.0.0.0'),
            'port': int(env.get('METRICS_SERVER_PORT', '8080')),
            'threads': int(env.get('METRICS_SERVER_THREADS', '4')),
        }
    }

    if cassandra:
        # There is no good default for this so only add it conditionally that way our validation code raises and error
        # on App.__init__
        config['cassandra'] = {'host': cassandra}

    return config


def read_config_from_file(config_path):
    """
    Reads the specified config file from disk and parses it as JSON.

    :return:
    """
    with open(config_path, mode='r') as f:
        config = json.load(f)

    return config


def read_config():
    help_text = (
        'Path to the config.json file used to configure the server. '
        'If not used, defaults to environment variables'
    )
    parser = ArgumentParser(description='Start a metrics web server')
    parser.add_argument('--config', help=help_text, default=None)
    args = parser.parse_args()

    if args.config is not None:
        return read_config_from_file(args.config)

    return read_config_from_env()


def run():
    """
    Bootstraps an App and serves it with waitress.

    :return:
    """
    config = read_config()
    app = App(config)
    server_config = config['server']
    serve(app.flask_app, host=server_config['host'], port=server_config['port'], threads=server_config['threads'])


if __name__ == '__main__':
    run()
