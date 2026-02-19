#!/usr/bin/env node
/*
 * Validate canonical product URL policy in sitemap:
 * - /producto/{slug} (without .html)
 * - no mixed .html endings for product URLs
 * Usage: node scripts/validate-sitemap-product-canonical.js [sitemap-path]
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const sitemapPath = process.argv[2]
  ? path.resolve(ROOT, process.argv[2])
  : path.join(ROOT, 'sitemap.xml');

if (!fs.existsSync(sitemapPath)) {
  console.error(`No existe sitemap: ${sitemapPath}`);
  process.exit(1);
}

const xml = fs.readFileSync(sitemapPath, 'utf8');
const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

const productLocs = locMatches.filter((u) => u.includes('/producto/'));
if (!productLocs.length) {
  console.error('No se encontraron URLs de /producto/ en sitemap.');
  process.exit(1);
}

const withHtml = productLocs.filter((u) => /\/producto\/.+\.html$/i.test(u));
const invalidPattern = productLocs.filter((u) => !/\/producto\/[A-Za-z0-9-]+$/i.test(u));

if (withHtml.length || invalidPattern.length) {
  console.error('validate-sitemap-product-canonical: FAIL');
  if (withHtml.length) {
    console.error(`- URLs de producto con .html: ${withHtml.length}`);
    withHtml.slice(0, 10).forEach((u) => console.error(`  ${u}`));
  }
  if (invalidPattern.length) {
    console.error(`- URLs de producto con patron inesperado: ${invalidPattern.length}`);
    invalidPattern.slice(0, 10).forEach((u) => console.error(`  ${u}`));
  }
  process.exit(1);
}

console.log(`validate-sitemap-product-canonical: OK (${productLocs.length} URLs de producto)`) ;
