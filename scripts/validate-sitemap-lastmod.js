#!/usr/bin/env node
/*
 * Validate sitemap <lastmod> values are ISO dates and not in the future.
 * Usage: node scripts/validate-sitemap-lastmod.js [sitemap-path...]
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const defaultTargets = [
  path.join(ROOT, 'sitemap.xml'),
  path.join(ROOT, 'academia', 'sitemap.xml')
];

const targets = process.argv.slice(2).length
  ? process.argv.slice(2).map((p) => path.resolve(ROOT, p))
  : defaultTargets;

const today = new Date().toISOString().slice(0, 10);
let issues = 0;

for (const filePath of targets) {
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const match = line.match(/<lastmod>([^<]+)<\/lastmod>/);
    if (!match) return;

    const value = String(match[1]).trim();
    const iso = value.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (!iso) {
      issues += 1;
      console.error(`INVALID_FORMAT ${filePath}:${index + 1} => ${value}`);
      return;
    }

    if (iso[1] > today) {
      issues += 1;
      console.error(`FUTURE_DATE ${filePath}:${index + 1} => ${value} > ${today}`);
    }
  });
}

if (issues > 0) {
  console.error(`validate-sitemap-lastmod: FAIL (${issues} issue(s))`);
  process.exit(1);
}

console.log('validate-sitemap-lastmod: OK');
