#!/usr/bin/env node
/*
 * Compare Lighthouse summary against repo baseline.
 * Usage:
 *   node scripts/lighthouse-compare.js
 *   node scripts/lighthouse-compare.js reports/lh-summary-prod.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REPORTS = path.join(ROOT, 'reports');

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function metricFromLh(filePath) {
  const j = readJson(filePath);
  if (!j || j.runtimeError) return null;
  const audits = j.audits || {};
  return {
    file: filePath,
    score: (j.categories?.performance?.score ?? null) == null ? null : j.categories.performance.score * 100,
    lcp: audits['largest-contentful-paint']?.numericValue ?? null,
    cls: audits['cumulative-layout-shift']?.numericValue ?? null,
    tbt: audits['total-blocking-time']?.numericValue ?? null,
    speed_index: audits['speed-index']?.numericValue ?? null
  };
}

function avg(values) {
  const nums = values.filter((v) => typeof v === 'number');
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function homeBaseline() {
  const files = [1, 2, 3, 4, 5].map((r) => path.join(REPORTS, `lh-home-mobile-prod-postdeploy-r${r}.report.json`));
  const rows = files.map(metricFromLh).filter(Boolean);
  return {
    file: 'avg(lh-home-mobile-prod-postdeploy-r1..r5)',
    score: avg(rows.map((r) => r.score)),
    lcp: avg(rows.map((r) => r.lcp)),
    cls: avg(rows.map((r) => r.cls)),
    tbt: avg(rows.map((r) => r.tbt)),
    speed_index: avg(rows.map((r) => r.speed_index))
  };
}

function categoryBaseline() {
  return metricFromLh(path.join(REPORTS, 'lh-category-mobile.report.json'));
}

function productBaseline() {
  return (
    metricFromLh(path.join(REPORTS, 'lh-product-mobile-after3.report.json')) ||
    metricFromLh(path.join(REPORTS, 'lh-product-mobile-after.report.json')) ||
    metricFromLh(path.join(REPORTS, 'lh-product-mobile.report.json'))
  );
}

function pickCurrent(summary, kind) {
  const pages = Array.isArray(summary?.pages) ? summary.pages : [];
  if (kind === 'home') {
    return pages.find((p) => String(p.slug || '').includes('home'))?.median || null;
  }
  if (kind === 'category') {
    return pages.find((p) => String(p.slug || '').includes('categoria') || String(p.slug || '').includes('category'))?.median || null;
  }
  return pages.find((p) => String(p.slug || '').includes('producto') || String(p.slug || '').includes('product'))?.median || null;
}

function d(cur, base, key) {
  if (cur == null || base == null) return null;
  if (typeof cur[key] !== 'number' || typeof base[key] !== 'number') return null;
  return cur[key] - base[key];
}

function n(value, digits = 0) {
  return typeof value === 'number' ? Number(value.toFixed(digits)) : null;
}

function toRow(name, current, base) {
  return {
    page: name,
    current: {
      score: n(current?.score, 1),
      lcp: n(current?.lcp, 0),
      cls: n(current?.cls, 4),
      tbt: n(current?.tbt, 0),
      speed_index: n(current?.speed_index, 0)
    },
    baseline: {
      score: n(base?.score, 1),
      lcp: n(base?.lcp, 0),
      cls: n(base?.cls, 4),
      tbt: n(base?.tbt, 0),
      speed_index: n(base?.speed_index, 0)
    },
    delta: {
      score: n(d(current, base, 'score'), 1),
      lcp: n(d(current, base, 'lcp'), 0),
      cls: n(d(current, base, 'cls'), 4),
      tbt: n(d(current, base, 'tbt'), 0),
      speed_index: n(d(current, base, 'speed_index'), 0)
    }
  };
}

function main() {
  const input = process.argv[2] || path.join(REPORTS, 'lh-summary-prod.json');
  const summary = readJson(path.resolve(ROOT, input));
  if (!summary) {
    console.error(`No se encontro summary: ${input}`);
    process.exit(1);
  }

  const baseHome = homeBaseline();
  const baseCategory = categoryBaseline();
  const baseProduct = productBaseline();
  const curHome = pickCurrent(summary, 'home');
  const curCategory = pickCurrent(summary, 'category');
  const curProduct = pickCurrent(summary, 'product');

  const rows = [
    toRow('home', curHome, baseHome),
    toRow('category', curCategory, baseCategory),
    toRow('product', curProduct, baseProduct)
  ];

  const out = {
    generated_at: new Date().toISOString(),
    source_summary: input,
    rows
  };

  const stem = path.basename(input).replace(/\.json$/i, '');
  const outJson = path.join(REPORTS, `${stem}.compare.json`);
  const outMd = path.join(REPORTS, `${stem}.compare.md`);
  fs.writeFileSync(outJson, JSON.stringify(out, null, 2));

  const md = [];
  md.push(`# Lighthouse Comparison (${stem})`);
  md.push('');
  md.push(`- Generated: ${out.generated_at}`);
  md.push(`- Summary source: \`${input}\``);
  md.push('');
  md.push('| Page | Score (cur/base/delta) | LCP ms (cur/base/delta) | CLS (cur/base/delta) | TBT ms (cur/base/delta) | Speed Index ms (cur/base/delta) |');
  md.push('|---|---:|---:|---:|---:|---:|');
  for (const r of rows) {
    md.push(
      `| ${r.page} | ${r.current.score ?? 'n/a'} / ${r.baseline.score ?? 'n/a'} / ${r.delta.score ?? 'n/a'} | ${r.current.lcp ?? 'n/a'} / ${r.baseline.lcp ?? 'n/a'} / ${r.delta.lcp ?? 'n/a'} | ${r.current.cls ?? 'n/a'} / ${r.baseline.cls ?? 'n/a'} / ${r.delta.cls ?? 'n/a'} | ${r.current.tbt ?? 'n/a'} / ${r.baseline.tbt ?? 'n/a'} / ${r.delta.tbt ?? 'n/a'} | ${r.current.speed_index ?? 'n/a'} / ${r.baseline.speed_index ?? 'n/a'} / ${r.delta.speed_index ?? 'n/a'} |`
    );
  }
  md.push('');
  md.push(`JSON: \`${path.relative(ROOT, outJson)}\``);
  md.push(`MD: \`${path.relative(ROOT, outMd)}\``);
  fs.writeFileSync(outMd, `${md.join('\n')}\n`);

  console.log(`Comparison generated:\n - ${path.relative(ROOT, outJson)}\n - ${path.relative(ROOT, outMd)}`);
}

main();
