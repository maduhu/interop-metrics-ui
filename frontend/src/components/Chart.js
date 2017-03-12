import React, { PureComponent } from 'react';
import { D3ChartComponent } from './D3ChartComponent';
import { LoadingCube } from './LoadingCube';
import './Chart.css';

export class Chart extends PureComponent {
  constructor(props) {
    super(props);
    this.isLoading = this.isLoading.bind(this);
    this.errors = this.errors.bind(this);
    this.openSettings = this.openSettings.bind(this);
    this.removeChart = this.removeChart.bind(this);
    this.refreshChart = this.refreshChart.bind(this);
  }

  isLoading() {
    return Object.values(this.props.chart.previewData).some(series => series === '__loading__');
  }

  errors() {
    const reducer = (errors, value, idx) => {
      if (!Array.isArray(value) && value !== '__loading__') {
        errors.push(<div key={idx} className="chart__loading-error">{value}</div>);
      }

      return errors;
    };

    const previewErrors = Object.values(this.props.chart.previewData).reduce(reducer, []);
    const dataErrors = Object.values(this.props.chart.data).reduce(reducer, []);

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
      chartArea = <D3ChartComponent {...this.props} />;
    }

    return (
      <div className="chart">
        <div className="chart__icons">
          <button className="chart__icon button" onClick={this.refreshChart}>
            <span className="fa fa-refresh" />
          </button>

          <button className="chart__icon button" onClick={this.openSettings}>
            <span className="fa fa-pencil" />
          </button>

          <button className="chart__icon button" onClick={this.removeChart}>
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
