#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const targets = process.argv.slice(2);
const files = targets.length ? targets : ['index.html', 'category.html', 'product.html', 'checkout.html', 'blog.html'];

function sha256base64(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('base64');
}

function extractInlineScripts(html) {
  const matches = [];
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const attrs = match[1] || '';
    const body = (match[2] || '').trim();
    if (!body) continue;
    if (/\bsrc\s*=/.test(attrs)) continue;
    matches.push(body);
  }
  return matches;
}

for (const relative of files) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) {
    console.log(`${relative}: not-found`);
    continue;
  }

  const html = fs.readFileSync(full, 'utf8');
  const scripts = extractInlineScripts(html);
  const uniqueHashes = [...new Set(scripts.map((s) => `'sha256-${sha256base64(s)}'`))];

  console.log(`\n${relative}`);
  console.log(`inline_scripts=${scripts.length}`);
  console.log(`unique_hashes=${uniqueHashes.length}`);
  uniqueHashes.forEach((h) => console.log(h));
}
