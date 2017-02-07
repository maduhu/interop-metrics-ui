import React, { Component } from 'react';
import Fuse from 'fuse.js';
import './MetricPicker.css'

export function collapseMetrics(metrics) {
  /**
   * Takes a flat list of metrics that look like this:
   *  {environment: '', application: '', metric_name: '', table: ''}, ...
   *
   * And makes them look like this:
   *    environment_1
   *        application_1
   *          metrics (array)
   *        application_n
   *          metrics (array)
   *    environment_n
   *      ...
   */
  return metrics.reduce((environments, metric) => {
    const envName = metric.environment;
    const appName = metric.application;

    if (!environments.hasOwnProperty(metric.environment)) {
      environments[envName] = {};
    }

    const env = environments[envName];

    if (!env.hasOwnProperty(appName)) {
      env[appName] = [];
    }

    env[appName].push(metric);

    return environments;
  }, {});
}

class MetricPickerFilters extends Component {
  render() {
    const environment = this.props.environment;
    const environments = this.props.environments;
    const application = this.props.application;
    const applications = this.props.applications;
    const filter = this.props.filter;
    const envOptions = environments.map(env => <option key={env} value={env}>{env}</option>);
    const allEnv = <option key="" value="">All Environments</option>;
    envOptions.unshift(allEnv);
    const appOptions = applications.map(app => <option key={app} value={app}>{app}</option>);
    const allApp = <option key="" value="">All Applications</option>;
    appOptions.unshift(allApp);
    const appDisabled = appOptions.length < 2;

    return (
      <div className="metric-picker__filters">
        <select className="metric-picker__select" value={environment}
                onChange={(e) => this.props.onEnvironmentChange(e.target.value)}>
          {envOptions}
        </select>

        <select className="metric-picker__select" value={application} disabled={appDisabled}
                onChange={(e) => this.props.onApplicationChange(e.target.value)}>
          {appOptions}
        </select>

        <input className="metric-picker__input" type="text" value={filter} placeholder="Filter"
               onChange={(e) => this.props.onFilterChange(e.target.value)}/>
      </div>
    );
  }
}

MetricPickerFilters.propTypes = {
  application: React.PropTypes.string,
  environment: React.PropTypes.string,
  filter: React.PropTypes.string,
  environments: React.PropTypes.array,
  applications: React.PropTypes.array,
  onApplicationChange: React.PropTypes.func,
  onEnvironmentChange: React.PropTypes.func,
  onFilterChange: React.PropTypes.func,
};

class MetricPickerTable extends Component {
  render () {
    let body;

    if (this.props.metricsLoading) {
      body = <div className="picker-loading">Loading metrics...</div>;
    } else if (this.props.metricsLoadError) {
      body = (
        <div className="picker-error">
          <div className="picker-error__description">
            An error occurred while loading available metrics:
          </div>

          <div className="picker-error__message">
            {this.props.metricsLoadError}
          </div>

          <div className="picker-error__description">
            Try reloading the page. If the error persists contact support.
          </div>
        </div>
      );
    } else {
      const rows = this.props.rows.map((row) => {
        const key = `${row.environment}.${row.application}.${row.metric_name}`;
        const addMetric = () => this.props.addMetric(row);
        let typeIcon;

        if (row.table === 'raw_timer_with_interval') {
          typeIcon = <span className="fa fa-hourglass-o" title="timer"></span>
        } else if (row.table === 'raw_counter_with_interval') {
          typeIcon = <span className="fa fa-calculator" title="counter"></span>
        }

        return (
          <tr key={key} className="metric-picker__tr">
            <td className="metric-picker__env-col">{row.environment}</td>
            <td className="metric-picker__app-col">{row.application}</td>
            <td className="metric-picker__metric-col">{row.metric_name}</td>
            <td className="metric-picker__type-col">{typeIcon}</td>
            <td className="metric-picker__add-col">
              <button className="flat-button" onClick={addMetric}>
                <span className="fa fa-plus-square"></span>
              </button>
            </td>
          </tr>
        );
      });

      body = (
        <table className="metric-picker__table">
          <tbody>
          <tr>
            <th className="metric-picker__th">Environment</th>
            <th className="metric-picker__th">Application</th>
            <th className="metric-picker__th">Metric</th>
            <th className="metric-picker__th">Type</th>
            <th className="metric-picker__th">Add</th>
          </tr>

          {rows}
          </tbody>
        </table>
      );
    }

    return (
      <div className="metric-picker__metrics">
        {body}
      </div>
    );
  }
}

export class MetricPicker extends Component {
  constructor(props) {
    super(props);
    this.onEnvironmentChange = this.onEnvironmentChange.bind(this);
    this.onApplicationChange = this.onApplicationChange.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);

    const fuseOptions = {
      shouldSort: true,
      threshold: 0.45,
      location: 0,
      distance: 100,
      maxPatternLength: 64,
      minMatchCharLength: 1,
      keys: ['metric_name'],
    };

    this.state = {
      environment: '',
      application: '',
      filter: '',
      fuse: new Fuse([], fuseOptions)
    };
  }

  onEnvironmentChange(env) {
    this.setState({environment: env, application: ''});
  }

  onApplicationChange(app) {
    this.setState({application: app});
  }

  onFilterChange(filter) {
    this.setState({filter: filter});
  }

  render() {
    const metrics = this.props.metrics;
    const environment = this.state.environment;
    const application = this.state.application;
    const filter = this.state.filter;
    const environments = Object.keys(metrics);
    const fuse = this.state.fuse;
    let applications = [];
    let rows = [];

    if (environment !== '') {
      applications = Object.keys(metrics[environment]);
    }

    if (environment !== '' && application !== '') {
      rows = metrics[environment][application];
    } else if (environment !== '') {
      rows = applications.reduce((rows, app) => rows.concat(metrics[environment][app]), []);
    } else {
      rows = environments.reduce((rows, env) => {
        return rows.concat(Object.keys(metrics[env]).reduce((rows, app) => rows.concat(metrics[env][app]), []));
      }, []);
    }

    fuse.set(rows);

    if (filter !== '') {
      rows = fuse.search(filter);
    }

    return (
      <div className={`metric-picker ${this.props.hidden ? 'metric-picker--hidden' : ''}`}>
        <MetricPickerFilters environments={environments}
                             environment={environment}
                             onEnvironmentChange={this.onEnvironmentChange}
                             applications={applications}
                             application={application}
                             onApplicationChange={this.onApplicationChange}
                             filter={filter}
                             onFilterChange={this.onFilterChange} />

        <MetricPickerTable metricsLoading={this.props.metricsLoading}
                           metricsLoadError={this.props.metricsLoadError}
                           rows={rows}
                           addMetric={this.props.addMetric} />
      </div>
    );
  }
}

export default MetricPicker;
