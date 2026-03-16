import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const defaultInput =
  process.env.ORDER_METRICS_LOG_PATH || path.join(process.cwd(), ".tmp", "orders", "metrics.jsonl");
const defaultOutput = path.join(process.cwd(), ".tmp", "orders", "metrics-summary.md");
const defaultHtmlOutput = path.join(process.cwd(), ".tmp", "orders", "metrics-summary.html");
const defaultJsonOutput = path.join(process.cwd(), ".tmp", "orders", "metrics-summary.json");

const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultInput;
const outputPath = process.argv[3] ? path.resolve(process.argv[3]) : defaultOutput;
const htmlOutputPath = process.argv[4] ? path.resolve(process.argv[4]) : defaultHtmlOutput;
const jsonOutputPath = process.argv[5] ? path.resolve(process.argv[5]) : defaultJsonOutput;

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

function round(value) {
  return Number(value.toFixed(2));
}

function computeStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);

  return {
    count: sorted.length,
    avg: round(sum / sorted.length),
    min: round(sorted[0]),
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
    max: round(sorted[sorted.length - 1])
  };
}

function buildMarkdown(summaryRows, breakdownRows, releaseRows, source) {
  const generatedAt = new Date().toISOString();
  const summaryLines = summaryRows
    .map(
      (row) =>
        `| ${row.name} | ${row.count} | ${row.avg} | ${row.min} | ${row.p50} | ${row.p95} | ${row.p99} | ${row.max} |`
    )
    .join("\n");

  const breakdownLines = breakdownRows
    .map(
      (row) =>
        `| ${row.name} | ${row.variant} | ${row.count} | ${row.avg} | ${row.p50} | ${row.p95} |`
    )
    .join("\n");

  const releaseLines = releaseRows
    .map(
      (row) =>
        `| ${row.release} | ${row.name} | ${row.count} | ${row.avg} | ${row.p50} | ${row.p95} | ${row.p99} |`
    )
    .join("\n");

  return [
    "# Metrics Summary",
    "",
    `- Generated: ${generatedAt}`,
    `- Source: ${source}`,
    "",
    "## By Metric",
    "",
    "| metric | count | avg_ms | min_ms | p50_ms | p95_ms | p99_ms | max_ms |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    summaryLines || "| (no data) | 0 | 0 | 0 | 0 | 0 | 0 | 0 |",
    "",
    "## Product Navigation Breakdown",
    "",
    "| metric | variant | count | avg_ms | p50_ms | p95_ms |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
    breakdownLines || "| (no data) | - | 0 | 0 | 0 | 0 |",
    "",
    "## By Release",
    "",
    "| release | metric | count | avg_ms | p50_ms | p95_ms | p99_ms |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
    releaseLines || "| (no data) | - | 0 | 0 | 0 | 0 | 0 |",
    ""
  ].join("\n");
}

