import React, { Component, PureComponent } from 'react';
import { Link } from 'react-router-dom';
import request from 'superagent/lib/client';
import { has, createAlertDashboard, createTimeSeriesDashboard } from '../utils';
import Dialog from './Dialog';
import NewDashboardDialog from './NewDashboardDialog';
import './Dashboards.css';

const DASHBOARD_TYPES = {
  time_series: true,
  alert: true,
};

class DashboardItem extends PureComponent {
  render() {
    return (
      <tr className="dashboard-item">
        <td className="dashboard-item__col">
          <Link to={`/dashboards/${this.props.dashboard.type}/${this.props.dashboard.name}`}>
            <span className="dashboard-item__name">
              {this.props.dashboard.name}
            </span>
          </Link>
        </td>

        <td className="dashboard-item__col dashboard-item__type">
          <span>
            <span
              className={`fa fa-${this.props.dashboard.type === 'time_series' ? 'area-chart' : 'warning'}`}
              title={this.props.dashboard.type}
            />
          </span>
        </td>

        <td className="dashboard-item__col dashboard-item__delete">
          <button onClick={() => this.props.openDelete(this.props.dashboard)}>
            <span className="fa fa-trash" />
          </button>
        </td>
      </tr>
    );
  }
}

class DashboardList extends PureComponent {
  render() {
    return (
      <table className="dashboard-list">
        <tbody>
          <tr>
            <th className="dashboard-list__header">Name</th>
            <th className="dashboard-list__header">Type</th>
            <th className="dashboard-list__header">&nbsp;</th>
          </tr>

          {this.props.dashboards.map(d => (
            <DashboardItem key={d.type + d.name} dashboard={d} openDelete={this.props.openDelete} />
          ))}
        </tbody>
      </table>
    );
  }
}

class Dashboards extends Component {
  constructor(props) {
    super(props);
    this.loadDashboards = this.loadDashboards.bind(this);
    this.onLoadDashboards = this.onLoadDashboards.bind(this);
    this.onAddDashboard = this.onAddDashboard.bind(this);
    this.onDeleteDashboard = this.onDeleteDashboard.bind(this);
    this.closeAddDashboard = this.closeAddDashboard.bind(this);
    this.closeAddError = this.closeAddError.bind(this);
    this.addDashboard = this.addDashboard.bind(this);
    this.openAddDashboard = this.openAddDashboard.bind(this);
    this.deleteDashboard = this.deleteDashboard.bind(this);
    this.openDelete = this.openDelete.bind(this);
    this.closeDelete = this.closeDelete.bind(this);
    const params = props.match.params;
    const type = has.call(params, 'type') ? params.type : null;
    this.loadDashboards(type);
    this.state = {
      addDashboardError: null,
      addDashboardOpen: false,
      dashboards: null,
      dashboardToDelete: null,
      loading: true,
      loadingError: null,
    };
  }

  componentWillReceiveProps(props) {
    const oldParams = this.props.match.params;
    const oldType = has.call(oldParams, 'type') ? oldParams.type : null;
    const newParams = props.match.params;
    const newType = has.call(newParams, 'type') ? newParams.type : null;

    if (oldType !== newType) {
      this.loadDashboards(newType);
    }

    this.setState({ loading: true });
  }

  onLoadDashboards(error, response) {
    if (error !== null) {
      this.setState({
        dashboards: null,
        loading: false,
        loadingError: 'Error loading dashboards, try refreshing the page',
      });
    } else {
      this.setState({
        dashboards: response.body.dashboards,
        loading: false,
        loadingError: null,
      });
    }
  }

  onAddDashboard(error, response) {
    if (error === null) {
      const params = this.props.match.params;
      const type = has.call(params, 'type') ? params.type : null;
      this.closeAddDashboard();
      this.loadDashboards(type);
    } else {
      let msg = 'Unable to add dashboard';

      if (response.body && response.body.error) {
        msg = response.body.error;
      }

      this.setState({ addDashboardError: msg });
    }
  }

  onDeleteDashboard() {
    // TODO: handle error state.
    const params = this.props.match.params;
    const type = has.call(params, 'type') ? params.type : null;
    this.loadDashboards(type);
    this.setState({ dashboardToDelete: null });
  }

  loadDashboards(type) {
    let url = null;

    if (type !== null && has.call(DASHBOARD_TYPES, type)) {
      url = `/api/v1/dashboards/${type}`;
    } else if (type === null) {
      url = '/api/v1/dashboards';
    }

    if (url !== null) {
      // Only load dashboards if type is not set (all) or if we have a valid type
      request.get(url)
        .set('Accept', 'application/json')
        .end(this.onLoadDashboards);
    }
  }

  addDashboard(name, type) {
    let data;

    if (type === 'time_series') {
      data = createTimeSeriesDashboard(name);
    } else {
      data = createAlertDashboard(name);
    }

    request.post('/api/v1/dashboards')
      .set('Accept', 'application/json')
      .send({ name, type, data })
      .end(this.onAddDashboard);

    this.closeAddDashboard();
  }

  openAddDashboard() {
    this.setState({ addDashboardOpen: true });
  }

  closeAddDashboard() {
    this.setState({ addDashboardOpen: false });
  }

  closeAddError() {
    this.setState({ addDashboardError: null });
  }

  deleteDashboard() {
    const name = this.state.dashboardToDelete.name;
    const type = this.state.dashboardToDelete.type;
    request.delete(`/api/v1/dashboards/${type}/${name}`)
      .set('Accept', 'application/json')
      .end(this.onDeleteDashboard);
  }

  openDelete(dashboard) {
    this.setState({ dashboardToDelete: dashboard });
  }

  closeDelete() {
    this.setState({ dashboardToDelete: null });
  }

  render() {
    let body;
    let dialog;
    const match = this.props.match;
    const params = match.params;
    const type = has.call(params, 'type') ? params.type : null;

    if (this.state.addDashboardOpen) {
      dialog = <NewDashboardDialog save={this.addDashboard} close={this.closeAddDashboard} />;
    } else if (this.state.dashboardToDelete !== null) {
      dialog = (
        <Dialog onOk={this.deleteDashboard} onClose={this.closeDelete} okText="yes" showClose={false}>
          <p>Are you sure you want to delete {this.state.dashboardToDelete.name}?</p>
        </Dialog>
      );
    } else if (this.state.addDashboardError !== null) {
      dialog = (
        <Dialog showClose={false} showCancel={false} onClose={this.closeAddError} onOk={this.closeAddError}>
          <p>{this.state.addDashboardError}</p>
        </Dialog>
      );
    }

    if (type !== null && !has.call(DASHBOARD_TYPES, type)) {
      body = <p className="error">Invalid Dashboard Type: {type}</p>;
    } else if (this.state.loading) {
      body = <p>Loading dashboards...</p>;
    } else if (this.state.loadingError) {
      body = <p className="error">{this.state.loadingError}</p>;
    } else {
      body = <DashboardList dashboards={this.state.dashboards} openDelete={this.openDelete} />;
    }
    return (
      <div>
        <h1>Dashboards</h1>

        <div className="add-dashboard">
          <button className="button button-primary" onClick={this.openAddDashboard}>
            <span>Add Dashboard</span>
          </button>
        </div>

        {body}

        {dialog}
      </div>
    );
  }
}

export default Dashboards;
