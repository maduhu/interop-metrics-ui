import React, { Component } from 'react';
import request from 'superagent/lib/client';
import moment from 'moment';
import './App.css';
import {
  generateMetricsKey,
  generateMetricsUrl,
  has,
  createChart,
  createMetric,
  copyDashboard,
  loadDashboards,
  createDataObject,
} from './utils';
import Dialog from './components/Dialog';
import { collapseMetrics } from './components/MetricPicker';
import ChartEditor from './components/ChartEditor';
import Chart from './components/Chart';



class App extends Component {
  constructor(props) {
    super(props);
    this.onLoadMetrics = this.onLoadMetrics.bind(this);
    this.loadMetrics = this.loadMetrics.bind(this);
    this.addChart = this.addChart.bind(this);
    this.updateTargetChart = this.updateTargetChart.bind(this);
    this.removeChart = this.removeChart.bind(this);
    this.selectionDataHandler = this.selectionDataHandler.bind(this);
    this.previewDataHandler = this.previewDataHandler.bind(this);
    this.loadData = this.loadData.bind(this);
    this.clearSelection = this.clearSelection.bind(this);
    this.loadSelectionData = this.loadSelectionData.bind(this);
    this.saveChart = this.saveChart.bind(this);
    this.addMetric = this.addMetric.bind(this);
    this.updateMetric = this.updateMetric.bind(this);
    this.removeMetric = this.removeMetric.bind(this);
    this.openSettings = this.openSettings.bind(this);
    this.closeSettings = this.closeSettings.bind(this);
    this.refreshChart = this.refreshChart.bind(this);
    this.startRefreshLoop = this.startRefreshLoop.bind(this);
    this.refreshLoop = this.refreshLoop.bind(this);
    this.moveUp = this.moveUp.bind(this);
    this.moveDown = this.moveDown.bind(this);
    this.saveState = this.saveState.bind(this);
    this.clearDashboard = this.clearDashboard.bind(this);
    this.openClearDialog = this.openClearDialog.bind(this);
    this.closeClearDialog = this.closeClearDialog.bind(this);

    const dashboards = loadDashboards();
    const currentDashboard = copyDashboard(dashboards[0]);

    currentDashboard.charts.forEach((chart, chartIdx) => {
      /* eslint-disable no-param-reassign */
      chart.initialLoad = true;
      chart.previewData = [];
      chart.data = [];
      chart.metrics.forEach((metric, metricIdx) => {
        const dataObj = createDataObject(metric);
        chart.data.push({ ...dataObj });
        chart.previewData.push({ ...dataObj });
        this.loadData(chartIdx, metricIdx, metric, chart.startDate, chart.endDate, true);
      });
      /* eslint-enable */
    });

    this.state = {
      dashboards,
      currentDashboard,
      currentDashboardIdx: 0,
      rawMetrics: [],
      metrics: {},
      metricsLoading: true,
      metricsLoadError: null,
      targetChartIdx: null,
      targetChart: null,
      settingsOpen: false,
      clearDialogOpen: false,
    };

    this.startRefreshLoop();
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
      rawMetrics: response.body.data.metrics,
      metrics: collapseMetrics(response.body.data.metrics),
      metricsLoading: false,
      metricsLoadError: null,
    }));
  }

  loadMetrics() {
    this.setState({ metricsLoading: true });

    request.get('/api/v1/metrics')
      .set('Accept', 'application/json')
      .end(this.onLoadMetrics);
  }



    });
  }

  addChart() {
    /**
     * Adds a new (empty) chart to the page.
     */
    this.setState(state => ({
      currentDashboard: {
        ...state.currentDashboard,
        charts: state.currentDashboard.charts.concat([createChart()]),
      },
    }), this.saveState);
  }

  updateTargetChart(attr, value) {
    /**
     * Immutably updates a chart attribute with a given value. If modifying an attribute that is nested be sure to do a
     * proper copy of it yourself.
     */
    this.setState(state => ({
      targetChart: {
        ...state.targetChart,
        [attr]: value,
      },
    }));
  }

  removeChart(idx) {
    /**
     * Remove the chart at idx.
     */
    this.setState((state) => {
      const charts = state.currentDashboard.charts.slice(0, idx).concat(state.currentDashboard.charts.slice(idx + 1));
      return {
        currentDashboard: {
          ...state.currentDashboard,
          charts,
        },
      };
    }, this.saveState);
  }

  selectionDataHandler(chartIdx, dataIdx, measure, error, response) {
    this.setState((state) => {
      let body = null;
      const oldChart = state.currentDashboard.charts[chartIdx];
      const chart = { ...oldChart };
      const data = { ...oldChart.data[dataIdx] };

      if (data === undefined || data.name !== generateMetricsKey(measure)) {
        // Don't update, the user managed to change the metrics on the chart before the response came back.
        return {};
      }

      data.loading = false;

      if (response !== undefined) {
        body = response.body;
      }

      if (error !== null) {
        let msg = 'Unexpected error returned from server';

        if (body !== null && has.call(body, 'error') && body.error !== null) {
          msg = body.error;
        }

        data.rows = [];
        data.error = msg; // TODO: render this error somewhere.
      } else {
        data.error = null;
        data.rows = response.body.data.rows.map(r => [new Date(r[0]), r[1]]);
        chart.data = [
          ...chart.data.slice(0, dataIdx),
          ...[data],
          ...chart.data.slice(dataIdx + 1),
        ];
      }

      return {
        currentDashboard: {
          ...state.currentDashboard,
          charts: [
            ...state.currentDashboard.charts.slice(0, chartIdx),
            chart,
            ...state.currentDashboard.charts.slice(chartIdx + 1),
          ],
        },
      };
    });
  }

  previewDataHandler(chartIdx, dataIdx, measure, error, response) {
    this.setState((state) => {
      let body = null;
      const oldChart = state.currentDashboard.charts[chartIdx];
      const chart = { ...oldChart };
      const data = { ...oldChart.data[dataIdx] };
      const previewData = { ...oldChart.previewData[dataIdx] };

      if (data === undefined || data.name !== generateMetricsKey(measure)) {
        // Don't update, the user managed to change the metrics on the chart before the response came back.
        return {};
      }

      data.loading = false;
      previewData.loading = false;

      if (response !== undefined) {
        body = response.body;
      }

      if (error !== null) {
        let msg = 'Unexpected error returned from server';

        if (body !== null && has.call(body, 'error') && body.error !== null) {
          msg = body.error;
        }

        data.rows = [];
        previewData.rows = [];
        data.error = msg; // TODO: render this error somewhere.
        previewData.error = msg; // TODO: render this error somewhere.
      } else {
        const rows = response.body.data.rows.map(r => [new Date(r[0]), r[1]]);
        data.error = null;
        previewData.error = null;
        data.rows = rows;
        previewData.rows = rows;

        chart.data = [
          ...chart.data.slice(0, dataIdx),
          ...[data],
          ...chart.data.slice(dataIdx + 1),
        ];

        chart.previewData = [
          ...chart.previewData.slice(0, dataIdx),
          ...[previewData],
          ...chart.previewData.slice(dataIdx + 1),
        ];
      }

      if (!chart.data.some(d => d.loading)) {
        chart.initialLoad = false;
      }

      return {
        currentDashboard: {
          ...state.currentDashboard,
          charts: [
            ...state.currentDashboard.charts.slice(0, chartIdx),
            chart,
            ...state.currentDashboard.charts.slice(chartIdx + 1),
          ],
        },
      };
    });
  }

  loadData(chartIdx, dataIdx, measure, start, end, all) {
    const url = generateMetricsUrl(measure);
    const handler = all ? this.previewDataHandler : this.selectionDataHandler;
    const cb = (error, response) => handler(chartIdx, dataIdx, measure, error, response);
    // Set request size to window width - 144 (we have 64 pixels of padding on the window and 80 pixels on SVG)
    const desiredRows = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) - 144;

    request.get(url)
      .query({ columns: measure.measure })
      .query({ start_timestamp: start.toISOString() })
      .query({ end_timestamp: end.toISOString() })
      .query({ size: desiredRows })
      .set('Accept', 'application/json')
      .end(cb);
  }

  clearSelection(idx) {
    this.setState((state) => {
      const oldChart = state.currentDashboard.charts[idx];
      const chart = {
        ...oldChart,
        data: oldChart.previewData,
        selectionStartDate: null,
        selectionEndDate: null,
      };

      return {
        currentDashboard: {
          ...state.currentDashboard,
          charts: [
            ...state.currentDashboard.charts.slice(0, idx),
            chart,
            ...state.currentDashboard.charts.slice(idx + 1),
          ],
        },
      };
    });
  }

  loadSelectionData(idx, selection) {
    if (selection === null) {
      this.clearSelection(idx);
      return;
    }

    this.setState((state) => {
      const chart = {
        ...state.currentDashboard.charts[idx],
        data: [],
        selectionStartDate: selection[0],
        selectionEndDate: selection[1],
      };

      chart.metrics.forEach((metric, mIdx) => {
        chart.data.push(createDataObject(metric));

        this.loadData(idx, mIdx, metric, selection[0], selection[1], false);
      });

      return {
        currentDashboard: {
          ...state.currentDashboard,
          charts: [
            ...state.currentDashboard.charts.slice(0, idx),
            chart,
            ...state.currentDashboard.charts.slice(idx + 1),
          ],
        },
      };
    });
  }

  saveChart() {
    /**
     * Replaces the chart at targetChartIdx with targetChart and closes the settings panel.
     */
    this.setState((state) => {
      const idx = state.targetChartIdx;
      const oldChart = state.currentDashboard.charts[idx];
      const chart = {
        ...state.targetChart,
        // Note: here we clear selection on save, not sure this behavior is the best.
        selectionStartDate: null,
        selectionEndDate: null,
        data: [...state.targetChart.previewData], // Copy preview data over because we're resetting selection.
        previewData: [...state.targetChart.previewData],
      };

      const rangeType = chart.rangeType;
      const rangeTypesEqual = rangeType === oldChart.rangeType;
      const periodsEqual = chart.rangePeriod === oldChart.rangePeriod;
      const multipliersEqual = chart.rangeMultiplier === oldChart.rangeMultiplier;
      const dynamicRangeChanged = rangeType === 'dynamic' && (!periodsEqual || !multipliersEqual);

      if (rangeType === 'dynamic' && (!rangeTypesEqual || dynamicRangeChanged)) {
        chart.endDate = moment.utc();
        chart.startDate = chart.endDate.clone().subtract(chart.rangeMultiplier, chart.rangePeriod);
      }

      const datesEqual = chart.startDate === oldChart.startDate && chart.endDate === oldChart.endDate;
      const timesEqual = chart.startTime === oldChart.startTime && chart.endTime === oldChart.endTime;

      // If we've changed the date or time range of the chart we need all new data
      const currentPreviewData = (!datesEqual || !timesEqual || !rangeTypesEqual) ? [] : chart.previewData;
      const data = [];
      const previewData = [];

      chart.metrics.forEach((metric, mIdx) => {
        const key = generateMetricsKey(metric);
        const metricPreviewData = currentPreviewData.find(d => d.name === key);

        if (metricPreviewData) {
          metricPreviewData.axis = metric.axis; // just in case the user changed the axis.
          data.push(metricPreviewData);
          previewData.push(metricPreviewData);

          if (metricPreviewData.error !== null) {
            // Try requesting metrics that had errors last time.
            this.loadData(idx, mIdx, metric, chart.startDate.toDate(), chart.endDate.toDate(), true);
          }
        } else {
          chart.initialLoad = true;
          const dataObj = createDataObject(metric);
          data.push({ ...dataObj });
          previewData.push({ ...dataObj });
          this.loadData(idx, mIdx, metric, chart.startDate.toDate(), chart.endDate.toDate(), true);
        }
      });

      chart.data = data;
      chart.previewData = previewData;

      return {
        currentDashboard: {
          ...state.currentDashboard,
          charts: [
            ...state.currentDashboard.charts.slice(0, idx),
            chart,
            ...state.currentDashboard.charts.slice(idx + 1)],
        },
        targetChartIdx: null,
        targetChart: null,
        settingsOpen: false,
      };
    }, this.saveState);
  }

  addMetric(metric) {
    /**
     * Adds a metric to the targetChart metrics object.
     */
    const metrics = this.state.targetChart.metrics.concat([createMetric(metric)]);
    this.updateTargetChart('metrics', metrics);
  }

  updateMetric(idx, attr, value) {
    /**
     * Updates a metric.
     * idx: index of the metric on targetChart to update
     * attr: attribute to update
     * value: value we want the attribute to have.
     */
    this.setState((state) => {
      const updatedMetric = { ...state.targetChart.metrics[idx], [attr]: value };
      const oldChart = state.targetChart;
      const targetChart = {
        ...oldChart,
        metrics: [...oldChart.metrics.slice(0, idx), updatedMetric, ...oldChart.metrics.slice(idx + 1)],
      };

      return { targetChart };
    });
  }

  removeMetric(idx) {
    /**
     * Removes the metric from targetChart at the given index.
     */
    this.setState(state => ({
      targetChart: {
        ...state.targetChart,
        metrics: [...state.targetChart.metrics.slice(0, idx), ...state.targetChart.metrics.slice(idx + 1)],
      },
    }));
  }

  openSettings(idx) {
    /**
     * Opens the settings panel for the chart at the given index.
     */
    this.loadMetrics();
    this.setState(state => ({
      targetChartIdx: idx,
      targetChart: { ...state.currentDashboard.charts[idx], metrics: [...state.currentDashboard.charts[idx].metrics] },
      settingsOpen: true,
    }));
  }

  closeSettings() {
    /**
     * Closes the settings panel and does not save the changes made.
     */
    this.setState(() => ({ targetChartIdx: null, targetChart: null, settingsOpen: false }));
  }

  refreshChart(idx) {
    this.setState((state) => {
      const oldChart = state.currentDashboard.charts[idx];
      const chart = {
        ...oldChart,
        selectionStartDate: null,
        selectionEndDate: null,
        previewData: [],
        data: [],
      };

      if (chart.rangeType === 'dynamic') {
        // Update start and end dates when using dynamic ranges.
        chart.endDate = moment.utc();
        chart.startDate = chart.endDate.clone().subtract(chart.rangeMultiplier, chart.rangePeriod);
      }

      // reset all data to loading state
      chart.metrics.forEach((metric, metricIdx) => {
        const dataObj = createDataObject(metric);
        chart.previewData.push({ ...dataObj });
        chart.data.push({ ...dataObj });
        this.loadData(idx, metricIdx, metric, chart.startDate.toDate(), chart.endDate.toDate(), true);
      });

      return {
        currentDashboard: {
          ...state.currentDashboard,
          charts: [
            ...state.currentDashboard.charts.slice(0, idx),
            chart,
            ...state.currentDashboard.charts.slice(idx + 1),
          ],
        },
      };
    });
  }

  startRefreshLoop() {
    window.setInterval(this.refreshLoop, 60 * 1000);
  }

  refreshLoop() {
    /**
     * This method gets called on an interval to update all dynamic charts that may be getting new data. We need to be
     * careful about which charts are able to be refreshed though, so we only refresh if the user has not made a
     * selection in the preview area, and only if it's not already loading data, that way we don't continuously queue
     * up data refreshes if the server is slow to respond.
     */
    this.state.currentDashboard.charts.forEach((chart, idx) => {
      const hasSelection = chart.selectionStartDate !== null && chart.selectionEndDate !== null;
      const previewLoading = chart.previewData.some(d => d.loading);
      const dataLoading = chart.data.some(d => d.loading);

      if (chart.rangeType === 'dynamic' && !hasSelection && !previewLoading && !dataLoading) {
        this.refreshChart(idx);
      }
    });
  }

  moveUp(idx) {
    this.setState((state) => {
      if (idx === 0) {
        // Do nothing if we try to move the top chart up.
        return {};
      }

      const charts = [...state.currentDashboard.charts];
      const chartToMove = charts[idx];
      charts[idx] = charts[idx - 1];
      charts[idx - 1] = chartToMove;

      return {
        currentDashboard: {
          ...state.currentDashboard,
          charts,
        },
      };
    }, this.saveState);
  }

  moveDown(idx) {
    this.setState((state) => {
      if (idx === state.currentDashboard.charts.length - 1) {
        // Do nothing if we try to move the bottom chart down.
        return {};
      }

      const charts = [...state.currentDashboard.charts];
      const chartToMove = charts[idx];
      charts[idx] = charts[idx + 1];
      charts[idx + 1] = chartToMove;

      return {
        currentDashboard: {
          ...state.currentDashboard,
          charts,
        },
      };
    }, this.saveState);
  }

  saveState() {
    /**
     * Saves all of the current dashboards to HTML local storage.
     */
    const dashboards = [
      ...this.state.dashboards.slice(0, this.state.currentDashboardIdx),
      copyDashboard(this.state.currentDashboard),
      ...this.state.dashboards.slice(this.state.currentDashboardIdx + 1),
    ];

    localStorage.setItem('dashboards', JSON.stringify(dashboards));
  }

  clearDashboard() {
    /**
     * Clears all charts from localStorage and resets charts object.
     */
    // TODO: fix to handle multiple dashboards.
    localStorage.removeItem('charts');  // eslint-disable-line no-undef
    this.setState(() => ({ charts: [createChart()], clearDialogOpen: false }));
  }

  openClearDialog() {
    this.setState(() => ({ clearDialogOpen: true }));
  }

  closeClearDialog() {
    this.setState(() => ({ clearDialogOpen: false }));
  }

  render() {
    let dialog;

    if (this.state.settingsOpen) {
      dialog = (
        <Dialog showClose={false} okText="save" onOk={this.saveChart} onClose={this.closeSettings} size="xl">
          <ChartEditor
            metrics={this.state.metrics}
            metricsLoading={this.state.metricsLoading}
            metricsLoadError={this.state.metricsLoadError}
            chart={this.state.targetChart}
            addMetric={this.addMetric}
            removeMetric={this.removeMetric}
            updateMetric={this.updateMetric}
            updateTargetChart={this.updateTargetChart}
          />
        </Dialog>
      );
    } else if (this.state.clearDialogOpen) {
      dialog = (
        <Dialog showClose={false} okText="yes" onOk={this.clearDashboard} onClose={this.closeClearDialog}>
          <p className="confirm-dialog">Are you sure you want to remove all charts in your dashboard?</p>
        </Dialog>
      );
    }

    const charts = this.state.currentDashboard.charts.map((chart, idx) => (
      <Chart
        key={idx} // eslint-disable-line react/no-array-index-key
        idx={idx}
        chart={chart}
        openSettings={this.openSettings}
        removeChart={this.removeChart}
        refreshChart={this.refreshChart}
        moveUp={this.moveUp}
        moveDown={this.moveDown}
        onSelection={this.loadSelectionData}
      />
    ));

    return (
      <div className="app">
        <div className="app-buttons">
          <button className="app-buttons__button button button--clear" onClick={this.openClearDialog}>
            <span className="button__icon fa fa-trash">&nbsp;</span>
            <span className="button__text">Clear Dashboard</span>
          </button>

          <button className="app-buttons__button button" onClick={this.addChart}>
            <span className="button__icon fa fa-line-chart">&nbsp;</span>
            <span className="button__text">New Chart</span>
          </button>
        </div>

        {dialog}

        {charts}
      </div>
    );
  }
}

export default App;
