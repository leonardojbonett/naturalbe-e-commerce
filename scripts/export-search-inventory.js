#!/usr/bin/env node
/*
 * Exporta inventario SEO/indexabilidad a CSV.
 * Salida: reports/search-basics-indexability.csv
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'reports');
const OUT_FILE = path.join(OUT_DIR, 'search-basics-indexability.csv');
const SITE_URL = 'https://naturalbe.com.co';

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'cache_images',
  'cache_images_v2',
  'cache_images_v3',
  'cache_images_v5',
  'cache_images_v6',
  'cache_images_v7',
  'cache_images_v8',
  'cache_images_final',
  'reports'
]);
const MAIN_SITE_EXTRA_SKIP = new Set(['academia', 'apps', 'play']);

function walk(dir, out, options) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (options.mainSiteOnly && MAIN_SITE_EXTRA_SKIP.has(entry.name)) continue;
      walk(full, out, options);
      continue;
    }
    if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith('.html') &&
      !/\.report\.html$/i.test(entry.name)
    ) {
      out.push(full);
    }
  }
}

function readMatch(re, text) {
  const m = text.match(re);
  return m ? String(m[1] || '').trim() : '';
}

function isNoindex(robotsContent) {
  return /(^|[\s,])noindex([\s,]|$)/i.test(robotsContent || '');
}

function normalizeUrl(fileRel) {
  const rel = fileRel.replace(/\\/g, '/');
  if (rel.toLowerCase() === 'index.html') return `${SITE_URL}/`;
  return `${SITE_URL}/${rel}`;
}

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function main() {
  const mainSiteOnly = process.argv.includes('--main-site');
  const options = { mainSiteOnly };
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = [];
  walk(ROOT, files, options);
  files.sort();

  const rows = [];
  rows.push([
    'file',
    'url',
    'status',
    'robots',
    'noindex',
    'meta_refresh_target',
    'canonical',
    'has_title',
    'has_description',
    'has_h1'
  ]);

  let indexable = 0;
  let noindexCount = 0;
  let redirectCount = 0;

  for (const filePath of files) {
    const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
    const html = fs.readFileSync(filePath, 'utf8');

    const robots = readMatch(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["']/i, html);
    const refreshTarget = readMatch(/<meta[^>]+http-equiv=["']refresh["'][^>]*content=["'][^"']*url\s*=\s*([^"']+)["']/i, html);
    const canonical = readMatch(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i, html);

    const hasTitle = /<title>[\s\S]*?<\/title>/i.test(html);
    const hasDescription = /<meta[^>]+name=["']description["'][^>]*>/i.test(html);
    const hasH1 = /<h1[\s>]/i.test(html);

    const noindex = isNoindex(robots);
    const hasRefresh = Boolean(refreshTarget);
    const status = noindex
      ? 'noindex'
      : hasRefresh
        ? 'redirect-bridge'
        : 'indexable';

    if (status === 'indexable') indexable += 1;
    if (status === 'noindex') noindexCount += 1;
    if (hasRefresh) redirectCount += 1;

    rows.push([
      rel,
      normalizeUrl(rel),
      status,
      robots,
      noindex ? 'true' : 'false',
      refreshTarget,
      canonical,
      hasTitle ? 'true' : 'false',
      hasDescription ? 'true' : 'false',
      hasH1 ? 'true' : 'false'
    ]);
  }

  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n') + '\n';
  fs.writeFileSync(OUT_FILE, csv, 'utf8');

  console.log(`CSV generado: ${OUT_FILE}`);
  console.log(`Scope: ${mainSiteOnly ? 'main-site' : 'all'}`);
  console.log(`Total HTML: ${files.length}`);
  console.log(`Indexables: ${indexable}`);
  console.log(`Noindex: ${noindexCount}`);
  console.log(`Con meta refresh: ${redirectCount}`);
}

main();
