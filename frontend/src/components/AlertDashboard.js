import React, { Component } from 'react';
import moment from 'moment';
import DashboardButtons from './DashboardButtons';
import AlertDashboardDialog from './AlertDashboardDialog';
import AlertTable from './AlertTable';
import AlertDialog from './AlertDialog';
import { copyAlert, copyAlertDashboard, createAlert } from '../utils';
import './AlertDashboard.css';

/**
 * TODO: REMOVE THE BELOW FUNCTIONS
 */
function few() {
  const timestamps = [];

  for (let i = 0; i < 3; i++) {
    timestamps.push(moment.utc().subtract(60 + (i * 3), 'minutes'));
  }

  return timestamps;
}

function some() {
  const timestamps = [];

  for (let i = 0; i < 10; i++) {
    timestamps.push(moment.utc().subtract(60 + i, 'minutes'));
  }

  return timestamps;
}

function many() {
  const timestamps = [];

  for (let i = 0; i < 97; i++) {
    timestamps.push(moment.utc().subtract(60 + i, 'minutes'));
  }

  return timestamps;
}

const fakeData = [{
  errors: [],
  warnings: [],
}, {
  errors: [],
  warnings: few(),
}, {
  errors: some(),
  warnings: many(),
}];

/**
 * TODO: REMOVE THE ABOVE FUNCTIONS
 */

class AlertDashboard extends Component {
  constructor(props) {
    super(props);
    this.saveDashboard = this.saveDashboard.bind(this);
    this.refreshDashboard = this.refreshDashboard.bind(this);
    this.startRefreshLoop = this.startRefreshLoop.bind(this);
    this.stopRefreshLoop = this.stopRefreshLoop.bind(this);
    this.moveAlertUp = this.moveAlertUp.bind(this);
    this.moveAlertDown = this.moveAlertDown.bind(this);
    this.openClear = this.openClear.bind(this);
    this.closeClear = this.closeClear.bind(this);
    this.openAlertSettings = this.openAlertSettings.bind(this);
    this.closeAlertSettings = this.closeAlertSettings.bind(this);
    this.openDashboardSettings = this.openDashboardSettings.bind(this);
    this.closeDashboardSettings = this.closeDashboardSettings.bind(this);
    this.saveDashboardSettings = this.saveDashboardSettings.bind(this);
    this.openAdd = this.openAdd.bind(this);
    this.closeAdd = this.closeAdd.bind(this);
    this.addAlert = this.addAlert.bind(this);
    this.saveAlert = this.saveAlert.bind(this);
    this.removeAlert = this.removeAlert.bind(this);

    this.state = {
      dashboard: copyAlertDashboard(this.props.dashboard),
      targetAlertIdx: null,
      targetAlert: null,
      alertSettingsOpen: false,
      dashboardSettingsOpen: false,
      clearOpen: false,
      addOpen: false,
      editOpen: false,
      refreshLoopId: this.startRefreshLoop(),
    };

    // Load data asap.
    this.refreshDashboard();
  }

  componentWillUnmount() {
    this.stopRefreshLoop();
  }

  saveDashboard() {
    this.props.save(copyAlertDashboard(this.state.dashboard));
  }

  refreshDashboard() {
    const set = state => ({
      dashboard: {
        alerts: state.dashboard.alerts.map((alert, idx) => ({
          ...alert,
          data: fakeData[idx],
        })),
      },
    });
    window.setTimeout(() => this.setState(set), 1500);
  }

  startRefreshLoop() {
    // TODO
    return null;
  }

  stopRefreshLoop() {
    window.clearInterval(this.state.refreshLoopId);
  }

  moveAlertUp(idx) {
    this.setState((state) => {
      const alerts = [...state.dashboard.alerts];

      if (alerts[idx] !== undefined && idx !== 0) {
        const above = alerts[idx - 1];
        alerts[idx - 1] = alerts[idx];
        alerts[idx] = above;

        return {
          dashboard: {
            ...state.dashboard,
            alerts,
          },
        };
      }

      return {};
    }, this.saveDashboard);
  }

