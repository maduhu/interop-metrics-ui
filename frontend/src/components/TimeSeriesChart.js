import React, { Component } from 'react';
// import Rickshaw from 'rickshaw';

export class TimeSeriesChart extends Component {
  componentDidMount() {
    this.chartEl = this.refs.chart;
    this.renderChart(this.props);
  }

  static shouldComponentUpdate() {
    return false;
  }

  componentWillReceiveProps(props) {
    this.renderChart(props);
  }

  renderChart(props) {
    const chart = props.chart;
    const text = `Need to plot ${chart.metrics.map(metric => metric.metric_name).join(', ')}`;
    this.chartEl.textContent = text;
  }

  render() {
    return (
      <div className="time-series" ref="chart">
      </div>
    );
  }
}

export default TimeSeriesChart;
