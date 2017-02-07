import React, { Component } from 'react';
import { TimeSeriesChart } from './TimeSeriesChart';
import './Chart.css';

export class Chart extends Component {
  render() {
    const config = this.props.config;
    const metrics = config.metrics;
    let chartArea;

    if (metrics.length === 0) {
      chartArea = (
        <div className="chart-area__blank">
          <span>No metrics chosen, </span>
          <button className="button" onClick={this.props.openSettings}>choose a metric</button>
          <span> to visualize.</span>
        </div>
      );
    } else {
      chartArea = <TimeSeriesChart metrics={metrics} />;
    }

    return (
      <div className="chart">
        <div className="chart__icons">
          <button className="chart__icon button" onClick={this.props.openSettings}>
            <span className="fa fa-pencil"></span>
          </button>

          <button className="chart__icon button" onClick={this.props.removeChart}>
            <span className="fa fa-trash"></span>
          </button>
        </div>

        <div className="chart__controls">
        </div>

        <div className="chart-area">
          {chartArea}
        </div>
      </div>
    );
  }
}

export default Chart;
