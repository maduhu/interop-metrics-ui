# interop-metrics-ui

Repo for interop-metrics-ui, code that provides UI features for Metrics visualization and related activities.

Contents:

- [Deployment](#deployment)
- [Configuration](#configuration)
- [API](#api)
- [Logging](#logging)
- [Tests](#tests)

## Deployment

The Metrics UI is built with the following major dependencies:

* Backend
    * Python 3.6
    * Flask
    * Pandas
    * PyTest
    * and more, see `requirements.txt`
* Frontend
    * React
    * Webpack
    * D3.js
    * and more, see `frontend/package.json`

### Development

* Make sure you have the following installed:
    * Python 3.6
    * Node and NPM
* Create a Python virtualenv and activate it.
    * If you have not installed virtualenv it can be installed with `pip3 install virtualenv .env`
        * This puts the virtualenv in `.env` which is in our `.gitignore`
    * To create a virtualenv run `python3 -m virtualenv path/for/your/virtualenv`
    * To activate your virtualenv run `source path/for/your/virtualenv/bin/activate`
* Install dependencies with `pip install -r requirements.txt`
* Copy the `example_config.json` and name it `config.json`
    * Make sure to update the cassandra host
* Start the server with `python -m metrics_server.run --config path/to/your/config.json`
* In another terminal navigate to the `frontend` directory
* Install the frontend dependencies with `npm install`
* Start the dev server with `npm start`, which does a few things:
    * Watches the frontend directory for any changes and rebuilds the frontend when changes are detected
    * Starts a Webpack Dev Server with hot reloading, when changes to frontend code are detected the page is refreshed
    * The Webpack Dev server is also configured to proxy all requests to `http://localhost:8080` that way you can enjoy the benefits of hot-reloading while also running your backend server
* Navigate to `http://localhost:3000` to see the server in action


### Staging/Production

Steps for building:

* Install Node and NPM
* Run the `build_images.sh` script.
    * This script first creates a production build of the frontend assets, then kicks off a build of the docker images needed for deployment.
* Export your containers with: `docker save -o metrics_server_bundle.tar metricdata_web_1 metricdata_web_2 metricdata_web_3 metricdata_web_4 metricdata_load_balancer` 

Steps for deploying:

* Copy the built containers and `docker-compose.yml` to the server you want to deploy to.
    * Copy `docker-compose.yml` to a folder called metric-data or docker-compose will not find the correct containers.
        * alternatively you can specify 'metric-data' as the project name with the `-p` flag.
* Import your containers with: `docker load -i metrics_server_bundle.tar`
* Set `METRICS_SERVER_CASSANDRA` environment variable to the proper IP address of the cassandra server.
* If you have previously deployed the containers run `docker-compose down` to stop all of the running containers.
* Launch the containers with: `docker-compose up -d`
    * This spins up 4 worker containers and an nginx load balancer on port 9000.
* Verify your server is up and running on port 9000

## Configuration

There are two ways to configure the interop-metrics-ui server, via a JSON config file or Environment variables.
 
To configure your server with a config file make a copy of the `example_config.json` file and update the appropriate values.

* The most important part of the config right now is the Cassandra IP address, everything else can stay the same.
* If you change the host and port to anything other than `localhost:8080` the Webpack dev server will not proxy correctly. You can fix this by going into package.json and changing the proxy setting to point to your URL, please do not commit this change to the package.json though.

If you don't want to use a configuration file you may also set the following environment variables:

* `METRICS_SERVER_CASSANDRA` - The IP address of your Cassandra server
* `METRICS_SERVER_DEBUG` - Optional, if a truthy value (`1`, `true`, `yes`, `on`) it enables debug mode on the Flask app.
* `METRICS_SERVER_HOST` - Optional, sets the host name for your flask app, defaults to `0.0.0.0`
* `METRICS_SERVER_PORT` - Optional, sets the port for the web server, defaults to `8080`
* `METRICS_SERVER_THREADS` - Optional, sets the number of threads for the webserver to use, defaults to `4`

## API

The repo contains an API but it is currently considered private and only consumed by the frontend web app.

## Logging

There are no logs of any operational value here, only for debugging purposes.

## Tests

Tests are written with PyTest, to run them:
* activate your virtual environment
* run `python -m pytest tests/`

## Screenshots

A brief screenshot tour of the UI can be found [here](docs/screenshots.md)
