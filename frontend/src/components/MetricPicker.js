import React, { Component, PureComponent } from 'react';
import Fuse from 'fuse.js';
import moment from 'moment';
import request from 'superagent/lib/client';
import LoadingCube from './LoadingCube';
import { has } from '../utils';
import './MetricPicker.css';

const METRICS_COLS = ['environment', 'application', 'metric_name', 'last_timestamp'];

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

    if (!has.call(environments, metric.environment)) {
      environments[envName] = {}; // eslint-disable-line no-param-reassign
    }

    const env = environments[envName];

    if (!has.call(env, appName)) {
      env[appName] = [];
    }

    metric.last_timestamp = moment(new Date(metric.last_timestamp));  // eslint-disable-line no-param-reassign
    env[appName].push(metric);

    return environments;
  }, {});
}

class MetricPickerFilters extends PureComponent {
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
        <select
          className="metric-picker__select" value={environment}
          onChange={e => this.props.onEnvironmentChange(e.target.value)}
        >
          {envOptions}
        </select>

        <select
          className="metric-picker__select" value={application} disabled={appDisabled}
          onChange={e => this.props.onApplicationChange(e.target.value)}
        >
          {appOptions}
        </select>

        <input
          className="metric-picker__input" type="text" value={filter} placeholder="Filter"
          onChange={e => this.props.onFilterChange(e.target.value)}
        />
      </div>
    );
  }
}

MetricPickerFilters.propTypes = {
  application: React.PropTypes.string,
  environment: React.PropTypes.string,
  filter: React.PropTypes.string,
  environments: React.PropTypes.arrayOf(React.PropTypes.string),
  applications: React.PropTypes.arrayOf(React.PropTypes.string),
  onApplicationChange: React.PropTypes.func,
  onEnvironmentChange: React.PropTypes.func,
  onFilterChange: React.PropTypes.func,
};

MetricPickerFilters.defaultProps = {
  application: '',
  environment: '',
  filter: '',
  environments: [],
  applications: [],
  onApplicationChange: () => {},
  onEnvironmentChange: () => {},
  onFilterChange: () => {},
};

