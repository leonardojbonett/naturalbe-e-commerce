#!/usr/bin/env node
/*
 * Corrige longitudes de SEO title/description en catalogos JSON.
 * Uso: node scripts/fix-seo-copy-length.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TARGETS = [
  path.join(ROOT, 'static', 'data', 'productos.json'),
  path.join(ROOT, 'productos_enriquecido.json')
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function compactSpaces(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function shortenTitle(title, maxLen = 75) {
  let out = compactSpaces(title)
    .replace(/\s+\|\s+Maquillaje Natural Be$/i, ' | Natural Be')
    .replace(/\s+\|\s+Natural Be Colombia$/i, ' | Natural Be');
  if (out.length <= maxLen) return out;
  out = out.replace(/\s+\|\s+Natural Be$/i, '');
  if (out.length > maxLen - 13) out = out.slice(0, maxLen - 13).trim();
  return `${out} | Natural Be`;
}

function normalizeDescription(desc, productName) {
  let out = compactSpaces(desc);
  const base = compactSpaces(productName || 'este producto');
  if (!out) {
    out = `Compra ${base} en Colombia con envio 24-48h y pago seguro con Wompi.`;
  }
  if (out.length < 85) {
    out = `${out} Envio 24-48h en Colombia y pago seguro con Wompi.`;
  }
  if (out.length > 170) {
    out = `${out.slice(0, 167).trim()}...`;
  }
  return out;
}

function patchRows(rows) {
  let changes = 0;
  const next = rows.map((row) => {
    const item = { ...row };
    const originalTitle = item.seo_title || item.meta_title || '';
    const originalDesc = item.seo_description || item.meta_description || '';
    const nextTitle = shortenTitle(originalTitle || item.nombre || item.name || '');
    const nextDesc = normalizeDescription(originalDesc, item.nombre || item.name || '');

    if (nextTitle && nextTitle !== originalTitle) {
      item.seo_title = nextTitle;
      changes += 1;
    }
    if (nextDesc && nextDesc !== originalDesc) {
      item.seo_description = nextDesc;
      changes += 1;
    }
    return item;
  });
  return { next, changes };
}

function main() {
  for (const target of TARGETS) {
    if (!fs.existsSync(target)) continue;
    const data = readJson(target);
    if (!Array.isArray(data)) continue;
    const { next, changes } = patchRows(data);
    writeJson(target, next);
    console.log(`${path.relative(ROOT, target)} actualizado. cambios=${changes}`);
  }
}

main();
