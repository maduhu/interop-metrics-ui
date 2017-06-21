import moment from 'moment';

export const has = Object.prototype.hasOwnProperty;

export function generateMetricsKey(m) {
  return `${m.environment}.${m.application}.${m.metric_name}.${m.measure}`;
}

export function generateMetricsUrl(m) {
  return `api/v1/metrics/${m.table}/${m.environment}/${m.application}/${m.metric_name}`;
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
   * Transforms serialized charts from the server to the format needed for the client app.
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

export function transformTimeSeriesDashboard(dashboard) {
  /**
   * Transforms serialized time series dashboards from the server to the format needed for the client app.
   */
  return {
    ...dashboard,
    charts: dashboard.charts.map(transformChart),
  };
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
    duration_unit: metric.duration_unit,
    rate_unit: metric.rate_unit,
    loading: true,
    error: null,
    rows: [],
  };
}

export function createAlertMetric(metric) {
  /**
   * Copies a metric and adds a measure field.
   */
  return { ...metric, measure: '' };
}

export function createAlert() {
  return {
    metric: null,
    warning: null,
    error: null,
    isLoading: false,
    loadError: null,
    data: {
      warnings: null,
      errors: null,
    },
  };
}

export function createAlertDashboard(name) {
  return {
    name,
    version: '1.0',
    rangePeriod: 1,
    rangeMultiplier: 'hours',
    alerts: [],
  };
}

export function copyAlert(alert) {
  return {
    ...alert,
    isLoading: false,
    loadError: null,
    metric: { ...alert.metric },
    data: {
      warnings: null,
      errors: null,
    },
  };
}

export function copyAlertDashboard(dashboard) {
  return {
    ...dashboard,
    alerts: dashboard.alerts.map(copyAlert),
  };
}

export function transformAlert(alert) {
  return { ...alert };
}

export function transformAlertDashboard(dashboard) {
  return {
    ...dashboard,
    alerts: dashboard.alerts.map(transformAlert),
  };
}

export const measureMap = {
  raw_timer_with_interval: [
    'count', 'interval_count', 'mean', 'min', 'median', 'max', 'std_dev', 'p75', 'p95', 'p98', 'p99', 'p999',
    'mean_rate', 'one_min_rate', 'five_min_rate', 'fifteen_min_rate',
  ],
  raw_counter_with_interval: ['count', 'interval_count'],
  '': [],
};

export const unitMap = {
  p75: 'duration_unit',
  p95: 'duration_unit',
  p98: 'duration_unit',
  p99: 'duration_unit',
  p999: 'duration_unit',
  max: 'duration_unit',
  mean: 'duration_unit',
  median: 'duration_unit',
  min: 'duration_unit',
  std_dev: 'duration_unit',
  one_min_rate: 'rate_unit',
  five_min_rate: 'rate_unit',
  fifteen_min_rate: 'rate_unit',
  mean_rate: 'rate_unit',
};
