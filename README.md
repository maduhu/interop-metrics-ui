#metrics_server

A Python web server coupled with a React frontend to display metrics data. The major dependencies of the current stack are:

###Backend

* Python 3.6
* Flask (web framework)
* waitress (web server)
* Marshmallow (for server side form validation)
* PyTest and FlaskWebTest for tests
* Pandas (for binning/aggregation of data, not yet implemented)

###Frontend

* React
* Webpack
* Rickshaw

This project is in the early stages, some of these dependencies may change in the future. Notably we are not 100% sold on Rickshaw. In the near future we will be experimenting with Bokeh (probably just the JS library) and D3. We are also generating large volumes of data that we know browsers will not be able to handle. We will likely be adding Pandas to the backend so we can bin/aggregate the data so we can send less data down to the browser per request.

##Installation 

###Frontend

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



###Backend

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


#Other Notes


###Metrics data store
Right now the backend data store is Cassandra, as we move forward and further flesh out the product this may change to something more suited for time series data (i.e. InfluxDB or OpenTSB).


###Viz framework
Currently we use Rickshaw for our visualization framework, but it hasn't proven completely ideal, and we may move to something else.

Issues with Rickshaw (in no particular order):

* Awkward API, axes, legend, etc. are all different objects that require a reference to the graph object.
* Code smells
    * see Rickshaw.keys, a poorly hand rolled version of Object.keys
    * cannot replace data in graph object, you are required to mutate the existing series object.
* Lack of documentation. The Rickshaw.Graph.RangeSlider.Preview is completely undocumented.
* Overall lack of flexibility, not easily customizable.
* Depends on D3 3.5, the current version is 4.0
* Cannot properly visualize missing data
* Relies on jQuery + jQuery UI

Alternatives to Rickshaw:

* [dc.js](https://dc-js.github.io/dc.js/)
    * Is more suited for visualizing multiple dimensions of data across multiple related charts.
    * Doesn't seem to support multiple y axes, which is a requirement.
* [Bokeh](http://bokeh.pydata.org/en/latest/)
    * Primarily intended to be a Python library, but has a JavaScript component.
    * Has ability to embed into an application as a library, but requires your application be written with Tornado framework, and using Bokeh as a library is not as well documented.
        * Tornado and Flask are not particularly compatible, Tornado has a WSGI wrapper, but they recommend you don't use it.
    * JS portion is not super well documented, but seems to have nearly the same API as the Python version.
        * JS Portion is written with backbone, a largely outdated JS application framework, our app is currently written with React.
    * Is written in CoffeeScript, including all documentation examples.
* [Metrics Graphics](https://github.com/mozilla/metrics-graphics)
    * Supports nearly all use-cases we have, including visualizing missing data.
    * Does not support multiple y-axes out of the box, which is a deal breaker.
        * May be worth looking at adding this behavior ourselves.
* [D3](https://d3js.org/)
    * Supports almost all of the features we need, however requires us to write more code.
    * Is the current gold standard of data visualization for the web.
    * Is very well documented, and has a large supportive community.
