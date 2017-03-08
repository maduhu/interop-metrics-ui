export function generateMetricsKey(metric) {
  return `${metric.environment}.${metric.application}.${metric.metric_name}.${metric.measure}`;
}

export const has = Object.prototype.hasOwnProperty;
