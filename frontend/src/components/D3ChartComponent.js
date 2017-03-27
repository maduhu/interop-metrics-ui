import React, { Component } from 'react';
import D3Chart from '../viz/D3Chart';

function isLoading(data) {
  return Object.values(data).some(series => series.loading);
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
      .data(chart.data)
      .previewData(chart.previewData);

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
      if (!isLoading(p1)) {
        this.graph.xPreviewDomain(previewDomain).previewData(p1);
      } else {
        // TODO: Implement loading state method and toggle loading state here.
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

        this.graph.xDomain(dataDomain).data(d1);
      } else {
        // TODO: Implement loading state method and toggle loading state here.
      }
    }

    this.renderChart(props);
  }

  componentWillUnmount() {
    // TODO: implement an unmount method on D3Chart and use it here.
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