function buildHtml(summaryRows, breakdownRows, releaseRows, source) {
  const generatedAt = new Date().toISOString();

  const toRows = (rows, cols) =>
    rows
      .map((row) => `<tr>${cols.map((col) => `<td>${String(row[col] ?? "")}</td>`).join("")}</tr>`)
      .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Metrics Summary</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
    h1, h2 { margin: 12px 0; }
    .meta { color: #6b7280; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
    tr:nth-child(even) { background: #fafafa; }
  </style>
</head>
<body>
  <h1>Metrics Summary</h1>
  <p class="meta">Generated: ${generatedAt}</p>
  <p class="meta">Source: ${source}</p>

  <h2>By Metric</h2>
  <table>
    <thead><tr><th>metric</th><th>count</th><th>avg_ms</th><th>min_ms</th><th>p50_ms</th><th>p95_ms</th><th>p99_ms</th><th>max_ms</th></tr></thead>
    <tbody>${toRows(summaryRows, ["name", "count", "avg", "min", "p50", "p95", "p99", "max"])}</tbody>
  </table>

  <h2>Product Navigation Breakdown</h2>
  <table>
    <thead><tr><th>metric</th><th>variant</th><th>count</th><th>avg_ms</th><th>p50_ms</th><th>p95_ms</th></tr></thead>
    <tbody>${toRows(breakdownRows, ["name", "variant", "count", "avg", "p50", "p95"])}</tbody>
  </table>

  <h2>By Release</h2>
  <table>
    <thead><tr><th>release</th><th>metric</th><th>count</th><th>avg_ms</th><th>p50_ms</th><th>p95_ms</th><th>p99_ms</th></tr></thead>
    <tbody>${toRows(releaseRows, ["release", "name", "count", "avg", "p50", "p95", "p99"])}</tbody>
  </table>
</body>
</html>`;
}

function buildByDayRows(parsed) {
  const byDayMetric = new Map();

  for (const metric of parsed) {
    const day =
      typeof metric.at === "string" && metric.at.length >= 10 ? metric.at.slice(0, 10) : "unknown";
    const key = `${day}::${metric.name}`;
    const item = byDayMetric.get(key) ?? { day, name: metric.name, values: [] };
    item.values.push(Number(metric.value));
    byDayMetric.set(key, item);
  }

  return Array.from(byDayMetric.values())
    .map((item) => ({
      day: item.day,
      name: item.name,
      ...computeStats(item.values)
    }))
    .sort((a, b) =>
      a.day === b.day ? a.name.localeCompare(b.name) : a.day.localeCompare(b.day)
    );
}

async function run() {
  let raw;

  try {
    raw = await readFile(inputPath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      console.log(`Metrics file not found: ${inputPath}`);
      return;
    }

    throw error;
  }

  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const parsed = lines
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((item) => item && typeof item.name === "string" && Number.isFinite(item.value));

  if (parsed.length === 0) {
    console.log("No metrics found in file.");
    return;
  }

  const byMetric = new Map();
  for (const metric of parsed) {
    const list = byMetric.get(metric.name) ?? [];
    list.push(Number(metric.value));
    byMetric.set(metric.name, list);
  }

  const summaryRows = Array.from(byMetric.entries())
    .map(([name, values]) => ({ name, ...computeStats(values) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const navMetrics = parsed.filter((metric) => metric.name === "product_navigation_to_ready_ms");
  const navByPrefetch = new Map();
  for (const metric of navMetrics) {
    const variant = metric.tags?.prefetched === true ? "prefetched" : "non_prefetched";
    const list = navByPrefetch.get(variant) ?? [];
    list.push(Number(metric.value));
    navByPrefetch.set(variant, list);
  }

  const breakdownRows = Array.from(navByPrefetch.entries())
    .map(([variant, values]) => ({
      name: "product_navigation_to_ready_ms",
      variant,
      ...computeStats(values)
    }))
    .sort((a, b) => a.variant.localeCompare(b.variant));

  const byReleaseMetric = new Map();
  for (const metric of parsed) {
    const release = String(metric.tags?.release ?? "unknown");
    const key = `${release}::${metric.name}`;
    const item = byReleaseMetric.get(key) ?? { release, name: metric.name, values: [] };
    item.values.push(Number(metric.value));
    byReleaseMetric.set(key, item);
  }

  const releaseRows = Array.from(byReleaseMetric.values())
    .map((item) => ({
      release: item.release,
      name: item.name,
      ...computeStats(item.values)
    }))
    .sort((a, b) =>
      a.release === b.release ? a.name.localeCompare(b.name) : a.release.localeCompare(b.release)
    );
  const byDayRows = buildByDayRows(parsed);

  console.table(
    summaryRows.map((row) => ({
      metric: row.name,
      count: row.count,
      avg_ms: row.avg,
      p50_ms: row.p50,
      p95_ms: row.p95,
      p99_ms: row.p99
    }))
  );

  if (breakdownRows.length > 0) {
    console.table(
      breakdownRows.map((row) => ({
        metric: row.name,
        variant: row.variant,
        count: row.count,
        avg_ms: row.avg,
        p50_ms: row.p50,
        p95_ms: row.p95
      }))
    );
  }

  if (releaseRows.length > 0) {
    console.table(
      releaseRows.map((row) => ({
        release: row.release,
        metric: row.name,
        count: row.count,
        p95_ms: row.p95
      }))
    );
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  const markdown = buildMarkdown(summaryRows, breakdownRows, releaseRows, inputPath);
  await writeFile(outputPath, markdown, "utf8");
  const html = buildHtml(summaryRows, breakdownRows, releaseRows, inputPath);
  await writeFile(htmlOutputPath, html, "utf8");
  const jsonSummary = {
    generatedAt: new Date().toISOString(),
    source: inputPath,
    byMetric: summaryRows,
    byRelease: releaseRows,
    byDay: byDayRows,
    productNavigationBreakdown: breakdownRows
  };
  await writeFile(jsonOutputPath, `${JSON.stringify(jsonSummary, null, 2)}\n`, "utf8");

  console.log(`Metrics summary written to ${outputPath}`);
  console.log(`Metrics HTML dashboard written to ${htmlOutputPath}`);
  console.log(`Metrics JSON summary written to ${jsonOutputPath}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
