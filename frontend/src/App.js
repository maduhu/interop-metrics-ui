import React, { Component } from 'react';
import request from 'superagent/lib/client';
import moment from 'moment';
import './App.css';
import { Dialog } from './components/Dialog';
import { collapseMetrics } from './components/MetricPicker';
import ChartEditor from './components/ChartEditor';
import Chart from './components/Chart';

const dateFormat = 'YYYY-MM-DD';
const timeFormat = 'hh:mm:ss';

function newChart() {
  /**
   * Creates a new chart object.
   * Defaults chart range to the last 24 hours.
   * Defaults axes to linear scales.
   */
  const now = moment.utc();
  const yesterday = now.clone().subtract(24, 'hours');

  return {
    startDate: now.format(dateFormat),
    startTime: now.format(timeFormat),
    endDate: yesterday.format(dateFormat),
    endTime: yesterday.format(timeFormat),
    // In the future we should also allow users to set axis domains.
    leftAxis: 'linear',
    rightAxis: 'linear',
    metrics: [],
  };
}

function newMetric(metric) {
  /**
   * Copies a metric and adds a measure and axis field. In the future we'll probably add more fields.
   */
  return {...metric, measure: '', axis: 'left'};
}

class App extends Component {
  constructor(props) {
    super(props);
    this.onLoadMetrics = this.onLoadMetrics.bind(this);
    this.addChart = this.addChart.bind(this);
    this.updateTargetChart = this.updateTargetChart.bind(this);
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
      targetChartIdx: null,
      targetChart: null,
      settingsOpen: false,
    };

    request.get('/api/v1/metrics')
      .set('Accept', 'application/json')
      .end(this.onLoadMetrics);
  }

  onLoadMetrics(error, response) {
    /**
     * Handles response from metrics api (/api/v1/metrics)
     */
    if (error !== null) {
      let errorMsg;

      if (response.body !== null && response.body.error) {
        errorMsg = response.body.error;
      } else {
        errorMsg = `${response.statusCode} - ${response.statusText}`;
      }

      this.setState(() => ({metricsLoading: false, metricsLoadError: errorMsg}));
      return;
    }

    this.setState(() => {
      return {
        rawMetrics: response.body.data.metrics,
        metrics: collapseMetrics(response.body.data.metrics),
        metricsLoading: false,
        metricsLoadError: null,
      };
    });
  }

  addChart() {
    /**
     * Adds a new (empty) chart to the page.
     */
    this.setState(state => ({charts: state.charts.concat([newChart()])}));
  }

  updateTargetChart(attr, value) {
    /**
     * Immutably updates a chart attribute with a given value. If modifying an attribute that is nested
     */
    this.setState((state) => {
      return {
        targetChart: {
          ...state.targetChart,
          [attr]: value,
        }
      };
    });
  }
      }
    });
  }

  removeChart(idx) {
    /**
     * Remove the chart at idx.
     */
    this.setState(state => {
      const charts = state.charts.slice(0, idx).concat(state.charts.slice(idx+1));
      return {charts};
    });
  }

  saveChart() {
    /**
     * Replaces the chart at targetChartIdx with targetChart and closes the settings panel.
     */

    // TODO: kick off data retrieval as needed.

    this.setState(state => {
      const id = state.targetChartIdx;
      return {
        charts: [...state.charts.slice(0, id), ...[state.targetChart], ...state.charts.slice(id + 1)],
        targetChartIdx: null,
        targetChart: null,
        settingsOpen: false
      };
    });
  }

  addMetric(metric) {
    /**
     * Adds a metric to the targetChart metrics object.
     */
    const metrics = this.state.targetChart.metrics.concat([newMetric(metric)]);
    this.updateTargetChart('metrics', metrics);
  }

  updateMetric(idx, attr, value) {
    /**
     * Updates a metric.
     * idx: index of the metric on targetChart to update
     * attr: attribute to update
     * value: value we want the attribute to have.
     */
    const newMetric = {...this.state.targetChart.metrics[idx], [attr]: value};

    this.setState((state) => {
      const oldChart = state.targetChart;
      const targetChart = {
        ...oldChart,
        metrics: [...oldChart.metrics.slice(0, idx), newMetric, ...oldChart.metrics.slice(idx + 1)],
      };

      return {targetChart};
    });
  }

  removeMetric(idx) {
    /**
     * Removes the metric from targetChart at the given index.
     */
    let metrics = this.state.targetChart.metrics;
    metrics = metrics.slice(0, idx).concat(metrics.slice(idx + 1));
    this.updateTargetChart('metrics', metrics);
  }

  openSettings(idx) {
    /**
     * Opens the settings panel for the chart at the given index.
     */
    this.setState((state) => {
      return {
        targetChartIdx: idx,
        targetChart: {...state.charts[idx], metrics: [...state.charts[idx].metrics]},
        settingsOpen: true
      }
    });
  }

  closeSettings() {
    /**
     * Closes the settings panel and does not save the changes made.
     */
    this.setState(() => ({targetChartIdx: null, targetChart: null, settingsOpen: false}));
  }

  render() {
    let dialog;

    if (this.state.settingsOpen) {
      dialog = (
        <Dialog showClose={false} okText="save" onOk={this.saveChart} onClose={this.closeSettings} size="xl">
          <ChartEditor metrics={this.state.metrics}
                       metricsLoading={this.state.metricsLoading}
                       metricsLoadError={this.state.metricsLoadError}
                       chart={this.state.targetChart}
                       addMetric={this.addMetric}
                       removeMetric={this.removeMetric}
                       updateMetric={this.updateMetric}
                       updateTargetChart={this.updateTargetChart} />
        </Dialog>
      );
    }

    const charts = this.state.charts.map((chart, idx) => {
      const openSettings = () => this.openSettings(idx);
      const removeChart = () => this.removeChart(idx);

      return (
        <Chart key={idx} chart={chart} openSettings={openSettings} removeChart={removeChart}/>
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
