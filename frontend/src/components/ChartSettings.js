import React, { Component } from 'react';
import './ChartSettings.css';

class ChartSettings extends Component {
  render() {
    const chart = this.props.chart;
    let body;

    if (chart.metrics.length === 0) {
      body = <div>No metrics selected.</div>;
    } else {
      const metrics = chart.metrics.map((metric, idx) => {
        const removeMetric = () => this.props.removeMetric(idx);

        return (
          <tr className="chart-settings__metric" key={idx}>
            <td>{metric.environment}</td>
            <td>{metric.application}</td>
            <td>{metric.metric_name}</td>
            <td>{metric.measure}</td>
            <td>{metric.axis}</td>
            <td>
              <button className="flat-button" onClick={removeMetric}>
                <span className="fa fa-trash"></span>
              </button>
            </td>
          </tr>
        )
      });
      body = (
        <table className="chart-settings__table">
          <tbody>
          <tr>
            <th className="chart-settings__th">Environment</th>
            <th className="chart-settings__th">Application</th>
            <th className="chart-settings__th">Metric</th>
            <th className="chart-settings__th">Measure</th>
            <th className="chart-settings__th">Axis</th>
            <th className="chart-settings__th">&nbsp;</th>
          </tr>

          {metrics}
          </tbody>
        </table>
      );
    }

    return (
      <div className="chart-settings">
        <div className="chart-settings__time-inputs">
          <input className="chart-settings__time-input" type="text" value={this.props.startDate} />
          <input className="chart-settings__time-input" type="text" value={this.props.startTime} />
          <input className="chart-settings__time-input" type="text" value={this.props.endDate} />
          <input className="chart-settings__time-input" type="text" value={this.props.endTime} />
        </div>

        <div className="chart-settings__metrics">
          {body}
        </div>
      </div>
    );
  }
}

ChartSettings.propTypes = {
  chart: React.PropTypes.object,
};

ChartSettings.defaultProps = {
  chart: {metrics: []},
};

export default ChartSettings;
