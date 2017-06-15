import React, { Component } from 'react';
import request from 'superagent/lib/client';
import moment from 'moment';
import DashboardButtons from './DashboardButtons';
import AlertDashboardDialog from './AlertDashboardDialog';
import AlertTable from './AlertTable';
import AlertDialog from './AlertDialog';
import { copyAlert, copyAlertDashboard, createAlert } from '../utils';
import './AlertDashboard.css';

function computeDateRange(rangeMultiplier, rangePeriod) {
  const endDate = moment.utc();

  return {
    endDate,
    startDate: endDate.clone().subtract(rangeMultiplier, rangePeriod),
  };
}

class AlertDashboard extends Component {
  constructor(props) {
    super(props);
    this.saveDashboard = this.saveDashboard.bind(this);
    this.updateDates = this.updateDates.bind(this);
    this.updateAlert = this.updateAlert.bind(this);
    this.refreshDashboard = this.refreshDashboard.bind(this);
    this.refreshLoop = this.refreshLoop.bind(this);
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

    const dashboard = copyAlertDashboard(this.props.dashboard);
    dashboard.alerts = dashboard.alerts.map(a => ({ ...a, isLoading: true }));
    const { startDate, endDate } = computeDateRange(dashboard.rangeMultiplier, dashboard.rangePeriod);

    this.state = {
      dashboard,
      startDate,
      endDate,
      targetAlertIdx: null,
      targetAlert: null,
      alertSettingsOpen: false,
      dashboardSettingsOpen: false,
      clearOpen: false,
      addOpen: false,
      editOpen: false,
      refreshLoopId: this.startRefreshLoop(),
    };
  }

  componentDidMount() {
    this.refreshDashboard();
  }

  componentWillUnmount() {
    this.stopRefreshLoop();
  }

  saveDashboard(needsRefresh) {
    if (needsRefresh) {
      this.updateDates();
      this.refreshDashboard();
    }

    this.props.save(copyAlertDashboard(this.state.dashboard));
  }

  updateDates() {
    /**
     * This is separate than computeDateRange because we cannot use setState in the constructor.
     */
    this.setState(computeDateRange(this.state.dashboard.rangeMultiplier, this.state.dashboard.rangePeriod));
  }

  updateAlert(attrs, idx, cb) {
    this.setState((state) => {
      const dashboard = state.dashboard;
      const alerts = dashboard.alerts;
      const alert = {
        ...alerts[idx],
        ...attrs,
      };

      return {
        dashboard: {
          ...dashboard,
          alerts: [...alerts.slice(0, idx), alert, ...alerts.slice(idx + 1)],
        },
      };
    }, cb);
  }

  loadAlertData(idx) {
    const alert = this.state.dashboard.alerts[idx];
    const env = alert.metric.environment;
    const app = alert.metric.application;
    const metric = alert.metric.metric_name;
    const table = alert.metric.table;
    const url = `/api/v1/alerts/${env}/${app}/${table}/${metric}`;
    const queryParams = {
      measure: alert.metric.measure,
      warning: alert.warning,
      error: alert.error,
      start: this.state.startDate.toISOString(),
      end: this.state.endDate.toISOString(),
    };

    const onLoad = (error, response) => {
      if (error !== null) {
        // TODO: we need to do something with this error.
        this.updateAlert({ loadError: 'Error loading alert data', isLoading: false }, idx);
      } else {
        this.updateAlert({ data: response.body, isLoading: false }, idx);
      }
    };

    // request.get(url).query(queryParams).end(onLoad);
    this.updateAlert({ isLoading: true }, idx, () => request.get(url).query(queryParams).end(onLoad));
  }

  refreshDashboard() {
    const dashboard = this.state.dashboard;
    dashboard.alerts.forEach((_, idx) => this.loadAlertData(idx));
  }

  refreshLoop() {
    this.updateDates();
    this.refreshDashboard();
  }

  startRefreshLoop() {
    return window.setInterval(this.refreshLoop, 60 * 1000);
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
    let needsRefresh = false;

    this.setState((state) => {
      const multipliersEqual = state.dashboard.rangeMultiplier === settings.rangeMultiplier;
      const periodsEqual = state.dashboard.rangePeriod === settings.rangePeriod;

      if (!multipliersEqual || !periodsEqual) {
        needsRefresh = true;
        return {
          dashboardSettingsOpen: false,
          dashboard: {
            ...state.dashboard,
            // The AlertDashboardDialog only gives us a subset of dashboard attributes on save so this is safe.
            ...settings,
          },
        };
      }

      return { dashboardSettingsOpen: false };
    }, () => {
      if (needsRefresh) {
        this.saveDashboard(needsRefresh);
      }
    });
  }

  openAdd() {
    this.setState({ addOpen: true });
  }

  closeAdd() {
    this.setState({ addOpen: false });
  }

  addAlert(alert) {
    const idx = this.state.dashboard.alerts.length;

    this.setState(state => ({
      addOpen: false,
      dashboard: {
        ...state.dashboard,
        alerts: [...state.dashboard.alerts, alert],
      },
    }), () => {
      this.saveDashboard(false);
      this.loadAlertData(idx);
    });
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
    const idx = this.state.targetAlertIdx;

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
    }), () => {
      this.saveDashboard(false);
      this.loadAlertData(idx);
    });
  }

  render() {
    let dialog;
    const isLoading = this.state.dashboard.alerts.some(a => a.isLoading);
    const dateFormat = 'YYYY-MM-DD HH:mm';
    const start = this.state.startDate.format(dateFormat);
    const end = this.state.endDate.format(dateFormat);
    const dateMsgPrefix = isLoading ? 'Loading' : 'Showing';
    const dateMsg = `${dateMsgPrefix} data from ${start} to ${end}`;

    if (this.state.addOpen) {
      dialog = <AlertDialog alert={createAlert()} save={this.addAlert} cancel={this.closeAdd} />;
    } else if (this.state.dashboardSettingsOpen) {
      dialog = (
        <AlertDashboardDialog
          dashboard={this.state.dashboard}
          save={this.saveDashboardSettings}
          close={this.closeDashboardSettings}
        />
      );
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

        <div className="dashboard-info">
          {dateMsg}
        </div>

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
