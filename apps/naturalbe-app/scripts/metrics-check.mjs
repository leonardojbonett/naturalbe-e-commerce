import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const metricsPath =
  process.argv[2] ||
  process.env.ORDER_METRICS_LOG_PATH ||
  path.join(process.cwd(), ".tmp", "orders", "metrics.jsonl");
const baselinePath =
  process.argv[3] ||
  process.env.METRICS_BASELINE_PATH ||
  path.join(process.cwd(), ".tmp", "orders", "metrics-baseline.json");
const maxP95DeltaPct = Number(process.env.THRESHOLD_P95_DELTA_PCT || 20);

const thresholds = {
  catalog_time_to_grid_ms: Number(process.env.THRESHOLD_CATALOG_P95_MS || 900),
  product_time_to_ready_ms: Number(process.env.THRESHOLD_PRODUCT_P95_MS || 650),
  product_navigation_to_ready_ms: Number(process.env.THRESHOLD_NAV_TO_PDP_P95_MS || 700),
  web_vital_lcp_ms: Number(process.env.THRESHOLD_LCP_P95_MS || 2500),
  web_vital_inp_ms: Number(process.env.THRESHOLD_INP_P95_MS || 250),
  web_vital_cls: Number(process.env.THRESHOLD_CLS_P95 || 0.1)
};

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const position = (p / 100) * (sortedValues.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) {
    return sortedValues[lower];
  }

  const weight = position - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

async function readBaseline() {
  try {
    const raw = await readFile(baselinePath, "utf8");
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed?.byMetric)) {
      return parsed.byMetric;
    }

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return [];
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function run() {
  const raw = await readFile(metricsPath, "utf8");
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const metrics = lines
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((item) => item && typeof item.name === "string" && Number.isFinite(item.value));

  if (metrics.length === 0) {
    console.log("No metrics to check.");
    return;
  }

  let hasRegression = false;
  const currentP95 = {};
  const baseline = await readBaseline();
  const baselineByName = new Map(
    baseline
      .filter((row) => typeof row?.name === "string" && Number.isFinite(row?.p95))
      .map((row) => [row.name, Number(row.p95)])
  );

  for (const [metricName, threshold] of Object.entries(thresholds)) {
    const values = metrics
      .filter((metric) => metric.name === metricName)
      .map((metric) => Number(metric.value))
      .sort((a, b) => a - b);

    if (values.length === 0) {
      continue;
    }

    const p95 = percentile(values, 95);
    currentP95[metricName] = p95;
    const ok = p95 <= threshold;
    const status = ok ? "OK" : "FAIL";
    console.log(`${status} ${metricName} p95=${p95.toFixed(2)} threshold=${threshold}`);

    if (!ok) {
      hasRegression = true;
    }

    const baselineP95 = baselineByName.get(metricName);
    if (baselineP95 !== undefined && baselineP95 > 0) {
      const deltaPct = ((p95 - baselineP95) / baselineP95) * 100;
      const deltaOk = deltaPct <= maxP95DeltaPct;
      const deltaStatus = deltaOk ? "OK" : "FAIL";
      console.log(
        `${deltaStatus} ${metricName} delta=${deltaPct.toFixed(2)}% baseline=${baselineP95.toFixed(
          2
        )} limit=${maxP95DeltaPct}%`
      );

      if (!deltaOk) {
        hasRegression = true;
      }
    }
  }

  console.log(`Checked metrics file: ${metricsPath}`);
  console.log(`Baseline file: ${baselinePath} (${baselineByName.size > 0 ? "loaded" : "not found/empty"})`);

  if (hasRegression) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
