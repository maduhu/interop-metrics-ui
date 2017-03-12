import React, { Component, PureComponent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ChartSettings.css';

const MEASURE_MAP = {
  raw_timer_with_interval: [
    'count', 'mean', 'min', 'median', 'max', 'std_dev', 'p75', 'p95', 'p98', 'p99', 'p999', 'mean_rate', 'one_min_rate',
    'five_min_rate', 'fifteen_min_rate',
  ],
  raw_counter_with_interval: ['count', 'interval_count'],
};

const HOURS = Array(24).fill().map((_, i) => (i < 10 ? `0${i}` : `${i}`));
const MINUTES = Array(60).fill().map((_, i) => (i < 10 ? `0${i}` : `${i}`));

class ChartTitle extends Component {
  render() {
    return (
      <div className="chart-settings__title-input">
        <label>Title:</label>
        <input
          type="text"
          value={this.props.chart.title}
          onChange={e => this.props.updateTargetChart('title', e.target.value)}
        />
      </div>
    );
  }
}

class ScaleSelect extends Component {
  render() {
    return (
      <div className="chart-settings__scale-input">
        <label>{this.props.label}</label>
        <select value={this.props.value} onChange={e => this.props.onChange(e.target.value)}>
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
        <ScaleSelect
          label="Left Axis Scale:" value={chart.leftAxis}
          onChange={value => this.props.updateTargetChart('leftAxis', value)}
        />

        <ScaleSelect
          label="Right Axis Scale:" value={chart.rightAxis}
          onChange={value => this.props.updateTargetChart('rightAxis', value)}
        />
      </div>
    );
  }
}

class HourSelect extends Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    this.props.onChange(e.target.value);
  }

  render() {
    return (
      <select className="time-input__hour" value={this.props.value} onChange={this.onChange}>
        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    );
  }
}

class MinuteSelect extends Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    this.props.onChange(e.target.value);
  }

  render() {
    return (
      <select className="time-input__minute" value={this.props.value} onChange={this.onChange}>
        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    );
  }
}

class TimeSettings extends PureComponent {
  /**
   * TODO: Support dynamic ranges.
   * Provide two types of choice for date range, Fixed and Dynamic. Fixed is what we have now, you specify a date range
   * and we always render the data between those dates. Dynamic lets you choose a dynamic start date for example:
   *    - last 24 HOURS
   *    - last week
   *    - last 2 weeks
   *    - last month
   * The end time is always "now" and the start time is always calculated based off of the duration you choose.
   */
  render() {
    return (
      <div className="time-input">
        <label className="time-input__label">{this.props.label}</label>
        <div className="time-input__select-container">
          <HourSelect value={this.props.hour} onChange={this.props.onHourChange} />
          <MinuteSelect value={this.props.minute} onChange={this.props.onMinuteChange} />
        </div>
      </div>
    );
  }
}

class DateTimeSettings extends Component {
  constructor(props) {
    super(props);
    this.changeStartDate = this.changeStartDate.bind(this);
    this.changeStartHour = this.changeStartHour.bind(this);
    this.changeStartMinute = this.changeStartMinute.bind(this);
    this.changeEndDate = this.changeEndDate.bind(this);
    this.changeEndHour = this.changeEndHour.bind(this);
    this.changeEndMinute = this.changeEndMinute.bind(this);
  }

  changeStartDate(value) {
    this.props.updateTargetChart('startDate', value);
  }

  changeStartHour(value) {
    this.props.updateTargetChart('startDate', this.props.chart.startDate.clone().hour(value));
  }

  changeStartMinute(value) {
    this.props.updateTargetChart('startDate', this.props.chart.startDate.clone().minute(value));
  }

  changeEndDate(value) {
    this.props.updateTargetChart('endDate', value);
  }

  changeEndHour(value) {
    this.props.updateTargetChart('endDate', this.props.chart.endDate.clone().hour(value));
  }

  changeEndMinute(value) {
    this.props.updateTargetChart('endDate', this.props.chart.endDate.clone().minute(value));
  }

  render() {
    const startDate = this.props.chart.startDate;
    const endDate = this.props.chart.endDate;

    return (
      <div className="chart-settings__time-inputs">
        <div className="chart-settings__date-picker">
          <label>Start Date:</label>
          <DatePicker
            selectsStart
            startDate={startDate}
            endDate={endDate}
            selected={startDate}
            onChange={this.changeStartDate}
          />
        </div>

        <TimeSettings
          label="Start Time:"
          hour={startDate.format('HH')}
          minute={startDate.format('mm')}
          onHourChange={this.changeStartHour}
          onMinuteChange={this.changeStartMinute}
        />

        <div className="chart-settings__date-picker">
          <label>End Date:</label>
          <DatePicker
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            selected={endDate}
            onChange={this.changeEndDate}
          />
        </div>

        <TimeSettings
          label="End Time:"
          hour={endDate.format('HH')}
          minute={endDate.format('mm')}
          onHourChange={this.changeEndHour}
          onMinuteChange={this.changeEndMinute}
        />
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
        const measureChange = e => this.props.updateMetric(idx, 'measure', e.target.value);
        const axisChange = e => this.props.updateMetric(idx, 'axis', e.target.value);
        let measureOptions = [<option key="" value="">Choose Measure</option>];
        measureOptions = measureOptions.concat(MEASURE_MAP[metric.table].map(measure => (
          <option key={measure} value={measure}>{measure}</option>
        )));

        return (
          <tr className="chart-settings__metric" key={idx}>
            <td>{metric.environment}</td>
            <td>{metric.application}</td>
            <td>{metric.metric_name}</td>
            <td>
              <select value={metric.measure} onChange={measureChange}>
                {measureOptions}
              </select>
            </td>
            <td>
              <select value={metric.axis} onChange={axisChange}>
                <option value="left">left</option>
                <option value="right">right</option>
              </select>
            </td>
            <td>
              <button className="flat-button" onClick={removeMetric}>
                <span className="fa fa-trash" />
              </button>
            </td>
          </tr>
        );
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
        <ChartTitle {...this.props} />

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
  chart: { metrics: [] },
};

export default ChartSettings;
