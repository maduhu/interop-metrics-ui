import React, { PureComponent } from 'react';
import { TimeSeriesChart } from './TimeSeriesChart';
import { LoadingCube } from './LoadingCube';
import './Chart.css';

export class Chart extends PureComponent {
  constructor(props) {
    super(props);
    this.isLoading = this.isLoading.bind(this);
    this.errors = this.errors.bind(this);
    this.openSettings = this.openSettings.bind(this);
    this.removeChart = this.removeChart.bind(this);
  }

  isLoading() {
    return Object.values(this.props.chart.data).some(series => series === '__loading__');
  }

  errors() {
    return Object.values(this.props.chart.data).reduce((errors, value, idx) => {
      if(!Array.isArray(value) && value !== '__loading__') {
        errors.push(<div key={idx} className="chart__loading-error">{value}</div>);
      }

      return errors;
    }, []);
  }

  openSettings() {
    this.props.openSettings(this.props.idx);
  }

  removeChart() {
    this.props.removeChart(this.props.idx);
  }

  render() {
    const chart = this.props.chart;
    const metrics = chart.metrics;
    const errors = this.errors();
    let chartArea;

    if (metrics.length === 0) {
      chartArea = (
        <div className="chart-area__blank">
          <span>No metrics chosen, </span>
          <button className="button" onClick={this.openSettings}>choose a metric</button>
          <span> to visualize.</span>
        </div>
      );
    } else if (errors.length > 0) {
      chartArea = (
        <div className="chart__loading-errors">
          <div className="chart__error-title">Errors loading chart data:</div>
          {errors}
        </div>
      );
    } else if (this.isLoading()) {
      chartArea = <LoadingCube>Loading data...</LoadingCube>;
    } else {
      chartArea = <TimeSeriesChart {...this.props} />;
    }

    return (
      <div className="chart">
        <div className="chart__icons">
          <button className="chart__icon button" onClick={this.openSettings}>
            <span className="fa fa-pencil"></span>
          </button>

          <button className="chart__icon button" onClick={this.removeChart}>
            <span className="fa fa-trash"></span>
          </button>
        </div>

        <div className="chart-area">
          {chartArea}
        </div>
      </div>
    );
  }
}

export default Chart;
