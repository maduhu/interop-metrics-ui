import React, { Component } from 'react';
import Dialog from './Dialog';
import './NewDashboardDialog.css';

const ENTER = 13;

export default class NewDashboardDialog extends Component {
  constructor(props) {
    super(props);
    this.handleEnter = this.handleEnter.bind(this);

    this.state = {
      name: '',
    };
  }

  componentDidMount() {
    this.nameInput.focus();
  }

  handleEnter(e) {
    if (e.keyCode === ENTER) {
      this.props.save(this.state.name);
    }
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
            ref={(input) => { this.nameInput = input; }}
            onChange={e => this.setState({ name: e.target.value })}
            onKeyDown={this.handleEnter}
          />
        </div>
      </Dialog>
    );
  }
}
