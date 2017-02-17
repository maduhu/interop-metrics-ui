import React, { Component } from 'react';
import moment from 'moment';
import d3 from 'd3';
import Rickshaw from 'rickshaw';
import 'rickshaw/src/css/graph.css';
import 'rickshaw/src/css/detail.css';
import './TimeSeriesChart.css';
import { generateMetricsKey } from '../utils';

// This color palette was stolen from d3.js 4.0 d3.schemeCategory10
const COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22",
  "#17becf"];

export class TimeSeriesChart extends Component {
  constructor(props) {
    super(props);
    this.updateChart = this.updateChart.bind(this);
    this.renderChart = this.renderChart.bind(this);
  }

  componentDidMount() {
    this.hasLeftAxis = false;
    this.hasRightAxis = false;
    this.series = [];
    this.graph = new Rickshaw.Graph({
      element: this.refs.chart,
      stack: false,
      renderer: 'line',
      interpolation: 'linear',
      series: this.series,
    });
    this.xAxis = new Rickshaw.Graph.Axis.Time({
      graph: this.graph,
    });
    this.leftScale = d3.scale.linear();
    this.leftAxis = new Rickshaw.Graph.Axis.Y.Scaled({
      graph: this.graph,
      orientation: 'left',
      scale: this.leftScale,
      tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
      element: this.refs.leftAxis,
    });
    this.rightScale = d3.scale.linear();
    this.rightAxis = new Rickshaw.Graph.Axis.Y.Scaled({
      graph: this.graph,
      orientation: 'right',
      scale: this.rightScale,
      tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
      element: this.refs.rightAxis,
    });
    this.legend = new Rickshaw.Graph.Legend({
      graph: this.graph,
      element: this.refs.legend
    });
    this.hoverDetail = new Rickshaw.Graph.HoverDetail({
      graph: this.graph
    });
    this.preview = new Rickshaw.Graph.RangeSlider.Preview( {
      graph: this.graph,
      element: this.refs.zoom,
    } );
    this.updateChart(this.props);
    this.renderChart();
  }

  static shouldComponentUpdate() {
    return false;
  }

  componentWillReceiveProps(props) {
    this.updateChart(props);
    this.renderChart();
  }

  updateChart(props) {
    /**
     * Update all of the necessary parts required to render the chart.
     */
    let leftMin = null;
    let leftMax = null;
    let rightMin = null;
    let rightMax = null;
    const chart = props.chart;
    const series = this.series;
    this.leftScale = chart.leftAxis === 'linear' ? d3.scale.linear() : d3.scale.log();
    this.leftAxis.scale = this.leftScale;
    this.rightScale = chart.rightAxis === 'linear' ? d3.scale.linear() : d3.scale.log();
    this.rightAxis.scale = this.rightScale;
    this.hasLeftAxis = chart.metrics.some(m => m.axis === 'left');
    this.hasRightAxis = chart.metrics.some(m => m.axis === 'right');

    /**
     * I don't like it, but we have to mutate the series object in place, as opposed to generating a new one every time,
     * because Rickshaw does not provide any methods for updating the series object with a new one. Even the configure
     * method which claims to take all arguments that the Rickshaw.Graph constructor takes, does not allow you to pass
     * in new data.
     */
    series.splice(0, series.length);

    chart.metrics.forEach((m, idx) => {
      const isLeft = m.axis === 'left';
      const scale = isLeft ? this.leftScale : this.rightScale;
      const dataKey = generateMetricsKey(m);
      const data = chart.data[dataKey].map((row) => {
        const value = row[m.measure];

        if (isLeft) {
          if (leftMin === null) {
            leftMin = value;
          } else if (value < leftMin) {
            leftMin = value;
          }

          if (leftMax === null) {
            leftMax = value;
          } else if (value > leftMax) {
            leftMax = value;
          }
        } else {
          if (rightMin === null) {
            rightMin = value;
          } else if (value < rightMin) {
            rightMin = value;
          }

          if (rightMax === null) {
            rightMax = value;
          } else if (value > rightMax) {
            rightMax = value;
          }
        }

        return {
          x: moment(row.metric_timestamp).unix(),
          y: row[m.measure],
        }
      });

      series.push({
        scale,
        name: dataKey,
        color: COLORS[idx % COLORS.length],
        data: data,
      });
    });

    this.leftScale.domain([leftMin, leftMax]);
    this.rightScale.domain([rightMin, rightMax]);
  }

  renderChart() {
    /**
     * Renders the Rickshaw components.
     *
     * TODO: allow zooming
     */

    this.graph.render();
    this.legend.render();
    this.xAxis.render();
    this.leftAxis.render();
    this.rightAxis.render();

    if (this.hasLeftAxis) {
      this.refs.leftAxis.classList.remove('time-series__axis--hidden');
    } else {
      this.refs.leftAxis.classList.add('time-series__axis--hidden');
    }

    if (this.hasRightAxis) {
      this.refs.rightAxis.classList.remove('time-series__axis--hidden');
    } else {
      this.refs.rightAxis.classList.add('time-series__axis--hidden');
    }
  }

  render() {
    return (
      <div className="time-series-container">
        <div className="time-series">
          <div className="time-series__axis" ref="leftAxis"></div>
          <div className="time-series__chart" ref="chart"></div>
          <div className="time-series__axis" ref="rightAxis"></div>
        </div>
        <div className="time-series-legend" ref="zoom"></div>
        <div className="time-series-legend" ref="legend"></div>
      </div>
    );
  }
}

export default TimeSeriesChart;
