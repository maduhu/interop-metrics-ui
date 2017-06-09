import React, { PureComponent } from 'react';
import { TimeSeries } from './TimeSeries';
import ConfigButtons from './ConfigButtons';
import './Chart.css';

export class Chart extends PureComponent {
  constructor(props) {
    super(props);
    this.errors = this.errors.bind(this);
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

  render() {
    const idx = this.props.idx;
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

        <div className="chart-config-buttons">
          <ConfigButtons
            moveUp={() => this.props.moveUp(idx)}
            moveDown={() => this.props.moveDown(idx)}
            refresh={() => this.props.refreshChart(idx)}
            settings={() => this.props.openSettings(idx)}
            remove={() => this.props.removeChart(idx)}
          />
        </div>

        <div className="chart-area">
          {chartArea}
        </div>
      </div>
    );
  }
}

export default Chart;
