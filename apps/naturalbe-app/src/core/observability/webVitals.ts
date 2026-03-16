import { onCLS, onINP, onLCP } from "web-vitals";
import { reportMetric } from "./metrics";

let started = false;

export function initWebVitalsReporting() {
  if (started) {
    return;
  }

  started = true;

  onLCP((metric) => {
    reportMetric("web_vital_lcp_ms", metric.value, {
      metricId: metric.id
    });
  });

  onCLS((metric) => {
    reportMetric("web_vital_cls", metric.value, {
      metricId: metric.id
    });
  });

  onINP((metric) => {
    reportMetric("web_vital_inp_ms", metric.value, {
      metricId: metric.id
    });
  });
}
