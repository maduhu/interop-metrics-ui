import moment from 'moment';

export function generateMetricsKey(m) {
  return `${m.environment}.${m.application}.${m.metric_name}.${m.measure}`;
}

export function generateMetricsUrl(m) {
  return `api/v1/environments/${m.environment}/applications/${m.application}/metrics/${m.table}/${m.metric_name}`;
}

export function createChart() {
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
    initialLoad: false,
    previewData: [],
    data: [],
  };
}

export function createMetric(metric) {
  /**
   * Copies a metric and adds a measure and axis field. In the future we'll probably add more fields.
   */
  return { ...metric, measure: '', axis: 'left' };
}

export function createDashboard(name) {
  return {
    name,
    version: '1.0',
    charts: [createChart()],
  };
}

function transformChart(chart) {
  /**
   * Transforms serialized charts to the format needed for our App.
   *
   * Adds null value selection start/end dates
   * Converts dates to Moment objects
   * Calculates dynamic time ranges.
   */

  const transformed = {
    ...chart,
    selectionStartDate: null,
    selectionEndDate: null,
  };

  if (chart.rangeType === 'fixed') {
    transformed.startDate = moment.utc(transformed.startDate);
    transformed.endDate = moment.utc(transformed.endDate);
  } else {
    transformed.endDate = moment.utc();
    transformed.startDate = transformed.endDate.clone().subtract(transformed.rangeMultiplier, transformed.rangePeriod);
  }

  return transformed;
}

function loadCharts() {
  const chartsStr = localStorage.getItem('charts');

  if (chartsStr === null) {
    return [];
  }

  localStorage.removeItem('charts'); // Remove legacy data

  return JSON.parse(chartsStr).map(transformChart);
}

export function loadDashboards() {
  /**
   * Loads the saved dashboards from HTML localStorage.
   */
  const dashboardsStr = localStorage.getItem('dashboards');
  let dashboards;

  if (dashboardsStr === null) {
    dashboards = [createDashboard('Default')];
    dashboards[0].charts = loadCharts(); // try to load stored charts from the old format.
  } else {
    dashboards = JSON.parse(dashboardsStr).map((dashboard) => {
      dashboard.charts = dashboard.charts.map(transformChart); // eslint-disable-line no-param-reassign

      return dashboard;
    });
  }

  return dashboards;
}

export function copyChart(chart) {
  return {
    ...chart,
    startDate: chart.startDate !== null ? chart.startDate.clone() : null,
    endDate: chart.endDate !== null ? chart.endDate.clone() : null,
    metrics: chart.metrics.map(m => ({ ...m })),
    previewData: [],
    data: [],
    selectionStartDate: null,
    selectionEndDate: null,
  };
}

export function copyDashboard(dashboard) {
  return {
    ...dashboard,
    charts: dashboard.charts.map(copyChart),
  };
}

export function createDataObject(metric) {
  return {
    name: generateMetricsKey(metric),
    axis: metric.axis,
    durationUnit: metric.duration_unit,
    rateUnit: metric.rate_unit,
    loading: true,
    error: null,
    rows: [],
  };
}

export const has = Object.prototype.hasOwnProperty;
