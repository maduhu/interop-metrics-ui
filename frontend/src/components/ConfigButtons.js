import React, { PureComponent } from 'react';
import './ConfigButtons.css';

export default class ConfigButtons extends PureComponent {
  render() {
    const props = this.props;
    let moveUp;
    let moveDown;
    let refresh;
    let settings;
    let remove;

    if (props.showUp) {
      moveUp = (
        <button className="config-buttons__button button" onClick={this.props.moveUp}>
          <span className="fa fa-arrow-up" />
        </button>
      );
    }

    if (props.showDown) {
      moveDown = (
        <button className="config-buttons__button button" onClick={this.props.moveDown}>
          <span className="fa fa-arrow-down" />
        </button>
      );
    }

    if (props.showRefresh) {
      refresh = (
        <button className="config-buttons__button button" onClick={this.props.refresh}>
          <span className="fa fa-refresh" />
        </button>
      );
    }

    if (props.showSettings) {
      settings = (
        <button className="config-buttons__button button" onClick={this.props.settings}>
          <span className="fa fa-pencil" />
        </button>
      );
    }

    if (props.showRemove) {
      remove = (
        <button className="config-buttons__button button button--delete" onClick={this.props.remove}>
          <span className="fa fa-trash" />
        </button>
      );
    }

    return (
      <div className="config-buttons">
        {moveUp}

        {moveDown}

        {refresh}

        {settings}

        {remove}
      </div>
    );
  }
}

ConfigButtons.defaultProps = {
  showUp: true,
  showDown: true,
  showRefresh: true,
  showSettings: true,
  showRemove: true,
};
