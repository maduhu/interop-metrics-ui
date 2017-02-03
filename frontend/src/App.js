import React, { Component } from 'react';
import request from 'superagent/lib/client';
import './App.css';
import { MetricsTree, buildEnvironmentTree } from './components/MetricsTree';
import { MetricPicker } from './components/MetricPicker';

class App extends Component {
  constructor(props) {
    super(props);
    this.onLoadMetrics = this.onLoadMetrics.bind(this);
    this.toggleNode = this.toggleNode.bind(this);
    this.pickNode = this.pickNode.bind(this);
    this.onPickerChanged = this.onPickerChanged.bind(this);

    this.state = {
      metrics: [],
      loading: true,
      loadError: null,
    };

    request.get('/api/v1/metrics')
      .set('Accept', 'application/json')
      .end(this.onLoadMetrics);
  }

  onLoadMetrics(error, response) {
    if (error !== null) {
      let errorMsg;

      if (response.body !== null && response.body.error) {
        errorMsg = response.body.error;
      } else {
        errorMsg = `An error occurred while loading available metrics: ${response.statusCode} - ${response.statusText}`;
      }

      this.setState({
        loading: false,
        loadError: errorMsg,
      });

      return;
    }

    this.setState({
      pickerType: 'table',
      rawMetrics: response.body.data.metrics,
      metrics: buildEnvironmentTree(response.body.data.metrics),
      loading: false,
      loadError: null
    });
  }

  toggleNode(node) {
    node.collapsed = !node.collapsed;
    this.setState(this.state);
  }

  pickNode(node, measure) {

  }

  onPickerChanged(e) {
    this.setState({pickerType: e.target.value});
  }

  render() {
    let body;

    if (this.state.loading) {
      body = <div className="loading-tree">Loading metrics...</div>;
    } else if (this.state.loadError !== null) {
      body = <div className="error">{this.state.loadError}</div>;
    } else {
      let picker;

      if (this.state.pickerType === 'table') {
        picker = <MetricPicker metrics={this.state.rawMetrics} />;
      } else {
        picker = <MetricsTree nodes={this.state.metrics} toggleNode={this.toggleNode} pickNode={this.pickNode} />;
      }

      body = (
        <div className="picker">
          <div className="picker__choices">
            <input className="picker__radio" type="radio" value="table" id="_table" name="picker"
                   checked={this.state.pickerType === 'table'} onChange={this.onPickerChanged} />

            <label className="picker__label" htmlFor="_table">Table</label>

            <input className="picker__radio" type="radio" value="tree" id="_tree" name="picker"
                   checked={this.state.pickerType === 'tree'} onChange={this.onPickerChanged} />

            <label className="picker__label" htmlFor="_tree">Tree</label>
          </div>

          {picker}
        </div>
      );
    }

    return (
      <div className="app">
        {body}
      </div>
    );
  }
}

export default App;
