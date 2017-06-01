import React, { Component } from 'react';
import Dialog from './Dialog';
import './NewDashboardDialog.css';

const ENTER = 13;

export default class NewDashboardDialog extends Component {
  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
    this.handleEnter = this.handleEnter.bind(this);

    this.state = {
      name: '',
      type: 'time_series',
    };
  }

  componentDidMount() {
    this.nameInput.focus();
  }

  save() {
    this.props.save(this.state.name, this.state.type);
  }

  handleEnter(e) {
    if (e.keyCode === ENTER) {
      this.save();
    }
  }

  render() {
    return (
      <Dialog showClose={false} okText="save" onOk={this.save} onClose={this.props.close}>
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
            ref={(input) => { this.nameInput = input; }}
            onChange={e => this.setState({ name: e.target.value })}
            onKeyDown={this.handleEnter}
          />

          <select value={this.state.type} onChange={e => this.setState({ type: e.target.value })}>
            <option value="time_series">Time Series</option>
            <option value="alert">Alert</option>
          </select>
        </div>
      </Dialog>
    );
  }
}
