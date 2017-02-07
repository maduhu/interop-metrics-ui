import React, { Component } from 'react';
import MetricPicker from './MetricPicker';
import ChartSettings from './ChartSettings';
import './ChartEditor.css';

const METRIC_PICKER = 'metric_picker';
const SETTINGS = 'settings';

class ChartEditor extends Component {
  constructor(props) {
    super(props);
    this.renderTabs.bind(this);
    this.renderMetricPickerTab = this.renderMetricPickerTab.bind(this);
    this.renderSettingsTab = this.renderSettingsTab.bind(this);

    this.tabMap = {
      metric_picker: this.renderMetricPickerTab,
      settings: this.renderSettingsTab,
    };

    this.state ={
      tab: props.chart.metrics.length > 0 ? SETTINGS : METRIC_PICKER,
    };
  }

  setTab(tab) {
    this.setState({tab});
  }

  renderTabs() {
    const pickerActive = this.state.tab === METRIC_PICKER ? 'tab--active' : '';
    const settingsActive = this.state.tab === SETTINGS ? 'tab--active': '';

    return (
      <div className="tabs">
        <div className={`tabs__tab ${pickerActive}`} onClick={() => this.setTab(METRIC_PICKER)}>
          Add Metrics
        </div>

        <div className={`tabs__tab ${settingsActive}`} onClick={() => this.setTab(SETTINGS)}>
          Chart Settings
        </div>
      </div>
    );
  }

  renderMetricPickerTab() {
    return <MetricPicker metrics={this.props.metrics}
                         metricsLoading={this.props.metricsLoading}
                         metricsLoadError={this.props.metricsLoadError}
                         addMetric={this.props.addMetric} />;
  }

  renderSettingsTab() {
    return <ChartSettings chart={this.props.chart} removeMetric={this.props.removeMetric} />;
  }

  render() {
    return (
      <div className="chart-editor">
        {this.renderTabs()}

        {this.tabMap[this.state.tab]()}
      </div>
    );
  }
}

export { ChartEditor };

export default ChartEditor;
