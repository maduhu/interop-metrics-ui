import React, { Component } from 'react';
import MeasurePicker from './MeasurePicker';
import ChartSettings from './ChartSettings';
import './ChartEditor.css';

const METRIC_PICKER = 'metric_picker';
const SETTINGS = 'settings';

class ChartEditor extends Component {
  constructor(props) {
    super(props);
    this.renderTabs.bind(this);
    this.renderMeasurePickerTab = this.renderMeasurePickerTab.bind(this);
    this.renderSettingsTab = this.renderSettingsTab.bind(this);

    this.tabMap = {
      metric_picker: this.renderMeasurePickerTab,
      settings: this.renderSettingsTab,
    };

    this.state ={
      tab: SETTINGS,
      // tab: METRIC_PICKER,
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

  renderMeasurePickerTab() {
    return <MeasurePicker metrics={this.props.metrics}
                          metricsLoading={this.props.metricsLoading}
                          metricsLoadError={this.props.metricsLoadError}
                          addMeasure={this.props.addMeasure} />;
  }

  renderSettingsTab() {
    return <ChartSettings chart={this.props.chart} removeMeasure={this.props.removeMeasure} />;
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
