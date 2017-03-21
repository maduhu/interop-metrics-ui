import React, { Component, PureComponent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ChartSettings.css';

const MEASURE_MAP = {
  raw_timer_with_interval: [
    'count', 'interval_count', 'mean', 'min', 'median', 'max', 'std_dev', 'p75', 'p95', 'p98', 'p99', 'p999',
    'mean_rate', 'one_min_rate', 'five_min_rate', 'fifteen_min_rate',
  ],
  raw_counter_with_interval: ['count', 'interval_count'],
};
const DYNAMIC = 'dynamic';
const FIXED = 'fixed';
const RANGE_PERIODS = ['minutes', 'hours', 'days'];
const HOURS = new Array(24).fill(null).map((_, i) => (i < 10 ? `0${i}` : `${i}`));
const MINUTES = new Array(60).fill(null).map((_, i) => (i < 10 ? `0${i}` : `${i}`));

class ChartTitle extends PureComponent {
  render() {
    return (
      <div className="settings-title">
        <label className="settings-label">Title:</label>
        <input
          type="text"
          value={this.props.chart.title}
          onChange={e => this.props.updateTargetChart('title', e.target.value)}
        />
      </div>
    );
  }
}

class ScaleSelect extends PureComponent {
  render() {
    return (
      <div className="scale-select">
        <label className="settings-label">{this.props.label}</label>

        <select value={this.props.value} onChange={e => this.props.onChange(e.target.value)}>
          <option value="linear">linear</option>
          <option value="log">log</option>
        </select>
      </div>
    );
  }
}

class ScaleSettings extends PureComponent {
  render() {
    const chart = this.props.chart;
    const leftChange = value => this.props.updateTargetChart('leftAxis', value);
    const rightChange = value => this.props.updateTargetChart('leftAxis', value);

    return (
      <div className="scale-settings">
        <ScaleSelect label="Left Axis Scale:" value={chart.leftAxis} onChange={leftChange} />

        <ScaleSelect label="Right Axis Scale:" value={chart.rightAxis} onChange={rightChange} />
      </div>
    );
  }
}

class HourSelect extends PureComponent {
  render() {
    const onChange = e => this.props.onChange(e.target.value);

    return (
      <div className="chart-settings__input-wrapper">
        <select className="time-input__hour" value={this.props.value} onChange={onChange}>
          {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
    );
  }
}

class MinuteSelect extends PureComponent {
  render() {
    const onChange = e => this.props.onChange(e.target.value);

    return (
      <div className="chart-settings__input-wrapper">
        <select className="time-input__minute" value={this.props.value} onChange={onChange}>
          {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    );
  }
}

class TimeSettings extends PureComponent {
  render() {
    return (
      <div className="time-input">
        <label className="settings-label">{this.props.label}</label>

        <div className="time-input__select">
          <HourSelect value={this.props.hour} onChange={this.props.onHourChange} />
          <MinuteSelect value={this.props.minute} onChange={this.props.onMinuteChange} />
        </div>
      </div>
    );
  }
}

class DynamicDateSettings extends Component {
  constructor(props) {
    super(props);
    this.changeRangePeriod = this.changeRangePeriod.bind(this);
    this.changeRangeMultiplier = this.changeRangeMultiplier.bind(this);
  }

  changeRangePeriod(e) {
    this.props.updateTargetChart('rangePeriod', e.target.value);
  }

  changeRangeMultiplier(e) {
    this.props.updateTargetChart('rangeMultiplier', e.target.value);
  }

  render() {
    const rangePeriod = this.props.chart.rangePeriod;
    const rangeMultiplier = this.props.chart.rangeMultiplier;

    return (
      <div className="dynamic-date-settings">
        <label className="settings-label">Range:</label>

        <div>
          <div className="chart-settings__input-wrapper">
            <input
              className="dynamic-multiplier"
              type="number"
              value={rangeMultiplier}
              onChange={this.changeRangeMultiplier}
            />
          </div>

          <div className="chart-settings__input-wrapper">
            <select
              className="dynamic-period"
              value={rangePeriod}
              onChange={this.changeRangePeriod}
            >
              {RANGE_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>
    );
  }
}

class FixedDateSettings extends Component {
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
      <div className="fixed-date-settings">
        <div className="date-time">
          <div className="date-picker">
            <label className="settings-label">Start Date:</label>
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
        </div>

        <div className="date-time">
          <div className="date-picker">
            <label className="settings-label">End Date:</label>
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
      </div>
    );
  }
}

class RangePicker extends PureComponent {
  render() {
    const rangeType = this.props.chart.rangeType;
    const setDynamicRangeType = () => this.props.updateTargetChart('rangeType', DYNAMIC);
    const setFixedRangeType = () => this.props.updateTargetChart('rangeType', FIXED);

    return (
      <div className="range-picker">
        <label className="settings-label">Range Type:</label>

        <div className="range-picker__radio-group" >
          <label htmlFor="dynamic">
            <input
              id="dynamic"
              type="radio"
              value={DYNAMIC}
              name="range-type"
              checked={rangeType === DYNAMIC}
              onChange={setDynamicRangeType}
            />

            <span className="range-picker__label">
              Dynamic
            </span>
          </label>

          <label htmlFor="fixed">
            <input
              id="fixed"
              type="radio"
              value={FIXED}
              name="range-type"
              checked={rangeType === FIXED}
              onChange={setFixedRangeType}
            />
            <span className="range-picker__label">
              Fixed
            </span>
          </label>
        </div>
      </div>
    );
  }
}

class MetricsSettings extends PureComponent {
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
          <tr className="metrics-settings__metric" key={idx}>
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
        <table className="metrics-settings__table">
          <tbody>
            <tr>
              <th className="metrics-settings__th">Environment</th>
              <th className="metrics-settings__th">Application</th>
              <th className="metrics-settings__th">Metric</th>
              <th className="metrics-settings__th">Measure</th>
              <th className="metrics-settings__th">Axis</th>
              <th className="metrics-settings__th">&nbsp;</th>
            </tr>

            {metrics}
          </tbody>
        </table>
      );
    }

    return (
      <div className="metrics-settings">
        <label className="settings-label">Metrics:</label>

        {body}
      </div>
    );
  }
}

class ChartSettings extends PureComponent {
  render() {
    const rangeType = this.props.chart.rangeType;

    return (
      <div className={`chart-settings ${this.props.hidden ? 'chart-settings--hidden' : ''}`}>
        <div className="chart-settings__row">
          <ChartTitle {...this.props} />
        </div>

        <div className="chart-settings__row">
          <ScaleSettings {...this.props} />
        </div>
        <div className="chart-settings__row">
          <RangePicker {...this.props} />
        </div>

        <div className="chart-settings__row">
          {rangeType === DYNAMIC ? <DynamicDateSettings {...this.props} /> : <FixedDateSettings {...this.props} />}
        </div>

        <div className="chart-settings__row">
          <MetricsSettings {...this.props} />
        </div>
      </div>
    );
  }
}

export default ChartSettings;
