import React, { Component } from 'react';


export class TimeSeriesChart extends Component {
  render() {
    return (
      <div className="time-series">
        Need to plot {this.props.metrics.map(metric => metric.metric_name).join(', ')}
      </div>
    );
  }
}

export default TimeSeriesChart;
