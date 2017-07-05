"""A setuptools based setup module.

See:
https://packaging.python.org/en/latest/distributing.html
https://github.com/pypa/sampleproject
"""

# Always prefer setuptools over distutils
from setuptools import setup, find_packages
from metrics_server import __version__

setup(
    name='metric-data',
    version=__version__,
    description='Metric Data Query API service',
    long_description='Metric Data Query API service',
    author='Alan Vezina',
    author_email='alan.vezina@modusbox.com',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'Programming Language :: Python :: 3.6',
    ],
    packages=find_packages(exclude=['docs', 'tests', 'frontend', 'docker', 'migrations']),
    install_requires=[
        'cassandra-driver',
        'Flask',
        'marshmallow',
        'pandas',
        'python-dateutil',
        'pytz',
        'waitress',
    ],
    entry_points={
        'console_scripts': [
            'run=metrics_server.run:run',
        ],
    },
)
