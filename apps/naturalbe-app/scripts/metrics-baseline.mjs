import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const summaryPath =
  process.argv[2] || path.join(process.cwd(), ".tmp", "orders", "metrics-summary.json");
const baselinePath =
  process.argv[3] || path.join(process.cwd(), ".tmp", "orders", "metrics-baseline.json");

async function run() {
  const raw = await readFile(summaryPath, "utf8");
  const summary = JSON.parse(raw);

  if (!Array.isArray(summary?.byMetric)) {
    throw new Error("Invalid summary JSON. Run npm run metrics:summary first.");
  }

  const baseline = {
    generatedAt: new Date().toISOString(),
    source: summaryPath,
    byMetric: summary.byMetric
  };

  await mkdir(path.dirname(baselinePath), { recursive: true });
  await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
  console.log(`Baseline written to ${baselinePath}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
