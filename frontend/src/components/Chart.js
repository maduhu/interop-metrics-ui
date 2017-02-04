import React, { Component } from 'react';
import { TimeSeriesChart } from './TimeSeriesChart';
import './Chart.css';

export class Chart extends Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
    this.openMeasurePicker = this.openMeasurePicker.bind(this);
  }

  close() {
    this.props.removeChart(this.props.id);
  }

  openMeasurePicker() {
    this.props.openMeasurePicker(this.props.id);
  }

  render() {
    const measures = this.props.measures ? this.props.measures : [];
    let chartArea;

    if (measures.length === 0) {
      chartArea = (
        <div className="chart-area__blank">
          <span>No metrics chosen, </span>
          <button className="button" onClick={this.openMeasurePicker}>choose a metric</button>
          <span> to visualize.</span>
        </div>
      );
    } else {
      chartArea = <TimeSeriesChart measures={measures} />;
    }

    return (
      <div className="chart">
        <div className="chart__remove">
          <button className="button" onClick={this.close}>X</button>
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