  moveAlertDown(idx) {
    this.setState((state) => {
      const alerts = [...state.dashboard.alerts];

      if (alerts[idx] !== undefined && idx < (alerts.length - 1)) {
        const below = alerts[idx + 1];
        alerts[idx + 1] = alerts[idx];
        alerts[idx] = below;

        return {
          dashboard: {
            ...state.dashboard,
            alerts,
          },
        };
      }

      return {};
    }, this.saveDashboard);
  }

  openClear() {
    this.setState({ clearOpen: true });
  }

  closeClear() {
    this.setState({ clearOpen: false });
  }

  openAlertSettings(idx) {
    this.setState({ alertSettingsOpen: true, targetAlertIdx: idx });
  }

  closeAlertSettings() {
    this.setState({ alertSettingsOpen: false, targetAlertIdx: null });
  }

  openDashboardSettings() {
    this.setState({ dashboardSettingsOpen: true });
  }

  closeDashboardSettings() {
    this.setState({ dashboardSettingsOpen: false });
  }

  saveDashboardSettings(settings) {
    this.setState(state => ({
      dashboardSettingsOpen: false,
      dashboard: {
        ...state.dashboard,
        // The AlertDashboardDialog only gives us a subset of dashboard attributes on save so this is safe.
        ...settings,
      },
    }), this.saveDashboard);
  }

  openAdd() {
    this.setState({ addOpen: true });
  }

  closeAdd() {
    this.setState({ addOpen: false });
  }

  addAlert(alert) {
    this.setState(state => ({
      addOpen: false,
      dashboard: {
        ...state.dashboard,
        alerts: [...state.dashboard.alerts, alert],
      },
    }), this.saveDashboard);
  }

  removeAlert(idx) {
    this.setState((state) => {
      if (state.dashboard.alerts[idx] !== undefined) {
        return {
          dashboard: {
            ...state.dashboard,
            alerts: state.dashboard.alerts.slice(0, idx).concat(state.dashboard.alerts.slice(idx + 1)),
          },
        };
      }

      return {};
    }, this.saveDashboard);
  }

  saveAlert(alert) {
    this.setState(state => ({
      alertSettingsOpen: false,
      targetAlertIdx: false,
      dashboard: {
        ...state.dashboard,
        alerts: [
          ...state.dashboard.alerts.slice(0, state.targetAlertIdx),
          alert,
          ...state.dashboard.alerts.slice(state.targetAlertIdx + 1),
        ],
      },
    }), this.saveDashboard);
  }

  render() {
    let dialog;

    if (this.state.addOpen) {
      dialog = <AlertDialog alert={createAlert()} save={this.addAlert} cancel={this.closeAdd} />;
    } else if (this.state.dashboardSettingsOpen) {
      dialog = (
        <AlertDashboardDialog
          dashboard={this.state.dashboard}
          save={this.saveDashboardSettings}
          close={this.closeDashboardSettings}
        />
      )
    } else if (this.state.alertSettingsOpen) {
      const alert = copyAlert(this.state.dashboard.alerts[this.state.targetAlertIdx]);
      dialog = <AlertDialog alert={alert} save={this.saveAlert} cancel={this.closeAlertSettings} />;
    }

    return (
      <div className="alert-dashboard">
        <DashboardButtons clear={this.openClear} add={this.openAdd} addText="Alert" icon="fa-warning">
          <button className="dashboard-buttons__button button" onClick={this.openDashboardSettings}>
            <span className="button__icon fa fa-pencil">&nbsp;</span>
            <span className="button__text">Settings</span>
          </button>

          <button className="dashboard-buttons__button button" onClick={this.refreshDashboard}>
            <span className="button__icon fa fa-refresh">&nbsp;</span>
            <span className="button__text">Refresh</span>
          </button>
        </DashboardButtons>

        <AlertTable
          alerts={this.state.dashboard.alerts}
          moveUp={this.moveAlertUp}
          moveDown={this.moveAlertDown}
          settings={this.openAlertSettings}
          remove={this.removeAlert}
        />

        {dialog}
      </div>
    );
  }
}

export default AlertDashboard;
