import React, { Component } from 'react';
import request from 'superagent/lib/client';
import './App.css';
import { Dialog } from './components/Dialog';
import { collapseMetrics } from './components/MetricPicker';
import ChartEditor from './components/ChartEditor';
import Chart from './components/Chart';

function newChart() {
  return {
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    // In the future we should also allow users to set axis domains.
    leftAxis: 'linear',
    rightAxis: 'linear',
    metrics: [],
  };
}

class App extends Component {
  constructor(props) {
    super(props);
    this.onLoadMetrics = this.onLoadMetrics.bind(this);
    this.addChart = this.addChart.bind(this);
    this.updateChart = this.updateChart.bind(this);
    this.removeChart = this.removeChart.bind(this);
    this.saveChart = this.saveChart.bind(this);
    this.addMetric = this.addMetric.bind(this);
    this.updateMetric = this.updateMetric.bind(this);
    this.removeMetric = this.removeMetric.bind(this);
    this.openSettings = this.openSettings.bind(this);
    this.closeSettings = this.closeSettings.bind(this);

    this.state = {
      rawMetrics: [],
      metrics: {},
      metricsLoading: true,
      metricsLoadError: null,
      charts: [newChart()],
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
        errorMsg = `${response.statusCode} - ${response.statusText}`;
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
    this.setState(state => ({charts: state.charts.concat([newChart()])}));
  }

  updateChart(attr, value) {
    this.setState({
      targetChart: {
        ...this.state.targetChart,
        [attr]: value,
      }
    });
  }

  removeChart(idx) {
    this.setState(state => {
      const charts = state.charts.slice(0, idx).concat(state.charts.slice(idx+1));
      return {charts};
    });
  }

  saveChart() {
    // TODO: kick off data retrieval as needed.
    this.setState(state => {
      const id = state.targetChartId;
      return {
        charts: [...state.charts.slice(0, id), ...[state.targetChart], ...state.charts.slice(id + 1)],
        targetChart: null,
        settingsOpen: false
      };
    });
  }

  addMetric(metric) {
    const metrics = this.state.targetChart.metrics.concat([{...metric, measure: '', axis: 'left'}]);
    this.updateChart('metrics', metrics);
  }

  updateMetric(idx, attr, value) {
    const newMetric = {...this.state.targetChart.metrics[idx], [attr]: value};

    this.setState((state) => {
      const oldChart = state.targetChart;
      const targetChart = {
        ...oldChart,
        metrics: [...oldChart.metrics.splice(0, idx), ...[newMetric], ...oldChart.metrics.splice(idx + 1)],
      };

      return {targetChart};
    });
  }

  removeMetric(idx) {
    let metrics = this.state.targetChart.metrics;
    metrics = metrics.slice(0, idx).concat(metrics.slice(idx + 1));
    this.updateChart('metrics', metrics);
  }

  openSettings(id) {
    this.setState({
      targetChartId: id,
      targetChart: {...this.state.charts[id], metrics: [...this.state.charts[id].metrics]},
      settingsOpen: true
    });
  }

  closeSettings() {
    this.setState({targetChart: null, settingsOpen: false});
  }

  render() {
    let dialog;

    if (this.state.settingsOpen) {
      dialog = (
        <Dialog showClose={false} okText="save" onOk={this.saveChart} onClose={this.closeSettings} size="xl">
          <ChartEditor metrics={this.state.metrics}
                       metricsLoading={this.state.metricsLoading}
                       metricsLoadError={this.state.metricsLoadError}
                       chartId={this.state.targetChartId}
                       chart={this.state.targetChart}
                       addMetric={this.addMetric}
                       removeMetric={this.removeMetric}
                       updateMetric={this.updateMetric}
                       updateChart={this.updateChart} />
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
          <button className="button" onClick={this.addChart}>
            <span className="fa fa-line-chart">&nbsp;</span>
            New Chart
          </button>
        </div>

        {dialog}

        {charts}
      </div>
    );
  }
}

export default App;
