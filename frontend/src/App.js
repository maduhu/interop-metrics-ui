import React, { Component } from 'react';
import request from 'superagent/lib/client';
import './App.css';
import { MetricsTree, buildEnvironmentTree } from './components/MetricsTree';

class App extends Component {
  constructor(props) {
    super(props);
    this.onLoadMetrics = this.onLoadMetrics.bind(this);
    this.toggleNode = this.toggleNode.bind(this);
    this.pickNode = this.pickNode.bind(this);

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

  render() {
    let body;

    if (this.state.loading) {
      body = <div className="loading-tree">Loading metrics...</div>;
    } else if (this.state.loadError !== null) {
      body = <div className="error">{this.state.loadError}</div>;
    } else {
      body = <MetricsTree nodes={this.state.metrics} toggleNode={this.toggleNode} pickNode={this.pickNode} />;
    }

    return (
      <div className="app">
        {body}
      </div>
    );
  }
}

export default App;
