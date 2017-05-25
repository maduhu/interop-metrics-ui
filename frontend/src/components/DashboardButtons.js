import React, { PureComponent } from 'react';
import './DashboardButtons.css';

export default class DashboardButtons extends PureComponent {
  render() {
    return (
      <div className="dashboard-buttons">
        <button className="dashboard-buttons__button button button--clear" onClick={this.props.openClearDialog}>
          <span className="button__icon fa fa-trash">&nbsp;</span>
          <span className="button__text">Clear Dashboard</span>
        </button>

        <button className="dashboard-buttons__button button" onClick={this.props.addChart}>
          <span className="button__icon fa fa-line-chart">&nbsp;</span>
          <span className="button__text">Add Chart</span>
        </button>
      </div>
    );
  }
}
