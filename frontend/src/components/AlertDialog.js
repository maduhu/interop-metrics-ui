import React, { Component, PureComponent } from 'react';
import Dialog from './Dialog';
import MetricPicker from './MetricPicker';
import AlertSettings from './AlertSettings';
import { createAlertMetric } from '../utils';

const METRIC_PICKER = 'metric_picker';
const SETTINGS = 'settings';

class Tabs extends PureComponent {
  render() {
    const pickerActive = this.props.tab === METRIC_PICKER ? 'tab--active' : '';
    const settingsActive = this.props.tab === SETTINGS ? 'tab--active' : '';

    return (
      <div className="tabs">
        <div className={`tabs__tab ${pickerActive}`} onClick={() => this.props.selectTab(METRIC_PICKER)}>
          Select Metric
        </div>

        <div className={`tabs__tab ${settingsActive}`} onClick={() => this.props.selectTab(SETTINGS)}>
          Alert Settings
        </div>
      </div>
    );
  }
}

export default class AlertDialog extends Component {
  constructor(props) {
    super(props);
    this.selectTab = this.selectTab.bind(this);
    this.selectMetric = this.selectMetric.bind(this);
    this.updateAlert = this.updateAlert.bind(this);
    this.save = this.save.bind(this);
    let tab;

    if (props.alert.metric === null) {
      tab = METRIC_PICKER;
    } else {
      tab = SETTINGS;
    }

    this.state = {
      tab,
      alert: this.props.alert,
    };
  }

  selectTab(tab) {
    this.setState({ tab });
  }

  selectMetric(metric) {
    this.setState(state => ({
      tab: SETTINGS,
      alert: {
        ...state.alert,
        metric: createAlertMetric(metric),
      },
    }));
  }

  updateAlert(alert) {
    this.setState(() => ({ alert }));
  }

  save() {
    this.props.save(this.state.alert);
  }

  render() {
    const { alert, tab } = this.state;
    const metric = alert.metric;
    const okEnabled = metric !== null && metric.measure !== '' && alert.warning !== null && alert.error !== null;

    return (
      <Dialog size="xl" okText="save" onOk={this.save} okEnabled={okEnabled} onClose={this.props.cancel}>
        <Tabs tab={tab} selectTab={this.selectTab} />

        <MetricPicker
          hidden={tab !== METRIC_PICKER}
          chart={this.props.chart}
          addMetric={this.selectMetric}
          addColText="select"
        />

        <AlertSettings
          hidden={tab !== SETTINGS}
          alert={alert}
          showMetricPicker={() => this.selectTab(METRIC_PICKER)}
          updateAlert={this.updateAlert}
        />
      </Dialog>
    );
  }
}
