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
