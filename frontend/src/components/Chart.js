import React, { PureComponent } from 'react';
import { TimeSeries } from './TimeSeries';
import './Chart.css';

export class Chart extends PureComponent {
  constructor(props) {
    super(props);
    this.errors = this.errors.bind(this);
    this.openSettings = this.openSettings.bind(this);
    this.removeChart = this.removeChart.bind(this);
    this.refreshChart = this.refreshChart.bind(this);
    this.moveUp = this.moveUp.bind(this);
    this.moveDown = this.moveDown.bind(this);
  }

  errors() {
    const reducer = (errors, value, idx) => {
      if (value.error !== null) {
        errors.push(<div key={idx} className="chart__loading-error">{value.error}</div>);
      }

      return errors;
    };

    const previewErrors = this.props.chart.previewData.reduce(reducer, []);
    const dataErrors = this.props.chart.data.reduce(reducer, []);

    return previewErrors.concat(dataErrors);
  }

  openSettings() {
    this.props.openSettings(this.props.idx);
  }

  removeChart() {
    this.props.removeChart(this.props.idx);
  }

  refreshChart() {
    this.props.refreshChart(this.props.idx);
  }

  moveUp() {
    this.props.moveUp(this.props.idx);
  }

  moveDown() {
    this.props.moveDown(this.props.idx);
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
    } else {
      chartArea = <TimeSeries {...this.props} />;
    }

    return (
      <div className="chart">
        <div className="chart__title">
          <h5>{chart.title}</h5>
        </div>
        <div className="chart__icons">
          <button className="chart__icon button" onClick={this.moveUp}>
            <span className="fa fa-arrow-up" />
          </button>

          <button className="chart__icon button" onClick={this.moveDown}>
            <span className="fa fa-arrow-down" />
          </button>

          <button className="chart__icon button" onClick={this.refreshChart}>
            <span className="fa fa-refresh" />
          </button>

          <button className="chart__icon button" onClick={this.openSettings}>
            <span className="fa fa-pencil" />
          </button>

          <button className="chart__icon button button--delete" onClick={this.removeChart}>
            <span className="fa fa-trash" />
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
