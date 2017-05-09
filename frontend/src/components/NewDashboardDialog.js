import React, { Component } from 'react';
import Dialog from './Dialog';
import './NewDashboardDialog.css';

export default class NewDashboardDialog extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
    };
  }

  render() {
    return (
      <Dialog showClose={false} okText="save" onOk={() => this.props.save(this.state.name)} onClose={this.props.close}>
        <div className="new-dashboard-form">
          <h3 className="dialog__title">
            Add Dashboard
          </h3>

          <label className="new-dashboard-form__label" htmlFor="new-dashboard">
            Name:
          </label>

          <input
            id="new-dashboard"
            className="new-dashboard-form__input"
            type="text"
            value={this.state.name}
            onChange={e => this.setState({ name: e.target.value })}
          />
        </div>
      </Dialog>
    );
  }
}
