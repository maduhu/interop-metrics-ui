import React, { Component } from 'react';
import MetricPicker from './MetricPicker';
import ChartSettings from './ChartSettings';
import './ChartEditor.css';

const METRIC_PICKER = 'metric_picker';
const SETTINGS = 'settings';

class ChartEditor extends Component {
  constructor(props) {
    super(props);
    this.renderTabs = this.renderTabs.bind(this);
    this.setTab = this.setTab.bind(this);
    this.addMetric = this.addMetric.bind(this);
    this.state ={
      tab: props.chart.metrics.length > 0 ? SETTINGS : METRIC_PICKER,
    };
  }

  setTab(tab) {
    this.setState(() => ({tab}));
  }

  addMetric(metric) {
    this.setState(() => ({tab: SETTINGS}));
    this.props.addMetric(metric);
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

  render() {
    return (
      <div className="chart-editor">
        {this.renderTabs()}

        <MetricPicker hidden={this.state.tab !== METRIC_PICKER}
                      chart={this.props.chart}
                      metrics={this.props.metrics}
                      metricsLoading={this.props.metricsLoading}
                      metricsLoadError={this.props.metricsLoadError}
                      addMetric={this.addMetric} />

        <ChartSettings hidden={this.state.tab !== SETTINGS}
                       chart={this.props.chart}
                       removeMetric={this.props.removeMetric}
                       updateTargetChart={this.props.updateTargetChart}
                       updateMetric={this.props.updateMetric} />
      </div>
    );
  }
}

export { ChartEditor };

export default ChartEditor;
