export function generateMetricsKey(m) {
  return `${m.environment}.${m.application}.${m.metric_name}.${m.measure}`;
}

export function generateMetricsUrl(m) {
  return `api/v1/environments/${m.environment}/applications/${m.application}/metrics/${m.table}/${m.metric_name}`;
}

export const has = Object.prototype.hasOwnProperty;
