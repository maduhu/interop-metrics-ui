import React, { Component } from 'react';
import './ChartSettings.css';

class ChartSettings extends Component {
  render() {
    const chart = this.props.chart;
    let body;

    if (chart.measures.length === 0) {
      body = <div>No metrics selected.</div>;
    } else {
      const measures = chart.measures.map((measure, idx) => {
        const removeMeasure = () => this.props.removeMeasure(idx);

        return (
          <tr className="chart-settings__metric" key={idx}>
            <td>
              {measure.metric_name}
            </td>
            <td>
              measure
            </td>
            <td>
              axis
            </td>
            <td>
              <button className="flat-button" onClick={removeMeasure}>
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
            <th className="chart-settings__th">Metric</th>
            <th className="chart-settings__th">Measure</th>
            <th className="chart-settings__th">Axis</th>
            <th className="chart-settings__th">&nbsp;</th>
          </tr>

          {measures}
          </tbody>
        </table>
      );
    }

    return (
      <div className="chart-settings">
        <div className="chart-settings__time-inputs">
          <input className="chart-settings__time-input" type="text" value={this.props.startDate} />
          <input className="chart-settings__time-input" type="text" value={this.props.starTime} />
          <input className="chart-settings__time-input" type="text" value={this.props.endDate} />
          <input className="chart-settings__time-input" type="text" value={this.props.endTime} />
        </div>

        <div className="chart-settings__measures">
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
