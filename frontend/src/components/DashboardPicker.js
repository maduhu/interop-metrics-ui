import React, { PureComponent } from 'react';
import './DashboardPicker.css';

export default class DashboardPicker extends PureComponent {
  render() {
    return (
      <div className="dashboard-picker">
        <select
          className="dashboard-select"
          value={this.props.currentDashboard}
          onChange={e => this.props.selectDashboard(parseInt(e.target.value, 10))}
        >
          {this.props.dashboards.map((dashboard, idx) => (
            <option key={dashboard.name} value={idx}>{dashboard.name}</option>
          ))}
        </select>

        <button className="dashboard-button button button--clear" onClick={this.props.delete}>
          Delete Dashboard
        </button>

        <button className="dashboard-button button" onClick={this.props.add}>
          Add Dashboard
        </button>
      </div>
    );
  }
}
