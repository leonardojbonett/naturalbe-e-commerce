#!/usr/bin/env node
/*
 * Validate product schema prerequisites from catalog data.
 * Usage: node scripts/validate-product-schema.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, 'static', 'data', 'productos.json');
const SITE_BASE = 'https://naturalbe.com.co';

function readCatalog() {
  if (!fs.existsSync(CATALOG_PATH)) {
    throw new Error(`Catalogo no encontrado: ${CATALOG_PATH}`);
  }
  const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('El catalogo debe ser un array.');
  return data;
}

function isNonEmpty(value) {
  return String(value || '').trim().length > 0;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function buildProductUrl(product) {
  if (isNonEmpty(product.url)) {
    const url = String(product.url).trim();
    if (/^https?:\/\//i.test(url)) return url;
    return `${SITE_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  if (isNonEmpty(product.link)) {
    const link = String(product.link).trim();
    if (/^https?:\/\//i.test(link)) return link;
    return `${SITE_BASE}${link.startsWith('/') ? '' : '/'}${link}`;
  }
  if (isNonEmpty(product.slug)) {
    return `${SITE_BASE}/producto/${encodeURIComponent(String(product.slug).trim())}`;
  }
  return '';
}

function validateProduct(product, index) {
  const errors = [];
  const warnings = [];
  const name = product.nombre || product.name || `index_${index}`;
  const priceRaw = product.precio_oferta != null ? product.precio_oferta : product.precio;
  const price = toNumber(priceRaw);
  const ratingValue = toNumber(product.rating_value);
  const ratingCount = toNumber(product.rating_count);
  const image = product.imagen_principal_webp || product.imagen_principal || product.image || '';
  const desc = product.descripcion_corta || product.descripcion_larga || product.description || '';
  const url = buildProductUrl(product);

  if (!isNonEmpty(name)) errors.push('name_missing');
  if (!Number.isFinite(price) || price <= 0) errors.push('invalid_price');
  if (!isNonEmpty(image)) errors.push('image_missing');
  if (!isNonEmpty(desc)) errors.push('description_missing');
  if (!isNonEmpty(url)) errors.push('url_missing');
  if (!isNonEmpty(product.marca || product.brand)) warnings.push('brand_missing');
  if (!isNonEmpty(product.id || product.slug || product.product_id)) warnings.push('sku_like_id_missing');

  if ((ratingValue > 0 && !(ratingCount > 0)) || (ratingCount > 0 && !(ratingValue > 0))) {
    warnings.push('rating_pair_incomplete');
  }

  return { name, errors, warnings };
}

function main() {
  const products = readCatalog();
  const failures = [];
  const warnings = [];

  products.forEach((product, index) => {
    const result = validateProduct(product, index);
    if (result.errors.length) failures.push(result);
    if (result.warnings.length) warnings.push(result);
  });

  console.log(`Productos revisados: ${products.length}`);
  console.log(`Con errores (bloqueantes): ${failures.length}`);
  console.log(`Con warnings: ${warnings.length}`);

  if (failures.length) {
    console.log('\nErrores bloqueantes (primeros 20):');
    failures.slice(0, 20).forEach((item) => {
      console.log(`- ${item.name}: ${item.errors.join(', ')}`);
    });
  }

  if (warnings.length) {
    console.log('\nWarnings (primeros 20):');
    warnings.slice(0, 20).forEach((item) => {
      console.log(`- ${item.name}: ${item.warnings.join(', ')}`);
    });
  }

  if (failures.length) {
    process.exitCode = 1;
  }
}

main();
