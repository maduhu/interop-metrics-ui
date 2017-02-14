import React, { Component } from 'react';
import moment from 'moment';
import Rickshaw from 'rickshaw';
import 'rickshaw/rickshaw.css';

// This color palette was stolen from d3.js 4.0 d3.schemeCategory10
const COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22",
  "#17becf"];

export class TimeSeriesChart extends Component {
  constructor(props) {
    super(props);
    this.updateSeries = this.updateSeries.bind(this);
    this.renderChart = this.renderChart.bind(this);
  }

  componentDidMount() {
    this.chartEl = this.refs.chart;
    this.series = [];
    this.graph = new Rickshaw.Graph({
      element: this.chartEl,
      stack: false,
      renderer: 'line',
      series: this.series,
    });
    this.xAxis = new Rickshaw.Graph.Axis.Time({graph: this.graph});
    this.renderChart(this.props);
  }

  static shouldComponentUpdate() {
    return false;
  }

  componentWillReceiveProps(props) {
    this.renderChart(props);
  }

  updateSeries(props) {
    /**
     * Update series requires us to mutate the existing series object, because as far as I can tell there is no way to
     * give Rickshaw new data, instead you must update the data object that you have.
     * @type {Object}
     */
    const chart = props.chart;
    const series = this.series;

    series.splice(0, series.length);

    return Object.keys(chart.data).forEach((measure, idx) => {
      const measurePieces = measure.split('.');
      const measureName = measurePieces[measurePieces.length - 1];

      series.push({
        name: measure,
        color: COLORS[idx % COLORS.length],
        data: chart.data[measure].map((row) => {
          return {
            x: moment(row.metric_timestamp).unix(),
            y: row[measureName]
          }
        }),
      });
    });
  }

  renderChart(props) {
    this.updateSeries(props);
    this.graph.render();
    this.xAxis.render();
  }

  render() {
    return <div className="time-series" ref="chart"></div>;
  }
}

export default TimeSeriesChart;
