#!/usr/bin/env node
/*
 * Generate sitemap-images.xml with product URLs and their images.
 * Usage: node scripts/generate-image-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SITE_URL = 'https://naturalbe.com.co';
const OUTPUT_PATH = path.join(ROOT, 'sitemap-images.xml');
const PRODUCT_SOURCES = [
  path.join(ROOT, 'static', 'data', 'productos.json'),
  path.join(ROOT, 'apps', 'naturalbe-app', 'public', 'productos.json')
];

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function findProductsPath() {
  for (const p of PRODUCT_SOURCES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`No se encontro productos.json en: ${PRODUCT_SOURCES.join(', ')}`);
}

function normalizeAssetUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return `${SITE_URL}${raw}`;
  return `${SITE_URL}/${raw.replace(/^\.?\//, '')}`;
}

function getSlug(product) {
  if (product && typeof product.slug === 'string' && product.slug.trim()) {
    return product.slug.trim();
  }
  if (product && typeof product.link === 'string') {
    const match = product.link.match(/\/producto\/([^/?#.]+)(?:\.html)?/i);
    if (match && match[1]) return match[1].trim();
  }
  return '';
}

function readProducts() {
  const sourcePath = findProductsPath();
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error('El catalogo debe ser un array.');
  }
  return { sourcePath, data };
}

function buildImageBlock(imageLoc, title, caption) {
  const parts = [`      <image:loc>${xmlEscape(imageLoc)}</image:loc>`];
  if (title) parts.push(`      <image:title>${xmlEscape(title)}</image:title>`);
  if (caption) parts.push(`      <image:caption>${xmlEscape(caption)}</image:caption>`);
  return ['    <image:image>', ...parts, '    </image:image>'].join('\n');
}

function main() {
  const { sourcePath, data } = readProducts();
  const urlEntries = [];
  const seenUrl = new Set();

  for (const product of data) {
    const slug = getSlug(product);
    if (!slug) continue;

    const loc = `${SITE_URL}/producto/${encodeURIComponent(slug)}`;
    const title = String(product.nombre || '').trim();
    const caption = String(product.descripcion_corta || '').trim();
    const candidates = [
      normalizeAssetUrl(product.imagen_principal_webp),
      normalizeAssetUrl(product.imagen_principal)
    ].filter(Boolean);

    const imageSet = Array.from(new Set(candidates));
    if (!imageSet.length) continue;

    // One <url> entry per canonical product URL.
    if (seenUrl.has(loc)) continue;
    seenUrl.add(loc);

    const imageBlocks = imageSet.map((img) => buildImageBlock(img, title, caption));
    urlEntries.push(
      ['  <url>', `    <loc>${xmlEscape(loc)}</loc>`, ...imageBlocks, '  </url>'].join('\n')
    );
  }

  const xmlParts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urlEntries,
    '</urlset>',
    ''
  ];

  fs.writeFileSync(OUTPUT_PATH, xmlParts.join('\n'), 'utf8');
  console.log(`sitemap-images.xml generado: ${OUTPUT_PATH}`);
  console.log(`Fuente catalogo: ${sourcePath}`);
  console.log(`URLs de producto con imagenes: ${urlEntries.length}`);
}

main();
