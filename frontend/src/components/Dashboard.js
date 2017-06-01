import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import request from 'superagent/lib/client';
import TimeSeriesDashboard from './TimeSeriesDashboard';
import AlertDashboard from './AlertDashboard';
import { transformChart } from '../utils';
import './Dashboard.css';

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.onLoad = this.onLoad.bind(this);
    this.onSave = this.onSave.bind(this);
    this.load = this.load.bind(this);
    this.save = this.save.bind(this);
    this.openEdit = this.openEdit.bind(this);
    this.closeEdit = this.closeEdit.bind(this);
    const params = this.props.match.params;

    this.state = {
      name: params.name,
      type: params.type,
      dashboard: null,
      editOpen: false,
      loading: true,
      loadError: null,
    };
    this.load();
  }

  onLoad(error, response) {
    if (error === null) {
      const dashboard = { ...response.body.dashboard.data };

      // TODO: this could be done better.
      if (this.state.type === 'time_series') {
        dashboard.charts = dashboard.charts.map(transformChart);
      }

      this.setState({
        dashboard,
        loading: false,
      });
    } else {
      this.setState({ loadError: 'Error loading dashboard' });
    }
  }

  onSave() {
    // TODO
  }

  load() {
    const params = this.props.match.params;
    const type = params.type;
    const name = params.name;

    request.get(`api/v1/dashboards/${type}/${name}`)
      .set('Accept', 'application/json')
      .end(this.onLoad);
  }

  save() {
    // TODO
  }

  openEdit() {
    this.setState({ editOpen: true });
  }

  closeEdit() {
    this.setState({ editOpen: false });
  }

  render() {
    let body;

    if (this.state.loading) {
      body = <p>Loading Dashboard...</p>;
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
