import React, { Component } from 'react';

export class Dialog extends Component {
  constructor(props) {
    super(props);
    this.onClose.bind(this);
  }

  onClose() {
    this.props.onClose();
  }

  render() {
    const size = this.props.size;

    return (
      <div className={`dialog ${size}`}>
        <div className="dialog__mask">
        </div>

        <div className="dialog__body">
          {this.props.children}
        </div>
      </div>
    );
  }
}

Dialog.propTypes = {
  size: React.PropTypes.string,
  showClose: React.PropTypes.bool,
};

Dialog.defaultProps = {
  size: '',
  showClose: true,
};

export default Dialog;
