#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const INPUT_PATH = path.join(ROOT, "static", "data", "productos.json");
const OUTPUT_PATH = path.join(ROOT, "static", "data", "productos.algolia.json");
const SITE_ORIGIN = "https://naturalbe.com.co";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function toStringSafe(value) {
  return value == null ? "" : String(value).trim();
}

function toNumberSafe(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeFacet(value) {
  return toStringSafe(value).toLowerCase();
}

function buildUrl(product) {
  const slug = toStringSafe(product.slug);
  if (slug) return `${SITE_ORIGIN}/producto/${encodeURIComponent(slug)}`;
  const link = toStringSafe(product.link);
  if (!link) return `${SITE_ORIGIN}/categoria/suplementos`;
  if (/^https?:\/\//i.test(link)) return link;
  if (link.startsWith("/")) return `${SITE_ORIGIN}${link}`;
  return `${SITE_ORIGIN}/${link}`;
}

function buildImageUrl(product) {
  const raw = toStringSafe(product.imagen_principal_webp || product.imagen_principal);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${SITE_ORIGIN}${raw}`;
  return `${SITE_ORIGIN}/${raw}`;
}

function mapProduct(product) {
  const id = toStringSafe(product.id);
  const slug = toStringSafe(product.slug);
  const productId = toStringSafe(product.product_id);
  const objectID = slug || productId || id;

  const price = toNumberSafe(product.precio);
  const salePrice = product.precio_oferta == null ? null : toNumberSafe(product.precio_oferta);
  const finalPrice = salePrice && salePrice > 0 ? salePrice : price;

  const category = toStringSafe(product.categoria);
  const subcategory = toStringSafe(product.subcategoria);
  const brand = toStringSafe(product.marca);
  const name = toStringSafe(product.nombre);
  const shortDescription = toStringSafe(product.descripcion_corta);

  const tags = Array.isArray(product.tags)
    ? product.tags.map((tag) => toStringSafe(tag)).filter(Boolean)
    : [];
  const benefits = Array.isArray(product.beneficios_bullet)
    ? product.beneficios_bullet.map((b) => toStringSafe(b)).filter(Boolean)
    : [];

  return {
    objectID,
    id,
    slug,
    product_id: productId,
    nombre: name,
    marca: brand,
    categoria: category,
    subcategoria: subcategory,
    categoria_facet: normalizeFacet(category),
    subcategoria_facet: normalizeFacet(subcategory),
    marca_facet: normalizeFacet(brand),
    precio: price,
    precio_oferta: salePrice,
    precio_final: finalPrice,
    moneda: toStringSafe(product.moneda || "COP"),
    disponible: Boolean(product.disponible),
    quantity: toNumberSafe(product.quantity),
    stock_bajo: Boolean(product.stock_bajo),
    badge: toStringSafe(product.badge),
    es_pack: Boolean(product.es_pack),
    es_2x1: Boolean(product.es_2x1),
    presentacion: toStringSafe(product.presentacion),
    formato: toStringSafe(product.formato),
    publico: toStringSafe(product.publico),
    descripcion_corta: shortDescription,
    descripcion_larga: toStringSafe(product.descripcion_larga),
    seo_title: toStringSafe(product.seo_title),
    seo_description: toStringSafe(product.seo_description),
    tags,
    beneficios_bullet: benefits,
    imagen: buildImageUrl(product),
    url: buildUrl(product),
    searchable_text: [name, brand, category, subcategory, shortDescription, ...tags, ...benefits]
      .filter(Boolean)
      .join(" "),
    updated_at: new Date().toISOString()
  };
}

function main() {
  const input = readJson(INPUT_PATH);
  if (!Array.isArray(input)) {
    throw new Error("El archivo de entrada no contiene un arreglo de productos.");
  }

  const mapped = input.map(mapProduct).filter((p) => p.objectID);
  writeJson(OUTPUT_PATH, mapped);

  console.log(`OK: ${mapped.length} productos exportados a ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main();
