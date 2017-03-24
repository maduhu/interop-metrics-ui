import React, { Component } from 'react';
import request from 'superagent/lib/client';
import moment from 'moment';
import './App.css';
import { generateMetricsKey, generateMetricsUrl, has } from './utils';
import Dialog from './components/Dialog';
import { collapseMetrics } from './components/MetricPicker';
import ChartEditor from './components/ChartEditor';
import Chart from './components/Chart';

function newChart() {
  /**
   * Creates a new chart object.
   * Defaults chart range to the last 24 hours.
   * Defaults axes to linear scales.
   */
  const end = moment.utc();
  const start = end.clone().subtract(1, 'hours');

  return {
    title: '',
    rangeType: 'dynamic',
    rangePeriod: 'hours',
    rangeMultiplier: 1,
    startDate: start,
    endDate: end,
    selectionStartDate: null,
    selectionEndDate: null,
    // In the future we should also allow users to set axis domains.
    leftAxis: 'linear',
    rightAxis: 'linear',
    metrics: [],
    previewData: [],
    data: [],
  };
}

function newMetric(metric) {
  /**
   * Copies a metric and adds a measure and axis field. In the future we'll probably add more fields.
   */
  return { ...metric, measure: '', axis: 'left' };
}

class App extends Component {
  constructor(props) {
    super(props);
    this.onLoadMetrics = this.onLoadMetrics.bind(this);
    this.loadSavedCharts = this.loadSavedCharts.bind(this);
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
    this.saveDashboard = this.saveDashboard.bind(this);
    this.clearDashboard = this.clearDashboard.bind(this);

    this.state = {
      rawMetrics: [],
      metrics: {},
      metricsLoading: true,
      metricsLoadError: null,
      charts: this.loadSavedCharts(),
      targetChartIdx: null,
      targetChart: null,
      settingsOpen: false,
    };

    request.get('/api/v1/metrics')
      .set('Accept', 'application/json')
      .end(this.onLoadMetrics);
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

  loadSavedCharts() {
    const chartsStr = localStorage.getItem('charts');  // eslint-disable-line no-undef

    if (chartsStr === null) {
      return [newChart()];
    }

    return JSON.parse(chartsStr).map((savedChart, chartIdx) => {
      const chart = { ...savedChart }; // Make a copy so ESLint doesn't complain about modifying passed in objects.
      chart.previewData = [];
      chart.data = [];

      if (chart.rangeType === 'fixed') {
        chart.startDate = moment.utc(chart.startDate);
        chart.endDate = moment.utc(chart.endDate);
      } else {
        chart.endDate = moment.utc();
        chart.startDate = chart.endDate.clone().subtract(chart.rangeMultiplier, chart.rangePeriod);
      }

      chart.selectionStartDate = null;
      chart.selectionEndDate = null;

      chart.metrics.forEach((metric, metricIdx) => {
        const key = generateMetricsKey(metric);
        const dataObj = {
          name: key,
          axis: metric.axis,
          error: null,
          loading: true,
          rows: [],
        };
        chart.data.push({ ...dataObj });
        chart.previewData.push({ ...dataObj });
        this.loadData(chartIdx, metricIdx, metric, chart.startDate, chart.endDate, true);
      });

      return chart;
    });
  }

  addChart() {
    /**
     * Adds a new (empty) chart to the page.
     */
    this.setState(state => ({ charts: state.charts.concat([newChart()]) }));
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
      const charts = state.charts.slice(0, idx).concat(state.charts.slice(idx + 1));
      return { charts };
    });
  }

  selectionDataHandler(chartIdx, dataIdx, measure, error, response) {
    this.setState((state) => {
      let body = null;
      const oldChart = state.charts[chartIdx];
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
        charts: [...state.charts.slice(0, chartIdx), ...[chart], ...state.charts.slice(chartIdx + 1)],
      };
    });
  }

  previewDataHandler(chartIdx, dataIdx, measure, error, response) {
    this.setState((state) => {
      let body = null;
      const oldChart = state.charts[chartIdx];
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

      return {
        charts: [...state.charts.slice(0, chartIdx), ...[chart], ...state.charts.slice(chartIdx + 1)],
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
      const oldChart = state.charts[idx];
      const chart = {
        ...oldChart,
        data: oldChart.previewData,
        selectionStartDate: null,
        selectionEndDate: null,
      };

      return {
        charts: [...state.charts.slice(0, idx), ...[chart], ...state.charts.slice(idx + 1)],
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
        ...state.charts[idx],
        data: [],
        selectionStartDate: selection[0],
        selectionEndDate: selection[1],
      };

      chart.metrics.forEach((m, mIdx) => {
        chart.data.push({
          name: generateMetricsKey(m),
          axis: m.axis,
          loading: true,
          error: null,
          rows: [],
        });

        this.loadData(idx, mIdx, m, selection[0], selection[1], false);
      });

      return {
        charts: [...state.charts.slice(0, idx), ...[chart], ...state.charts.slice(idx + 1)],
      };
    });
  }

  saveChart() {
    /**
     * Replaces the chart at targetChartIdx with targetChart and closes the settings panel.
     */
    this.setState((state) => {
      const idx = state.targetChartIdx;
      const oldChart = state.charts[idx];
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
      const currentPreviewData = (!datesEqual || !timesEqual || rangeTypesEqual) ? [] : chart.previewData;
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
          const dataObj = {
            name: key,
            axis: metric.axis,
            error: null,
            loading: true,
            rows: [],
          };
          data.push({ ...dataObj });
          previewData.push({ ...dataObj });
          this.loadData(idx, mIdx, metric, chart.startDate.toDate(), chart.endDate.toDate(), true);
        }
      });

      chart.data = data;
      chart.previewData = previewData;

      return {
        charts: [...state.charts.slice(0, idx), ...[chart], ...state.charts.slice(idx + 1)],
        targetChartIdx: null,
        targetChart: null,
        settingsOpen: false,
      };
    });
  }

  addMetric(metric) {
    /**
     * Adds a metric to the targetChart metrics object.
     */
    const metrics = this.state.targetChart.metrics.concat([newMetric(metric)]);
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
    this.setState(state => ({
      targetChartIdx: idx,
      targetChart: { ...state.charts[idx], metrics: [...state.charts[idx].metrics] },
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
      const chart = state.charts[idx];
      const copy = {
        ...chart,
        selectionStartDate: null,
        selectionEndDate: null,
        previewData: [],
        data: [],
      };

      if (copy.rangeType === 'dynamic') {
        // Update start and end dates when using dynamic ranges.
        copy.endDate = moment.utc();
        copy.startDate = copy.endDate.clone().subtract(copy.rangeMultiplier, copy.rangePeriod);
      }

      // reset all data to loading state
      copy.metrics.forEach((metric, metricIdx) => {
        const dataObj = {
          name: generateMetricsKey(metric),
          axis: metric.axis,
          error: null,
          loading: true,
          rows: [],
        };
        copy.previewData.push({ ...dataObj });
        copy.data.push({ ...dataObj });
        this.loadData(idx, metricIdx, metric, copy.startDate.toDate(), copy.endDate.toDate(), true);
      });

      return {
        charts: [...state.charts.slice(0, idx), ...[copy], ...state.charts.slice(idx + 1)],
      };
    });
  }

  saveDashboard() {
    /**
     * Saves all of the current charts to HTML5 local storage so we can load them on page refresh.
     */
    const toSave = this.state.charts.map((c) => {
      const copy = {
        ...c,
        metrics: [...c.metrics],
      };

      delete copy.selectionStartDate;
      delete copy.selectionEndDate;
      delete copy.previewData;
      delete copy.data;

      // Convert moment objects to ISO strings.
      copy.startDate = copy.startDate.format();
      copy.endDate = copy.endDate.format();

      return copy;
    });

    localStorage.setItem('charts', JSON.stringify(toSave));  // eslint-disable-line no-undef
  }

  clearDashboard() {
    /**
     * Clears all charts from localStorage and resets charts object.
     */
    localStorage.removeItem('charts');  // eslint-disable-line no-undef
    this.setState(() => ({ charts: [newChart()] }));
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
    }

    const charts = this.state.charts.map((chart, idx) => (
      <Chart
        key={idx} // eslint-disable-line react/no-array-index-key
        idx={idx}
        chart={chart}
        openSettings={this.openSettings}
        removeChart={this.removeChart}
        refreshChart={this.refreshChart}
        onSelection={this.loadSelectionData}
      />
    ));

    return (
      <div className="app">
        <div className="app-buttons">
          <button className="app-buttons__button button" onClick={this.saveDashboard}>
            <span className="button__icon fa fa-save">&nbsp;</span>
            <span className="button__text">Save Dashboard</span>
          </button>

          <button className="app-buttons__button button" onClick={this.clearDashboard}>
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
