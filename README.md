# metrics_server

A Python web server coupled with a React frontend to display metrics data. The major dependencies of the current stack are:

### Backend

* Python 3.6
* Flask (web framework)
* waitress (web server)
* Marshmallow (for server side form validation)
* PyTest and FlaskWebTest for tests
* Pandas (for binning/aggregation of data)

### Frontend

* React
* Webpack
* D3.js

This project is in the early stages, some of these dependencies may change in the future.

## Dev Environment Setup 

### Frontend

The frontend sources are located in the `frontend` folder in the repo. The frontend is a React application that was bootstrapped with [create-react-app](https://github.com/facebookincubator/create-react-app) and has not yet been [ejected](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#npm-run-eject). This means it's a basic React app, not yet using Redux (although in the future it probably will), the build/bundle tool is Webpack, and all JavaScript is written in ES6.

Building the frontend should be easy:

* First install Node and NPM
* Navigate to the frontend directory
* Run `npm install`
* Run `npm start` to start the dev server, which does a few things:
    * Watches the frontend directory for any changes and rebuilds the frontend when changes are detected
    * Starts a Webpack Dev Server with hot reloading, when changes are detected the page is refreshed
    * The Webpack Dev server is also configured to proxy all requests to http://localhost:8080 that way you can enjoy the benefits of hot-reloading while also running your backend server
* If you need to generate a production build run `npm run build`
    * We have not completely determined how we are going to package and release this project, this documentation will be updated when we determine how exactly to do that.



### Backend

The backend is written in Python 3.6, and is not compatible with previous versions of Python (specifically the backend uses f strings). To get the backend server running do the following:

* Install Python 3.6 or higher
* Create a virtual environment in the directory of your choice
    * I normally install my virtual environments in the repo directory in a folder called `.env` which I have added to our `.gitignore`
* Activate your virtual environment: `source .env/bin/activate`
* To install all dependencies run `pip install -r requirements.txt`
* Make a copy of the `example_config.json` file
    * I would recommend naming it `config.json` so it gets ignored by git and will not be accidentally committed
* Update your config file
    * The most important part of the config right now is the Cassandra IP address, everything else can stay the same.
    * If you change the host and port to anything other than `localhost:8080` the Webpack dev server will not proxy correctly. You can fix this by going into package.json and changing the proxy setting to point to your URL, please do not commit this change to the package.json though.
* To start the server run `python -m metrics_server.run path/to/your/config.json`
* If you don't want to use a configuration file you may also set the following environment variables and use `python -m metrics_server.run` to run the server:
    * `METRICS_SERVER_CASSANDRA` - The IP address of your Cassandra server
    * `METRICS_SERVER_DEBUG` - Optional, if a truthy value (`1`, `true`, `yes`, `on`) it enables debug mode on the Flask app.
    * `METRICS_SERVER_HOST` - Optional, sets the host name for your flask app, defaults to `0.0.0.0`
    * `METRICS_SERVER_PORT` - Optional, sets the port for the web server, defaults to `8080`
    * `METRICS_SERVER_THREADS` - Optional, sets the number of threads for the webserver to use, defaults to `4` 


## Deploying

Deploying should be pretty straight forward. There is a docker-compose.yml file in the repo that can be used to build and deploy an nginx container that serves our static content and load balances to 4 metrics_server instances.

To build the containers follow these steps:

* Make sure you have Node an NPM installed
* Make sure you have set the appropriate `DOCKER_HOST`, `DOCKER_TLS_VERIFY`, and `DOCKER_CERT_PATH` environment variables
    * If you do not change these from the default settings `docker-compose up` will run the containers on the machine you run the command on. This is probably not what you want when deploying.
* Navigate to the root of the repository
* Execute `./build_images.sh` and wait a few minutes
* Run `docker-compose up -d` to deploy on your desired host.


# Other Notes


### Metrics data store
Right now the backend data store is Cassandra, as we move forward and further flesh out the product this may change to something more suited for time series data (i.e. InfluxDB or OpenTSB).

