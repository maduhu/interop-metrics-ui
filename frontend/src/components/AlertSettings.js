import React, { PureComponent } from 'react';
import { has, measureMap, unitMap } from '../utils';
import './AlertSettings.css';

class AlertSection extends PureComponent {
  render() {
    return (
      <div className="alert-section">
        <label className="alert-section__label">
          {this.props.label}
        </label>

        <span className="alert-section__value">
          {this.props.value}
        </span>
      </div>
    );
  }
}

class MeasurePicker extends PureComponent {
  render() {
    const onChange = e => this.props.onChange(e.target.value);
    const options = measureMap[this.props.table].map(measure => (
      <option key={measure} value={measure}>{measure}</option>
    ));

    return (
      <select value={this.props.value} onChange={onChange}>
        {[
          <option key="" value="">Choose Measure</option>,
          ...options,
        ]}
      </select>
    );
  }
}

class AlertInput extends PureComponent {
  render() {
    const value = this.props.value;
    const unit = this.props.unit;
    const onChange = e => this.props.onChange(e.target.value);

    return (
      <span className="alert-input">
        <input type="number" step="any" value={value === null ? '' : value} onChange={onChange} />
        <span className="rate-unit"> {unit}</span>
      </span>
    );
  }
}

export default class AlertSettings extends PureComponent {
  constructor(props) {
    super(props);
    this.changeMeasure = this.changeMeasure.bind(this);
    this.changeAttr = this.changeAttr.bind(this);
    this.changeWarning = this.changeWarning.bind(this);
    this.changeError = this.changeError.bind(this);
  }

  changeMeasure(value) {
    this.props.updateAlert({
      ...this.props.alert,
      metric: {
        ...this.props.alert.metric,
        measure: value,
      },
    });
  }

  changeAttr(attr, value) {
    this.props.updateAlert({
      ...this.props.alert,
      [attr]: value,
    });
  }

  changeWarning(value) {
    this.changeAttr('warning', value);
  }

  changeError(value) {
    this.changeAttr('error', value);
  }

  render() {
    const { warning, error } = this.props.alert;
    let { metric } = this.props.alert;
    let unit = '';
    let measurePicker;

    if (metric === null) {
      // Encourage the user to select a metric if they have not.
      const buttonClass = 'flat-button flat-button--primary';
      metric = {
        environment: <button className={buttonClass} onClick={this.props.showMetricPicker}>Select a metric...</button>,
        application: <button className={buttonClass} onClick={this.props.showMetricPicker}>Select a metric...</button>,
        metric_name: <button className={buttonClass} onClick={this.props.showMetricPicker}>Select a metric...</button>,
        measure: '',
        table: '',
      };
      measurePicker = <button className={buttonClass} onClick={this.props.showMetricPicker}>Select a metric...</button>;
    } else {
      measurePicker = <MeasurePicker table={metric.table} value={metric.measure} onChange={this.changeMeasure} />;
    }

    if (metric.measure !== '' && has.call(unitMap, metric.measure)) {
      unit = metric[unitMap[metric.measure]];
    }

    const warningInput = <AlertInput value={warning} unit={unit} onChange={this.changeWarning} />;
    const errorInput = <AlertInput value={error} unit={unit} onChange={this.changeError} />;

    return (
      <div className={`alert-settings ${this.props.hidden === true ? 'hidden' : ''}`}>
        <div className="alert-metric">
          <AlertSection label="Environment:" value={metric.environment} />

          <AlertSection label="Application:" value={metric.application} />

          <AlertSection label="Metric Name:" value={metric.metric_name} />

          <AlertSection label="Measure:" value={measurePicker} />

          <AlertSection label="Warning:" value={warningInput} />

          <AlertSection label="Error:" value={errorInput} />
        </div>
      </div>
    );
  }
}
