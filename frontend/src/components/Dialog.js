import React, { Component } from 'react';
import './Dialog.css';

const ESC = 27;

export class Dialog extends Component {
  constructor(props) {
    super(props);
    this.handleEsc = this.handleEsc.bind(this);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleEsc);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleEsc);
  }

  handleEsc(e) {
    if (e.keyCode === ESC) {
      this.props.onClose();
    }
  }

  render() {
    const size = this.props.size;
    const cancelText = this.props.cancelText;
    const okText = this.props.okText;
    const okEnabled = this.props.okEnabled;
    const onOk = () => this.props.onOk();
    const onClose = () => this.props.onClose();
    let closeBtn;
    let okBtn;
    let cancelBtn;

    if (this.props.showClose) {
      closeBtn = <button className="button dialog__close" onClick={onClose}>X</button>;
    }

    if (this.props.showOk) {
      okBtn = <button className="dialog__button button" disabled={!okEnabled} onClick={onOk}>{okText}</button>;
    }

    if (this.props.showCancel) {
      cancelBtn = (
        <button className="dialog__button flat-button flat-button--secondary" onClick={onClose}>
          {cancelText}
        </button>
      );
    }

    return (
      <div className="dialog">
        <div className="dialog__mask" onClick={onClose} />

        <div className={`dialog__body dialog__body--${size}`}>
          {closeBtn}

          {this.props.children}

          <div className="dialog__buttons group">
            {okBtn}
            {cancelBtn}
          </div>
        </div>
      </div>
    );
  }
}

Dialog.propTypes = {
  size: React.PropTypes.string,
  cancelText: React.PropTypes.string,
  okText: React.PropTypes.string,
  showClose: React.PropTypes.bool,
  showOk: React.PropTypes.bool,
  okEnabled: React.PropTypes.bool,
  showCancel: React.PropTypes.bool,
  onOk: React.PropTypes.func.isRequired,
  onClose: React.PropTypes.func.isRequired,
};

Dialog.defaultProps = {
  size: '',
  cancelText: 'cancel',
  okText: 'ok',
  showClose: false,
  showCancel: true,
  showOk: true,
  okEnabled: true,
};

export default Dialog;
