import moment from 'moment';

export const has = Object.prototype.hasOwnProperty;

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

export function createTimeSeriesMetric(metric) {
  /**
   * Copies a metric and adds a measure and axis field. In the future we'll probably add more fields.
   */
  return { ...metric, measure: '', axis: 'left' };
}

export function createTimeSeriesDashboard(name) {
  return {
    name,
    version: '1.0',
    charts: [createChart()],
  };
}

export function transformChart(chart) {
  /**
   * Transforms serialized charts from the server to the format needed for the client App.
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

export function copyChart(chart) {
  /**
   * Copies a chart object from a Time Series Dashboard
   */
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

export function copyTimeSeriesDashboard(dashboard) {
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

