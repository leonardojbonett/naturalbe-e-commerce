#!/usr/bin/env node
/*
 * Auditoria basica SEO tecnica (Search Basics):
 * - title
 * - meta description
 * - canonical
 * - h1
 * Ignora archivos de cache/reportes y paginas noindex.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'apps',
  'play',
  'academia',
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

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
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

function hasMetaRobotsNoindex(html) {
  const m = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["']/i);
  if (!m) return false;
  return /(^|[\s,])noindex([\s,]|$)/i.test(m[1]);
}

function checkFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  if (hasMetaRobotsNoindex(html)) return null;

  const issues = [];
  if (!/<title>[\s\S]*?<\/title>/i.test(html)) issues.push('missing-title');
  if (!/<meta[^>]+name=["']description["'][^>]*>/i.test(html)) issues.push('missing-description');
  if (!/<link[^>]+rel=["']canonical["'][^>]*>/i.test(html)) issues.push('missing-canonical');
  if (!/<h1[\s>]/i.test(html)) issues.push('missing-h1');

  if (!issues.length) return null;
  return {
    file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
    issues
  };
}

function main() {
  const files = [];
  walk(ROOT, files);

  const warnings = [];
  for (const file of files) {
    const result = checkFile(file);
    if (result) warnings.push(result);
  }

  if (!warnings.length) {
    console.log('[audit-search-basics] OK: sin hallazgos en paginas indexables.');
    return;
  }

  console.log(`[audit-search-basics] Hallazgos: ${warnings.length}`);
  for (const w of warnings) {
    console.log(`- ${w.file}: ${w.issues.join(', ')}`);
  }
}

main();
