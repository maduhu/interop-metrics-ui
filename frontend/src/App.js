import React, { Component } from 'react';
import request from 'superagent/lib/client';
import './App.css';
import { Dialog } from './components/Dialog';
import { collapseMetrics, MeasurePicker } from './components/MeasurePicker';
import { Chart } from './components/Chart';

class App extends Component {
  constructor(props) {
    super(props);
    this.onLoadMetrics = this.onLoadMetrics.bind(this);
    this.onMeasurePicked = this.onMeasurePicked.bind(this);
    this.addChart = this.addChart.bind(this);
    this.openMeasurePicker = this.openMeasurePicker.bind(this);
    this.closeMeasurePicker = this.closeMeasurePicker.bind(this);
    this.removeChart = this.removeChart.bind(this);

    this.state = {
      rawMetrics: [],
      metrics: {},
      loading: true,
      loadError: null,
      charts: [],
      measurePickerTarget: null,
      measurePickerOpen: false,
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
        loading: false,
        loadError: errorMsg,
      });

      return;
    }

    this.setState({
      rawMetrics: response.body.data.metrics,
      metrics: collapseMetrics(response.body.data.metrics),
      metricsLoading: false,
      metricsLoadError: null,
      charts: [],
    });
  }

  addChart() {
    this.setState(state => ({charts: state.charts.concat([{measures: []}])}));
  }

  removeChart(idx) {
    this.setState(state => {
      const charts = state.charts.slice(0, idx).concat(state.charts.slice(idx+1));
      return {charts};
    });
  }

  openMeasurePicker(id) {
    this.setState({measurePickerTarget: id, measurePickerOpen: true});
  }

  closeMeasurePicker() {
    this.setState({measurePickerTarget: null, measurePickerOpen: false});
  }

  onMeasurePicked(id, table, metric, measure, axis) {
    // TODO: handle measure being picked for chart.
  }

  render() {
    let dialog;

    if (this.state.measurePickerOpen) {
      let measurePicker;

      if (this.state.metricsLoading) {
        measurePicker = <div className="loading-picker">Loading metrics...</div>;
      } else if (this.state.loadError !== null) {
        measurePicker = <div className="error">{this.state.metricsLoadError}</div>;
      } else {
        measurePicker = <MeasurePicker metrics={this.state.metrics} onMeasurePicked={this.onMeasurePicked} />;
      }

      dialog = (
        <Dialog>
          <button className="button" onClick={this.closeMeasurePicker}>X</button>
          {measurePicker}
        </Dialog>
      );
    }

    const charts = this.state.charts.map((chart, idx) => {
      return (
        <Chart key={idx} id={idx} openMeasurePicker={this.openMeasurePicker} removeChart={this.removeChart}/>
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
