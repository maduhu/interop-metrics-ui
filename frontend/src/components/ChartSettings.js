import React, { Component } from 'react';
import './ChartSettings.css';

const measureMap = {
  'raw_timer_with_interval': ['count', 'mean', 'min', 'median', 'max', 'std_dev', 'p75', 'p95', 'p98', 'p99', 'p999',
    'mean_rate', 'one_min_rate', 'five_min_rate', 'fifteen_min_rate'],
  'raw_counter_with_interval': ['count', 'interval_count'],
};

class ScaleSelect extends Component {
  render() {
    return (
      <div className="chart-settings__scale-input">
        <label>{this.props.label}</label>
        <select value={this.props.value} onChange={(e) => this.props.onChange(e.target.value)}>
          <option value="linear">linear</option>
          <option value="log">log</option>
        </select>
      </div>
    );
  }
}

class ScaleSettings extends Component {
  render() {
    const chart = this.props.chart;

    return (
      <div className="chart-settings__scale-inputs">
        <ScaleSelect label="Left Axis Scale:" value={chart.leftAxis}
                     onChange={value => this.props.updateChart('leftAxis', value)} />

        <ScaleSelect label="Right Axis Scale:" value={chart.rightAxis}
                     onChange={value => this.props.updateChart('rightAxis', value)} />
      </div>
    );
  }
}

class DateTimeSettings extends Component {
  constructor(props) {
    super(props);
    this.changeStartDate = this.changeStartDate.bind(this);
    this.changeStartTime = this.changeStartTime.bind(this);
    this.changeEndDate = this.changeEndDate.bind(this);
    this.changeEndTime = this.changeEndTime.bind(this);
  }

  changeStartDate(e) {
    this.props.updateChart('startDate', e.target.value);
  }

  changeStartTime(e) {
    this.props.updateChart('startTime', e.target.value);
  }

  changeEndDate(e) {
    this.props.updateChart('endDate', e.target.value);
  }

  changeEndTime(e) {
    this.props.updateChart('endTime', e.target.value);
  }

  render() {
    const datePlaceHolder = 'YYYY-MM-DD';
    const timePlaceHolder = 'HH:MM:SS';
    const chart = this.props.chart;

    return (
      <div className="chart-settings__time-inputs">
        <div className="chart-settings__time-input">
          <label>Start Date:</label>
          <input type="text" value={chart.startDate} onChange={this.changeStartDate} placeholder={datePlaceHolder} />
        </div>

        <div className="chart-settings__time-input">
          <label>Start Time:</label>
          <input type="text" value={chart.startTime} onChange={this.changeStartTime} placeholder={timePlaceHolder} />
        </div>

        <div className="chart-settings__time-input">
          <label>End Date:</label>
          <input type="text" value={chart.endDate} onChange={this.changeEndDate} placeholder={datePlaceHolder} />
        </div>

        <div className="chart-settings__time-input">
          <label>End Time:</label>
          <input type="text" value={chart.endTime} onChange={this.changeEndTime} placeholder={timePlaceHolder} />
        </div>
      </div>
    );
  }
}

class MetricsSettings extends Component {
  render() {
    const chart = this.props.chart;
    let body = <div>No metrics selected.</div>;

    if (chart.metrics.length > 0) {
      const metrics = chart.metrics.map((metric, idx) => {
        const removeMetric = () => this.props.removeMetric(idx);
        const measureChange = (e) => this.props.updateMetric(idx, 'measure', e.target.value);
        const axisChange = (e) => this.props.updateMetric(idx, 'axis', e.target.value);
        let measureOptions = [<option key="" value="">Choose Measure</option>];
        measureOptions = measureOptions.concat(measureMap[metric.table].map((measure) => (
          <option key={measure} value={measure}>{measure}</option>
        )));
        const measureSelect = (
          <select value={metric.measure} onChange={measureChange}>
            {measureOptions}
          </select>
        );
        const axisSelect = (
          <select value={metric.axis} onChange={axisChange}>
            <option value="left">left</option>
            <option value="right">right</option>
          </select>
        );

        return (
          <tr className="chart-settings__metric" key={idx}>
            <td>{metric.environment}</td>
            <td>{metric.application}</td>
            <td>{metric.metric_name}</td>
            <td>{measureSelect}</td>
            <td>{axisSelect}</td>
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
      <div className="chart-settings__metrics">
        <label>Metrics:</label>
        {body}
      </div>
    );
  }
}

class ChartSettings extends Component {
  render() {
    return (
      <div className={`chart-settings ${this.props.hidden ? 'chart-settings--hidden' : ''}`}>
        <DateTimeSettings {...this.props} />

        <ScaleSettings {...this.props} />

        <MetricsSettings {...this.props} />
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
