import React, { Component } from 'react';
import './MetricsTree.css';

const measureMap = {
  'raw_timer_with_interval': ['count', 'mean', 'min', 'median', 'max', 'std_dev', 'p75', 'p95', 'p98', 'p99', 'p999',
    'mean_rate', 'one_min_rate', 'five_min_rate', 'fifteen_min_rate'],
  'raw_counter_with_interval': ['count'],
};

function nodeComparator(a, b) {
  if (a.text < b.text) {
    return -1;
  } else if (a.text > b.text) {
    return 1;
  }

  return 0;
}

function defaultNode(text) {
  return {text, nodes: {}, table: null, collapsed: true, environment: null, application: null, metric: null};
}

function buildApplicationTree(application, environmentName, metricName, table) {
  /**
   * Adds an environment hierarchy based on a metric_name. For example given three metric names:
   *    com.cacherules.transfers_fulfillment.fulfillment_time
   *    com.cacherules.transfers_fulfillment.fulfillment_count
   *    com.cacherules.users.login_time
   *
   * We would build the following tree:
   *    com
   *      cacherules
   *        transfers_fulfillment
   *          fulfillment_time
   *          fulfillment_count
   *        users
   *           login_time
   */
  const pieces = metricName.split('.');
  let subTree = application.nodes;

  pieces.forEach((piece, idx) => {
    const isLeaf = idx === pieces.length - 1;

    if (!subTree.hasOwnProperty(piece)) {
      subTree[piece] = defaultNode(piece);
    }

    if (isLeaf) {
      subTree[piece].table = table;
      subTree[piece].environment = environmentName;
      subTree[piece].application = application.text;
      subTree[piece].metric = metricName;
      subTree[piece].nodes = measureMap[table].reduce((measures, measure) => {
        measures[measure] = defaultNode(measure);
        return measures;
      }, {});
    }

    subTree = subTree[piece].nodes;
  });
}

function flattenTree(tree) {
  /**
   * flattenTree takes all nodes in the tree that only have one child and combines them, for example:
   *  com
   *    cacherules
   *      transfers_fulfillment
   *        fullfillment_time
   *        fulfillment_count
   *      users
   *        login_time
   *
   * Would get flattened to:
   *  com.cacherules
   *    transfers_fulfillment
   *      fulfillment_time
   *      fulfillment_count
   *    users.login_time
   */

  // TODO: implement

  return tree;
}

function listifyNodes(subTree) {
  /**
   * Transforms each node from buildApplicationTree to have a sorted array of nodes instead of an object.
   * The MetricsTree and related components expect an array instead of an object, and by front-loading this transform
   * we don't have to listify and sort on every render.
   */
  subTree.nodes = Object.values(subTree.nodes).sort(nodeComparator);
  subTree.nodes = subTree.nodes.map(listifyNodes);
  return subTree;
}

export function buildEnvironmentTree(metrics) {
  /**
   * Builds the environments tree to look like:
   *    environment
   *      application tree (see buildApplicationTree)
   */
  let tree = metrics.reduce((environmentTree, metric) => {
    if (!environmentTree.hasOwnProperty(metric.environment)) {
      environmentTree[metric.environment] = {text: metric.environment, nodes: {}, collapsed: true};
    }

    const environment = environmentTree[metric.environment];

    if (!environment.nodes.hasOwnProperty(metric.application)) {
      environment.nodes[metric.application] = {text: metric.application, nodes: {}, collapsed: true};
    }

    const application = environment.nodes[metric.application];

    buildApplicationTree(application, metric.environment, metric.metric_name, metric.table);

    return environmentTree;
  }, {});

  let sorted = Object.values(tree).sort(nodeComparator);

  sorted = sorted.map((environment) => {
    environment = listifyNodes(environment);
    environment = flattenTree(environment);
    return environment;
  });

  return sorted;
}

class TreeNodeList extends Component {
  render () {
    const nodes = this.props.nodes.map((node) => {
      return <TreeNode key={node.text} node={node}  toggleNode={this.props.toggleNode} pickNode={this.props.pickNode} />
    });

    return (
      <div className="tree-node-list">
        {nodes}
      </div>
    );
  }
}

TreeNodeList.propTypes = {
  nodes: React.PropTypes.array,
};

TreeNodeList.defaultProps = {
  nodes: [],
};

class TreeNode extends Component {
  render() {
    const node = this.props.node;
    let toggleIcon = null;
    let nodes = null;
    let infoClass = 'tree-node__info';

    if (node.hasOwnProperty('nodes') && node.nodes.length > 0) {
      infoClass += ' tree-node__info--expandable';
      toggleIcon = node.collapsed ? '+ ' : '- ';

      if (!node.collapsed) {
        nodes = <TreeNodeList nodes={node.nodes}  toggleNode={this.props.toggleNode} pickNode={this.props.pickNode} />;
      }
    }

    return (
      <div className="tree-node" >
        <div className={infoClass} onClick={() => this.props.toggleNode(node)}>
          <span className="tree-item__toggle">
            {toggleIcon}
          </span>

          <span className="tree-item__text">
            { node.text }
          </span>
        </div>

        {nodes}
      </div>
    );
  }
}

TreeNode.propTypes = {
  node: React.PropTypes.object,
};

TreeNode.defaultProps = {
  node: {
    collapsed: true,
    text: '',
    nodes: [],
  }
};

export class MetricsTree extends Component {
  render() {
    return (
      <div className="tree-view">
        <TreeNodeList nodes={this.props.nodes} toggleNode={this.props.toggleNode} pickNode={this.props.pickNode} />
      </div>
    );
  }
}

MetricsTree.propTypes = {
  nodes: React.PropTypes.array,
  toggleNode: React.PropTypes.func,
  pickNode: React.PropTypes.func,
};

MetricsTree.defaultProps = {
  nodes: [],
};

export default MetricsTree;
