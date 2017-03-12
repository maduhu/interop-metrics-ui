import React, { Component } from 'react';
import { generateMetricsKey } from '../utils';
import D3Chart from './D3Chart';

function buildSeries(metrics, data) {
  return metrics.reduce((series, metric) => {
    const key = generateMetricsKey(metric);
    const rows = data[key];

    series.push({
      name: key,
      rows: rows,
      axis: metric.axis,
    });

    return series;
  }, []);
}

function isLoading(data) {
  return Object.values(data).some(series => series === '__loading__');
}

export class D3ChartComponent extends Component {
  static shouldComponentUpdate() {
    return false;
  }

  constructor(props) {
    super(props);
    this.renderChart = this.renderChart.bind(this);
    this.cancelSelection = this.cancelSelection.bind(this);
    this.makeSelection = this.makeSelection.bind(this);
    this.scheduleSelection = this.scheduleSelection.bind(this);
    this.pending = null;
  }

  componentDidMount() {
    const chart = this.props.chart;
    const previewDomain = ([chart.startDate.toDate(), chart.endDate.toDate()]);
    let dataDomain;

    if (chart.selectionStartDate === null) {
      dataDomain = previewDomain;
    } else {
      dataDomain = [chart.selectionStartDate, chart.selectionEndDate];
    }

    this.graph = D3Chart(this.el)
      .onBrush(this.cancelSelection)
      .onBrushEnd(this.scheduleSelection)
      .xDomain(dataDomain)
      .xPreviewDomain(previewDomain)
      .data(buildSeries(chart.metrics, chart.previewData))
      .previewData(buildSeries(chart.metrics, chart.previewData));

    this.renderChart(this.props);
  }

  componentWillReceiveProps(props) {
    const p0 = this.props.chart.previewData;
    const p1 = props.chart.previewData;
    const d0 = this.props.chart.data;
    const d1 = props.chart.data;
    const chart = props.chart;
    const previewDomain = ([chart.startDate.toDate(), chart.endDate.toDate()]);

    // eslint-disable-next-line
    if (p0 != p1) {
      console.log('preview data changed');

      if (!isLoading(p1)) {
        this.graph.xPreviewDomain(previewDomain).previewData(buildSeries(chart.metrics, p1));
      } else {
        // toggle loading state.
        console.log('loading preview data');
      }
    }

    // eslint-disable-next-line
    if (d0 != d1) {
      if (!isLoading(d1)) {
        let dataDomain;

        if (chart.selectionStartDate === null) {
          // TODO: add a method to clear clear selection in D3Chart and use it here.
          dataDomain = previewDomain;
        } else {
          dataDomain = [chart.selectionStartDate, chart.selectionEndDate];
        }

        this.graph.xDomain(dataDomain).data(buildSeries(chart.metrics, d1));
      } else {
        // TODO: Implement loading state method and toggle loading state here.
      }
    }

    this.renderChart(props);
  }

  componentWillUnmount() {
    // TODO: implement an unmount method on D3Chart and use it here.
    console.log('unmounting!', this.el);
  }

  cancelSelection() {
    window.clearTimeout(this.pending);
    this.pending = null;
  }

  makeSelection(selection) {
    this.props.onSelection(this.props.idx, selection);
    this.pending = null;
  }

  scheduleSelection(selection) {
    if (this.pending !== null) {
      this.cancelSelection();
    }

    this.pending = window.setTimeout(this.makeSelection, 600, selection);
  }

  renderChart(props) {
    const chart = props.chart;

    this.graph.leftScale(chart.leftAxis)
      .rightScale(chart.rightAxis)
      .render();
  }

  render() {
    return <div className="time-series-container" ref={el => (this.el = el)} />;
  }
}

export default D3ChartComponent;
