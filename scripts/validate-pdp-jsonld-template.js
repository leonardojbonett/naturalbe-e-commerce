#!/usr/bin/env node
/*
 * Validate JSON-LD Product implementation in product.html template.
 * Usage: node scripts/validate-pdp-jsonld-template.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PDP_PATH = path.join(ROOT, 'product.html');

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`OK: ${message}`);
}

function assertContains(content, pattern, label) {
  const pass = pattern.test(content);
  if (!pass) {
    fail(`${label} no encontrado`);
  } else {
    ok(label);
  }
}

function main() {
  if (!fs.existsSync(PDP_PATH)) {
    fail(`No existe ${PDP_PATH}`);
    return;
  }

  const html = fs.readFileSync(PDP_PATH, 'utf8');

  assertContains(html, /function\s+updateProductSchema\s*\(/, 'Funcion updateProductSchema');
  assertContains(html, /"@type":"Product"/, 'Schema Product');
  assertContains(html, /"offers":\s*\{/, 'Nodo offers');
  assertContains(html, /"priceCurrency":\s*p\.moneda\|\|"COP"/, 'priceCurrency COP');
  assertContains(html, /"price":\s*String\(priceValue\)/, 'price dinamico');
  assertContains(html, /"availability":\s*availability/, 'availability dinamica');
  assertContains(html, /"priceValidUntil":\s*priceValidUntil/, 'priceValidUntil dinamico');
  assertContains(html, /"url":\s*canonicalUrl/, 'url canonica en schema');
  assertContains(html, /"seller":\s*\{[\s\S]*"@type":"Organization"[\s\S]*"name":"Natural Be"/, 'seller Organization');
  assertContains(html, /data\.aggregateRating=\{/, 'aggregateRating condicional');
  assertContains(html, /data\.review=reviewList\.slice\(0,5\)/, 'reviews en schema');
  assertContains(html, /script\.id='productSchema'/, 'script id productSchema');
  assertContains(html, /const existing=document\.getElementById\('productSchema'\)/, 'replace schema existente');
  assertContains(html, /updateProductSchema\(p,reviews\);/, 'invocacion updateProductSchema');

  const hasLegacyScriptTag = /<script\s+src="\/static\/js\/product-schema\.js/i.test(html);
  if (hasLegacyScriptTag) {
    fail('Aun existe carga de /static/js/product-schema.js en product.html');
  } else {
    ok('Sin carga legacy de /static/js/product-schema.js');
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error('Validacion PDP JSON-LD: FALLIDA');
    return;
  }
  console.log('Validacion PDP JSON-LD: OK');
}

main();
