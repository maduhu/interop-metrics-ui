import React, { Component } from 'react';
import request from 'superagent/lib/client';
import './App.css';
import { Dialog } from './components/Dialog';
import { collapseMetrics } from './components/MeasurePicker';
import ChartEditor from './components/ChartEditor';
import Chart from './components/Chart';

class App extends Component {
  constructor(props) {
    super(props);
    this.addChart = this.addChart.bind(this);
    this.onLoadMetrics = this.onLoadMetrics.bind(this);
    this.addMeasure = this.addMeasure.bind(this);
    this.removeMeasure = this.removeMeasure.bind(this);
    this.saveChart = this.saveChart.bind(this);
    this.openSettings = this.openSettings.bind(this);
    this.closeMeasurePicker = this.closeMeasurePicker.bind(this);
    this.removeChart = this.removeChart.bind(this);

    this.state = {
      rawMetrics: [],
      metrics: {},
      metricsLoading: true,
      metricsLoadError: null,
      charts: [{measures: []}],
      targetChartId: null,
      targetChart: null,
      settingsOpen: false,
    };

    request.get('/api/v1/metrics')
      .set('Accept', 'application/json')
      .end(this.onLoadMetrics);
  }

  onLoadMetrics(error, response) {
    if (error !== null) {
      let errorMsg;

      if (response.body !== null && response.body.error) {
        errorMsg = response.body.error;
      } else {
        errorMsg = `An error occurred while loading available metrics: ${response.statusCode} - ${response.statusText}`;
      }

      this.setState({
        metricsLoading: false,
        metricsLoadError: errorMsg,
      });

      return;
    }

    this.setState({
      rawMetrics: response.body.data.metrics,
      metrics: collapseMetrics(response.body.data.metrics),
      metricsLoading: false,
      metricsLoadError: null,
    });
  }

  addChart() {
    const newChart = [{measures: []}];
    this.setState(state => ({charts: state.charts.concat(newChart)}));
  }

  removeChart(idx) {
    this.setState(state => {
      const charts = state.charts.slice(0, idx).concat(state.charts.slice(idx+1));
      return {charts};
    });
  }

  openSettings(id) {
    this.setState({
      targetChartId: id,
      // This copy might not be deep enough, if we change the axis of a measure and hit cancel will we actually revert
      // to the old state? Need to test.
      targetChart: {...this.state.charts[id], measures: [...this.state.charts[id].measures]},
      settingsOpen: true
    });
  }

  closeMeasurePicker() {
    this.setState({targetChart: null, settingsOpen: false});
  }

  addMeasure(metric) {
    const targetChart = {...this.state.targetChart};
    targetChart.measures = targetChart.measures.concat([{...metric, measure: null, axis: 'right'}]);
    this.setState({targetChart});
  }

  removeMeasure(idx) {
    this.setState((state) => {
      const chart = {...state.targetChart};
      chart.measures = chart.measures.slice(0, idx).concat(chart.measures.slice(idx + 1));
      return {targetChart: chart};
    });
  }

  saveChart() {
    // TODO: kick off data retrieval as needed.
    this.setState(state => {
      const id = state.targetChartId;
      const newChart = [state.targetChart];

      return {
        charts: [...state.charts.slice(0, id), ...newChart, ...state.charts.slice(id + 1)],
        targetChart: null,
        settingsOpen: false
      };
    });
  }

  render() {
    let dialog;

    if (this.state.settingsOpen) {
      dialog = (
        <Dialog showClose={false} okText="save" onOk={this.saveChart} onClose={this.closeMeasurePicker} size="xl">
          <ChartEditor metrics={this.state.metrics}
                       metricsLoading={this.state.metricsLoading}
                       metricsLoadError={this.state.metricsLoadError}
                       chartId={this.state.targetChartId}
                       chart={this.state.targetChart}
                       addMeasure={this.addMeasure}
                       removeMeasure={this.removeMeasure} />
        </Dialog>
      );
    }

    const charts = this.state.charts.map((chart, idx) => {
      const openSettings = () => this.openSettings(idx);
      const removeChart = () => this.removeChart(idx);

      return (
        <Chart key={idx} config={chart} openSettings={openSettings} removeChart={removeChart}/>
      );
    });

    return (
      <div className="app">
        <div className="add-chart">
          <button className="button" onClick={this.addChart}>New Chart</button>
        </div>

        {dialog}

        {charts}
      </div>
    );
  }
}

export default App;
