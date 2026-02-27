#!/usr/bin/env node
/*
 * Generate sitemap.xml with static and product URLs.
 * Usage: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SITE_URL = 'https://naturalbe.com.co';
const OUTPUT_PATH = path.join(ROOT, 'sitemap.xml');
const PRODUCT_SOURCES = [
  path.join(ROOT, 'static', 'data', 'productos.json'),
  path.join(ROOT, 'apps', 'naturalbe-app', 'public', 'productos.json')
];

const STATIC_URLS = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.7' },
  { loc: '/catalogo/', changefreq: 'weekly', priority: '0.7' },
  { loc: '/envios', changefreq: 'monthly', priority: '0.5' },
  { loc: '/devoluciones', changefreq: 'monthly', priority: '0.5' },
  { loc: '/terminos', changefreq: 'monthly', priority: '0.4' },
  { loc: '/privacidad', changefreq: 'monthly', priority: '0.4' },
  { loc: '/perfil/equipo-natural-be.html', changefreq: 'monthly', priority: '0.6' },
  { loc: '/categoria/suplementos', changefreq: 'weekly', priority: '0.8' },
  { loc: '/categoria/vitaminas', changefreq: 'weekly', priority: '0.8' },
  { loc: '/categoria/minerales', changefreq: 'weekly', priority: '0.8' },
  { loc: '/categoria/omega', changefreq: 'weekly', priority: '0.8' },
  { loc: '/licencia-imagenes.html', changefreq: 'monthly', priority: '0.4' },
  { loc: '/omega-3-bogota.html', changefreq: 'monthly', priority: '0.8' },
  { loc: '/omega-3-colombia.html', changefreq: 'monthly', priority: '0.8' },
  { loc: '/multivitaminicos.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/multivitaminico-para-hombre.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/vitamina-c-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/vitamina-d3-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/complejo-b-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/vitamina-e-1000-ui-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/magnesio-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/citrato-de-magnesio-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/zinc-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/calcio-con-vitamina-d3-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/colageno-hidrolizado-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/colageno-con-vitamina-c-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/colageno-para-piel-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/colageno-para-articulaciones-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/comprar-suplementos-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/tienda-de-vitaminas-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/tienda-naturista-online-colombia.html', changefreq: 'weekly', priority: '0.8' },
  { loc: '/suplementos-dietarios-colombia.html', changefreq: 'weekly', priority: '0.8' }
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeLastmod(value, fallbackIso) {
  const fallback = String(fallbackIso || todayIso());
  const raw = value == null ? '' : String(value).trim();
  if (!raw) return fallback;
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return fallback;
  const candidate = match[1];
  // Clamp future dates: sitemap lastmod should never be greater than today.
  if (candidate > fallback) return fallback;
  return candidate;
}

function buildUrlEntry(url, lastmod, changefreq, priority) {
  return [
    '  <url>',
    `    <loc>${xmlEscape(url)}</loc>`,
    `    <lastmod>${xmlEscape(lastmod)}</lastmod>`,
    `    <changefreq>${xmlEscape(changefreq)}</changefreq>`,
    `    <priority>${xmlEscape(priority)}</priority>`,
    '  </url>'
  ].join('\n');
}

function isNoindexOrRedirectHtml(loc) {
  const cleanLoc = String(loc || '').split('?')[0].split('#')[0];
  if (!cleanLoc.endsWith('.html')) return false;
  const relPath = cleanLoc.replace(/^\//, '').replace(/\//g, path.sep);
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) return false;
  const html = fs.readFileSync(fullPath, 'utf8');
  const noindex = /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
  const hasRefresh = /<meta[^>]+http-equiv=["']refresh["'][^>]*content=["'][^"']*url=/i.test(html);
  return noindex || hasRefresh;
}

function main() {
  const now = todayIso();
  const { sourcePath, data } = readProducts();
  const productEntries = [];
  const seen = new Set();

  for (const product of data) {
    const slug = getSlug(product);
    if (!slug) continue;
    const loc = `${SITE_URL}/producto/${encodeURIComponent(slug)}`;
    if (seen.has(loc)) continue;
    seen.add(loc);
    productEntries.push({
      loc,
      lastmod: normalizeLastmod(product.lastmod, now),
      changefreq: 'weekly',
      priority: '0.7'
    });
  }

  const staticEntries = STATIC_URLS
    .filter((entry) => !isNoindexOrRedirectHtml(entry.loc))
    .map((entry) => ({
      loc: `${SITE_URL}${entry.loc}`,
      lastmod: now,
      changefreq: entry.changefreq,
      priority: entry.priority
    }));

  const xmlParts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticEntries.map((entry) =>
      buildUrlEntry(entry.loc, entry.lastmod, entry.changefreq, entry.priority)
    ),
    ...productEntries.map((entry) =>
      buildUrlEntry(entry.loc, entry.lastmod, entry.changefreq, entry.priority)
    ),
    '</urlset>',
    ''
  ];

  fs.writeFileSync(OUTPUT_PATH, xmlParts.join('\n'), 'utf8');
  console.log(`sitemap.xml generado: ${OUTPUT_PATH}`);
  console.log(`Fuente catalogo: ${sourcePath}`);
  console.log(`Paginas estaticas: ${staticEntries.length}`);
  console.log(`Productos incluidos: ${productEntries.length}`);
}

main();