class MetricPickerTable extends PureComponent {
  render() {
    let body;
    const sortChange = this.props.onSortChange;

    if (this.props.metricsLoading) {
      body = (
        <div className="metrics-loading-mask">
          <LoadingCube>Loading metrics...</LoadingCube>
        </div>
      );
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
      const sortCol = this.props.sortCol;
      const sortDir = this.props.sortDir;
      const rows = this.props.rows.map((row) => {
        const key = `${row.environment}.${row.application}.${row.metric_name}`;
        const addMetric = () => this.props.addMetric(row);
        let typeIcon;

        if (row.table === 'raw_timer_with_interval') {
          typeIcon = <span className="fa fa-hourglass-o" title="timer" />;
        } else if (row.table === 'raw_counter_with_interval') {
          typeIcon = <span className="fa fa-calculator" title="counter" />;
        }

        return (
          <tr key={key} className="metric-picker__tr">
            <td className="metric-picker__env-col">{row.environment}</td>
            <td className="metric-picker__app-col">{row.application}</td>
            <td className="metric-picker__metric-col">{row.metric_name}</td>
            <td className="metric-picker__timestamp-col">{row.last_timestamp.format('YYYY-MM-DD HH:mm')}</td>
            <td className="metric-picker__type-col">{typeIcon}</td>
            <td className="metric-picker__add-col">
              <button className="flat-button" onClick={addMetric}>
                <span className="fa fa-plus-square" />
              </button>
            </td>
          </tr>
        );
      });

      const headerCols = METRICS_COLS.map((label) => {
        let clsName = 'sort-icon ';

        if (sortCol === label) {
          clsName += sortDir === 'asc' ? 'fa fa-sort-asc' : 'fa fa-sort-desc';
        }

        return (
          <th key={label} className="metric-picker__th clickable" onClick={() => sortChange(label)}>
            <span>{label}</span>
            <span className={clsName}>&nbsp;</span>
          </th>
        );
      });

      body = (
        <table className="metric-picker__table">
          <tbody>
            <tr>
              {headerCols}

              <th className="metric-picker__th">type</th>

              <th className="metric-picker__th">{this.props.addColText}</th>
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

MetricPickerTable.defaultProps = {
  addColText: 'add',
};

export class MetricPicker extends Component {
  constructor(props) {
    super(props);
    this.onLoadMetrics = this.onLoadMetrics.bind(this);
    this.loadMetrics = this.loadMetrics.bind(this);
    this.onEnvironmentChange = this.onEnvironmentChange.bind(this);
    this.onApplicationChange = this.onApplicationChange.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
    this.onSortChange = this.onSortChange.bind(this);
    this.sortMetricsAsc = this.sortMetricsAsc.bind(this);
    this.sortMetricsDesc = this.sortMetricsDesc.bind(this);
    this.sortMetrics = this.sortMetrics.bind(this);

    const fuseOptions = {
      shouldSort: false,
      threshold: 0.45,
      location: 0,
      distance: 500,
      maxPatternLength: 64,
      minMatchCharLength: 1,
      keys: ['metric_name'],
    };

    this.state = {
      metrics: {},
      metricsLoading: true,
      metricsLoadError: null,
      environment: '',
      application: '',
      filter: '',
      fuse: new Fuse([], fuseOptions),
      sortCol: 'environment',
      sortDir: 'asc',
    };

    this.loadMetrics();
  }

  onLoadMetrics(error, response) {
    /**
     * Handles response from metrics api (/api/v1/metrics)
     */
    if (error !== null) {
      let errorMsg;

      if (response.body !== null && response.body.error) {
        errorMsg = response.body.error;
      } else {
        errorMsg = `${response.statusCode} - ${response.statusText}`;
      }

      this.setState(() => ({ metricsLoading: false, metricsLoadError: errorMsg }));
      return;
    }

    this.setState(() => ({
      metrics: collapseMetrics(response.body.data.metrics),
      metricsLoading: false,
      metricsLoadError: null,
    }));
  }

  onEnvironmentChange(environment) {
    this.setState(() => ({ environment, application: '' }));
  }

  onApplicationChange(application) {
    this.setState(() => ({ application }));
  }

  onFilterChange(filter) {
    this.setState(() => ({ filter }));
  }

  onSortChange(sortCol) {
    this.setState((state) => {
      let sortDir = 'asc';

      if (state.sortCol === sortCol) {
        sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      }

      return {
        sortCol,
        sortDir,
      };
    });
  }

  loadMetrics() {
    request.get('/api/v1/metrics')
      .set('Accept', 'application/json')
      .end(this.onLoadMetrics);
  }

  sortMetricsAsc(rows) {
    const sortCol = this.state.sortCol;

    rows.sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];

      if (valA < valB) {
        return -1;
      } else if (valA > valB) {
        return 1;
      }

      return 0;
    });
  }

  sortMetricsDesc(rows) {
    const sortCol = this.state.sortCol;

    rows.sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];

      if (valA < valB) {
        return 1;
      } else if (valA > valB) {
        return -1;
      }

      return 0;
    });
  }

  sortMetrics(rows) {
    if (this.state.sortDir === 'asc') {
      this.sortMetricsAsc(rows);
    } else {
      this.sortMetricsDesc(rows);
    }
  }

  render() {
    const metrics = this.state.metrics;
    const environment = this.state.environment;
    const application = this.state.application;
    const filter = this.state.filter;
    const environments = Object.keys(metrics);
    const fuse = this.state.fuse;
    let applications = [];
    let rows = [];
    let body;

    if (environment !== '') {
      applications = Object.keys(metrics[environment]);
    }

    if (environment !== '' && application !== '') {
      rows = metrics[environment][application];
    } else if (environment !== '') {
      rows = applications.reduce((r, app) => r.concat(metrics[environment][app]), []);
    } else {
      rows = environments.reduce((allRows, env) => (
        allRows.concat(Object.keys(metrics[env]).reduce((envRows, app) => envRows.concat(metrics[env][app]), []))
      ), []);
    }

    fuse.set(rows);

    if (filter !== '') {
      rows = fuse.search(filter);
    }

    this.sortMetrics(rows);

    if (this.props.metricsLimitReached) {
      body = (
        <div className={`metric-picker-mask ${this.props.hidden ? 'metric-picker--hidden' : ''}`}>
          <p className="metric-picker-message">
            Only 4 metrics may be plotted on a single chart.
          </p>
        </div>
      );
    } else {
      body = (
        <div className={`metric-picker ${this.props.hidden ? 'metric-picker--hidden' : ''}`}>
          <MetricPickerFilters
            environments={environments}
            environment={environment}
            onEnvironmentChange={this.onEnvironmentChange}
            applications={applications}
            application={application}
            onApplicationChange={this.onApplicationChange}
            filter={filter}
            onFilterChange={this.onFilterChange}
          />

          <MetricPickerTable
            metricsLoading={this.state.metricsLoading}
            metricsLoadError={this.state.metricsLoadError}
            rows={rows}
            sortCol={this.state.sortCol}
            sortDir={this.state.sortDir}
            addMetric={this.props.addMetric}
            addColText={this.props.addColText}
            onSortChange={this.onSortChange}
          />
        </div>
      );
    }

    return body;
  }
}

export default MetricPicker;
