import React, { PureComponent } from 'react';
import ConfigButtons from './ConfigButtons';
import './AlertTable.css';

class AlertRow extends PureComponent {
  render() {
    const props = this.props;
    const idx = this.props.idx;
    let warningCount = '-';
    let errorCount = '-';
    let warningClass = '';
    let errorClass = '';

    if (props.data.warnings !== null) {
      warningCount = props.data.warnings.length;

      if (warningCount === 0) {
        warningClass = 'alert-row__col--ok';
      }
    }

    if (props.data.errors !== null) {
      errorCount = props.data.errors.length;

      if (errorCount === 0) {
        errorClass = 'alert-row__col--ok';
      }
    }

    return (
      <tr className="alert-row">
        <td className="alert-row__col alert-row__col--environment">
          {props.metric.environment}
        </td>

        <td className="alert-row__col alert-row__col--application">
          {props.metric.application}
        </td>

        <td className="alert-row__col alert-row__col--metric">
          {props.metric.metric_name}
        </td>

        <td className="alert-row__col alert-row__col--measure">
          {props.metric.measure}
        </td>

        <td className={`alert-row__col alert-row__col__warning ${warningClass}`}>
          <div className="alert-row__col-count">{warningCount}</div>
          <div className="alert-row__col-definition">(&gt;= {props.warning})</div>
        </td>

        <td className={`alert-row__col alert-row__col__error ${errorClass}`}>
          <div className="alert-row__col-count">{errorCount}</div>
          <div className="alert-row__col-definition">(&gt;= {props.error})</div>
        </td>

        <td className="alert-row__col alert-row__col--buttons">
          <ConfigButtons
            moveUp={() => props.moveUp(idx)}
            moveDown={() => props.moveDown(idx)}
            showRefresh={false}
            settings={() => props.settings(idx)}
            remove={() => props.remove(idx)}
          />
        </td>
      </tr>
    );
  }
}

export default class AlertTable extends PureComponent {
  render() {
    return (
      <table className="alert-table">
        <tbody>
          <tr className="alert-table__header-row">
            <th className="alert-header">Environment</th>
            <th className="alert-header">Application</th>
            <th className="alert-header">Metric</th>
            <th className="alert-header">Measure</th>
            <th className="alert-header">Warnings</th>
            <th className="alert-header">Errors</th>
            <th className="alert-header">&nbsp;</th>
            <th className="alert-header">&nbsp;</th>
            <th className="alert-header">&nbsp;</th>
            <th className="alert-header">&nbsp;</th>
          </tr>

          {this.props.alerts.map((alert, idx) => {
            const { environment, application, metric_name: metricName, measure } = alert.metric;
            const { warning, error } = alert;
            const key = `${environment}.${application}.${metricName}.${measure}.${warning}.${error}`;
            return (
              <AlertRow
                {...alert}
                key={key}
                idx={idx}
                moveUp={this.props.moveUp}
                moveDown={this.props.moveDown}
                settings={this.props.settings}
                remove={this.props.remove}
              />
            );
          })}
        </tbody>
      </table>
    );
  }
}
