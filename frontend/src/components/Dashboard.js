import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import request from 'superagent/lib/client';
import TimeSeriesDashboard from './TimeSeriesDashboard';
import AlertDashboard from './AlertDashboard';
import {
  transformTimeSeriesDashboard,
  transformAlertDashboard,
} from '../utils';
import './Dashboard.css';

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.onLoad = this.onLoad.bind(this);
    this.load = this.load.bind(this);
    this.save = this.save.bind(this);
    const params = this.props.match.params;

    this.state = {
      name: params.name,
      type: params.type,
      dashboard: null,
      loading: true,
      loadError: null,
    };
    this.load();
  }

  onLoad(error, response) {
    if (error === null) {
      let dashboard;

      if (this.state.type === 'time_series') {
        dashboard = transformTimeSeriesDashboard(response.body.dashboard.data);
      } else if (this.state.type === 'alert') {
        dashboard = transformAlertDashboard(response.body.dashboard.data);
      }

      this.setState({
        dashboard,
        loading: false,
      });
    } else {
      // TODO: better handle loading errors, i.e. differentiate between a 400, 404, 500, etc.
      this.setState({
        loading: false,
        loadError: 'Error loading dashboard',
      });
    }
  }

  load() {
    request.get(`api/v1/dashboards/${this.state.type}/${this.state.name}`)
      .set('Accept', 'application/json')
      .end(this.onLoad);
  }

  save(data) {
    const cb = (error, response) => {
      // TODO: actually do something if there is a save error.

      if (error !== null) {
        console.error('Error saving dashboard.', error, response);
      } else {
        console.log('Dashboard saved.');
      }
    };

    request.put(`api/v1/dashboards/${this.state.type}/${this.state.name}`)
      .set('Accept', 'application/json')
      .send({ data })
      .end(cb);
  }

  render() {
    let body;

    if (this.state.loading) {
      body = <p>Loading Dashboard...</p>;
    } else if (this.state.loadError) {
      body = <p>{this.state.loadError}</p>;
    } else if (this.state.type === 'time_series') {
      body = <TimeSeriesDashboard dashboard={this.state.dashboard} save={this.save} />;
    } else if (this.state.type === 'alert') {
      body = <AlertDashboard dashboard={this.state.dashboard} save={this.save} />;
    } else {
      body = <div>Unsupported Dashboard Type</div>;
    }

    return (
      <div className="dashboard-page">
        <div className="dashboard-nav">
          <Link to="/dashboards">
            <span className="fa fa-arrow-left" />
            <span> Dashboards</span></Link>
        </div>

        <h2 className="dashboard-title">{this.state.name}</h2>

        {body}
      </div>
    );
  }
}

export default Dashboard;
