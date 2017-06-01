import React from 'react';
import {
  HashRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';
import Dashboards from './components/Dashboards';
import Dashboard from './components/Dashboard';
import './App.css';

const NoMatch = () => (
  <div className="not-found">
    <h1>Page Not Found</h1>
  </div>
);

const DashboardsPage = ({ match }) => (
  <div className="dashboards-page">
    <Switch>
      <Route exact path={match.url} component={Dashboards} />
      <Route exact path={`${match.url}/:type`} component={Dashboards} />
      <Route exact path={`${match.url}/:type/:name`} component={Dashboard} />
      <Route component={NoMatch} />
    </Switch>
  </div>
);

const IndexPage = () => (
  <Redirect to="/dashboards" />
);

const App = () => (
  <Router>
    <div className="app">
      <Switch>
        <Route exact path="/" component={IndexPage} />
        <Route path="/dashboards" component={DashboardsPage} />
        <Route component={NoMatch} />
      </Switch>
    </div>
  </Router>
);

export default App;
