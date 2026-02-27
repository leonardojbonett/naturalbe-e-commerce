#!/usr/bin/env node
/*
 * Genera PDP estaticos top N para bots de busqueda.
 * Uso: node scripts/generate-pdp-prerender.js [N]
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SITE_URL = 'https://naturalbe.com.co';
const OUT_DIR = path.join(ROOT, 'producto');
const PRODUCT_SOURCES = [
  path.join(ROOT, 'static', 'data', 'productos.json'),
  path.join(ROOT, 'apps', 'naturalbe-app', 'public', 'productos.json')
];
const DEFAULT_LIMIT = 30;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function findProductsPath() {
  for (const p of PRODUCT_SOURCES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`No se encontro productos.json en: ${PRODUCT_SOURCES.join(', ')}`);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getProductDescription(product) {
  const text = String(product.descripcion_corta || product.descripcion_larga || '').trim();
  if (text) return text.slice(0, 220);
  const name = String(product.nombre || '').trim();
  return `Compra ${name} en Colombia con envio 24-48h, pago seguro con Wompi y asesoria por WhatsApp.`;
}

function formatPrice(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `$${n.toLocaleString('es-CO')} COP`;
}

function resolveImage(product) {
  const candidate = String(product.imagen_principal_webp || product.imagen_principal || '').trim();
  if (!candidate) return `${SITE_URL}/static/img/og-naturalbe.jpg`;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return `${SITE_URL}/${candidate.replace(/^\.?\//, '')}`;
}

function buildHtml(product) {
  const slug = String(product.slug || '').trim();
  const name = String(product.nombre || slug).trim();
  const title = `${name} | Natural Be Colombia`;
  const desc = getProductDescription(product);
  const canonical = `${SITE_URL}/producto/${encodeURIComponent(slug)}`;
  const image = resolveImage(product);
  const price = Number(product.precio_oferta || product.precio || 0);
  const priceText = formatPrice(price);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image,
    description: desc,
    brand: {
      '@type': 'Brand',
      name: String(product.marca || 'Natural Be')
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'COP',
      price: price > 0 ? String(price) : undefined,
      availability: 'https://schema.org/InStock',
      url: canonical,
      seller: { '@type': 'Organization', name: 'Natural Be' }
    }
  };

  return `<!DOCTYPE html>
<html lang="es-CO">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    body{font-family:Arial,sans-serif;max-width:860px;margin:2rem auto;padding:0 1rem;line-height:1.5;color:#0f172a}
    .muted{color:#475569}
    .cta{display:inline-block;background:#0f766e;color:#fff;padding:.7rem 1rem;border-radius:.5rem;text-decoration:none;font-weight:700}
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(name)}</h1>
    <p class="muted">${escapeHtml(desc)}</p>
    ${priceText ? `<p><strong>Precio:</strong> ${escapeHtml(priceText)}</p>` : ''}
    <p><strong>Marca:</strong> ${escapeHtml(String(product.marca || 'Natural Be'))}</p>
    <p><a class="cta" href="/product.html?slug=${encodeURIComponent(slug)}">Comprar ahora</a></p>
    <p class="muted">Envio 24-48h en Colombia. Pago seguro con Wompi.</p>
  </main>
</body>
</html>
`;
}

function main() {
  const limitArg = Number(process.argv[2]);
  const limit = Number.isFinite(limitArg) && limitArg > 0 ? Math.floor(limitArg) : DEFAULT_LIMIT;
  const source = findProductsPath();
  const products = readJson(source);
  if (!Array.isArray(products)) {
    throw new Error('El catalogo debe ser un array.');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const selected = products
    .filter((p) => p && typeof p.slug === 'string' && p.slug.trim())
    .slice(0, limit);

  for (const product of selected) {
    const slug = String(product.slug).trim();
    const outPath = path.join(OUT_DIR, `${slug}.html`);
    fs.writeFileSync(outPath, buildHtml(product), 'utf8');
  }

  console.log(`PDP estaticos generados: ${selected.length}`);
  console.log(`Directorio: ${OUT_DIR}`);
  console.log(`Fuente: ${source}`);
}

main();
