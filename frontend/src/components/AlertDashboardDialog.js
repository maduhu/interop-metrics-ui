import React, { Component } from 'react';
import Dialog from './Dialog';

const RANGE_PERIODS = ['minutes', 'hours', 'days'];

export default class AlertDashboardDialog extends Component {
  constructor(props) {
    super(props);
    this.changeMultiplier = this.changeMultiplier.bind(this);
    this.changePeriod = this.changePeriod.bind(this);

    this.state = {
      rangePeriod: props.dashboard.rangePeriod,
      rangeMultiplier: props.dashboard.rangeMultiplier,
    };
  }

  changeMultiplier(e) {
    this.setState({ rangeMultiplier: e.target.value });
  }

  changePeriod(e) {
    this.setState({ rangePeriod: e.target.value });
  }

  render() {
    return (
      <Dialog onOk={() => this.props.save({ ...this.state })} onClose={this.props.close} okText="save">
        <div className="dialog__title">
          Dashboard Settings
        </div>

        <div className="dashboard-settings">
          <div className="input-wrapper">
            <label className="input-wrapper__label" htmlFor="multiplier">Range:</label>

            <input
              id="multiplier"
              className="input-wrapper__input"
              type="number"
              value={this.state.rangeMultiplier}
              onChange={this.changeMultiplier}
            />

            <select className="input-wrapper__input" value={this.state.rangePeriod} onChange={this.changePeriod}>
              {RANGE_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </Dialog>
    );
  }
}
