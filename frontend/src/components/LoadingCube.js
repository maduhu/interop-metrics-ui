import React, { PureComponent } from 'react';
import './LoadingCube.css';

export class LoadingCube extends PureComponent {
  render() {
    return (
      <div className="loading-cube">
        <div className="sk-cube-grid">
          <div className="sk-cube sk-cube1" />
          <div className="sk-cube sk-cube2" />
          <div className="sk-cube sk-cube3" />
          <div className="sk-cube sk-cube4" />
          <div className="sk-cube sk-cube5" />
          <div className="sk-cube sk-cube6" />
          <div className="sk-cube sk-cube7" />
          <div className="sk-cube sk-cube8" />
          <div className="sk-cube sk-cube9" />
        </div>
        <div className="loading-cube__text">
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default LoadingCube;
