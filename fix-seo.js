#!/usr/bin/env node
/**
 * Fix SEO titles/descriptions for supplements mislabeled as topical.
 * Usage:
 *   node fix-seo.js
 *   node fix-seo.js --dry-run
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

const CWD = process.cwd();
const DEFAULT_INPUT = path.join(CWD, 'productos.json');
const FALLBACK_INPUT = path.join(CWD, 'static', 'data', 'productos.json');
const OUTPUT_JSON = path.join(CWD, 'productos.fixed.json');
const OUTPUT_REPORT = path.join(CWD, 'seo-report.md');

function loadProducts() {
  let inputPath = DEFAULT_INPUT;
  if (!fs.existsSync(inputPath)) {
    inputPath = FALLBACK_INPUT;
  }
  if (!fs.existsSync(inputPath)) {
    throw new Error(`No se encontró productos.json en ${DEFAULT_INPUT} ni en ${FALLBACK_INPUT}`);
  }
  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error('El JSON de entrada debe ser un array de productos.');
  }
  return { data, inputPath };
}

const SUPPLEMENT_CATS = [
  'suplementos', 'vitaminas', 'minerales', 'omega', 'inmunidad', 'energia',
  'colageno', 'digestivos', 'antioxidantes', 'huesos', 'cabello', 'piel', 'omega-3',
  'probio', 'probiotico', 'melatonina', 'biotina'
];

const TOPICAL_KEYWORDS = [
  'crema', 'gel', 'serum', 'sérum', 'locion', 'loción', 'ungüento', 'unguento',
  'roll-on', 'roll on', 'topico', 'tópico', 'uso externo'
];

const INGEST_FORMS = [
  'caps', 'capsula', 'cápsula', 'softgel', 'tableta', 'tablet', 'caplet',
  'porcion', 'porción', 'dosis', 'scoop', 'sobres', 'polvo'
];

const SUPPLEMENT_HINTS = [
  ...INGEST_FORMS,
  'mg', 'mcg', 'iu'
];

const TOPICAL_PHRASES = /uso\s+t[óo]pico|uso\s+externo|aplicar/i;

function normalize(text) {
  return String(text || '').toLowerCase();
}

function hasKeyword(text, keywords) {
  const t = normalize(text);
  return keywords.some(k => t.includes(k));
}

function classifyProduct(p) {
  const text = [
    p.nombre, p.name, p.categoria, p.subcategoria, p.descripcion_corta, p.descripcion_larga,
    p.descripcion, p.tags && p.tags.join(' ')
  ].join(' ');

  const isTopical = hasKeyword(text, TOPICAL_KEYWORDS) || TOPICAL_PHRASES.test(text);
  const isSupplementByCat = hasKeyword(`${p.categoria} ${p.subcategoria}`, SUPPLEMENT_CATS);
  const hasIngestForm = hasKeyword(text, INGEST_FORMS);
  const isSupplementByHints = hasKeyword(text, SUPPLEMENT_HINTS);
  const isSupplement = isSupplementByCat || hasIngestForm || isSupplementByHints;

  if (isTopical && !hasIngestForm) return 'topical';
  if (isSupplement) return 'supplement';
  return 'neutral';
}

function getName(p) {
  return String(p.nombre || p.name || p.title || '').trim();
}

function getPresentation(p) {
  return String(p.presentacion || p.presentacion_unidades || p.presentacion_unidad || '').trim();
}

function normalizeCompact(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function pickBenefit(p) {
  const text = normalize([
    p.categoria, p.subcategoria, p.nombre, p.descripcion_corta, p.tags && p.tags.join(' ')
  ].join(' '));

  if (/(energ|rendimiento|vitalidad|fatiga)/.test(text)) return 'apoya la energía diaria';
  if (/(inmun|defens)/.test(text)) return 'apoya el bienestar del sistema inmune';
  if (/(digest|estomag|flora|probio)/.test(text)) return 'apoya la digestión y el bienestar';
  if (/(suen|relaj|melaton)/.test(text)) return 'apoya el descanso y la relajación';
  if (/(hues|calci|articul)/.test(text)) return 'apoya huesos y articulaciones';
  if (/(corazon|cardio|omega|circul)/.test(text)) return 'apoya el bienestar cardiovascular';
  if (/(piel|cabello|uña|unas|colageno|biotina)/.test(text)) return 'apoya piel, cabello y uñas';
  return 'apoya tu bienestar diario';
}

function trimToLength(text, maxLen) {
  if (text.length <= maxLen) return text;
  const cut = text.lastIndexOf(' ', maxLen);
  return (cut > 0 ? text.slice(0, cut) : text.slice(0, maxLen)).trim();
}

function buildSeoTitle(p) {
  const name = getName(p);
  const presentation = getPresentation(p);
  const nameCompact = normalizeCompact(name);
  const presCompact = normalizeCompact(presentation);
  const shouldAppendPres = presentation && presCompact && !nameCompact.includes(presCompact);
  const base = shouldAppendPres ? `${name} ${presentation}` : name;
  const suffix = ' | Suplemento | Natural Be';
  const maxLen = 70;
  const baseMax = Math.max(10, maxLen - suffix.length);
  const trimmedBase = trimToLength(base, baseMax);
  return `${trimmedBase}${suffix}`;
}

function buildSeoDescription(p) {
  const name = getName(p);
  const presentation = getPresentation(p);
  const benefitRaw = pickBenefit(p);
  const benefit = benefitRaw.charAt(0).toUpperCase() + benefitRaw.slice(1);
  const presText = presentation ? `${presentation}. ` : '';
  let description = `${name}. ${benefit}. ${presText}Compra online con envío a Colombia.`;
  description = description.replace(/\s+/g, ' ').trim();
  description = trimToLength(description, 170);
  return description;
}

function hasTopicalInSeo(p) {
  const text = `${p.seo_title || ''} ${p.seo_description || ''}`;
  return /uso\s+t[óo]pico|topico|tópico/i.test(text);
}

function isDuplicateTitle(title, titlesMap) {
  const key = normalize(title);
  if (!key) return false;
  const count = titlesMap.get(key) || 0;
  return count > 1;
}

function escapePipes(value) {
  return String(value || '').replace(/\|/g, '\\|');
}

function buildReportRow(slug, beforeTitle, afterTitle, beforeDesc, afterDesc, reason) {
  return `| ${escapePipes(slug)} | ${escapePipes(beforeTitle)} | ${escapePipes(afterTitle)} | ${escapePipes(beforeDesc)} | ${escapePipes(afterDesc)} | ${escapePipes(reason)} |`;
}

function main() {
  const { data, inputPath } = loadProducts();

  const reportRows = [];
  const titlesMap = new Map();
  data.forEach(p => {
    const title = String(p.seo_title || '');
    const key = normalize(title);
    if (key) titlesMap.set(key, (titlesMap.get(key) || 0) + 1);
  });

  let modifiedCount = 0;

  const fixed = data.map(p => {
    const product = { ...p };
    const classification = classifyProduct(product);
    const hasTopical = hasTopicalInSeo(product);

    let reason = [];
    let changed = false;

    if (classification === 'supplement' && hasTopical) {
      const beforeTitle = product.seo_title || '';
      const beforeDesc = product.seo_description || '';

      const newTitle = buildSeoTitle(product);
      const newDesc = buildSeoDescription(product);

      product.seo_title = newTitle;
      product.seo_description = newDesc;

      reason.push('Suplemento con SEO tópico');
      changed = true;

      reportRows.push(buildReportRow(product.slug, beforeTitle, newTitle, beforeDesc, newDesc, reason.join('; ')));
    }

    // QA: titles/desc length & duplicates (only adjust if already changed or topical)
    if (!changed && classification === 'supplement') {
      const beforeTitle = product.seo_title || '';
      const beforeDesc = product.seo_description || '';

      let newTitle = beforeTitle;
      let newDesc = beforeDesc;
      let qaChanged = false;

      if (beforeTitle && beforeTitle.length > 70) {
        newTitle = trimToLength(beforeTitle, 70);
        reason.push('Title > 70 chars');
        qaChanged = true;
      }
      if (beforeDesc && beforeDesc.length > 170) {
        newDesc = trimToLength(beforeDesc, 170);
        reason.push('Description > 170 chars');
        qaChanged = true;
      }
      if (isDuplicateTitle(beforeTitle, titlesMap)) {
        newTitle = buildSeoTitle(product);
        reason.push('Title duplicado');
        qaChanged = true;
      }

      if (qaChanged) {
        product.seo_title = newTitle || buildSeoTitle(product);
        product.seo_description = newDesc || buildSeoDescription(product);
        reportRows.push(buildReportRow(product.slug, beforeTitle, product.seo_title, beforeDesc, product.seo_description, reason.join('; ')));
        changed = true;
      }
    }

    if (changed) modifiedCount += 1;
    return product;
  });

  const report = [
    '# SEO Report',
    '',
    `Input: ${inputPath}`,
    `Total productos: ${data.length}`,
    `Modificados: ${modifiedCount}`,
    '',
    '| slug | seo_title (before) | seo_title (after) | seo_description (before) | seo_description (after) | motivo |',
    '| --- | --- | --- | --- | --- | --- |',
    ...reportRows
  ].join('\n');

  if (isDryRun) {
    console.log(report);
    return;
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(fixed, null, 2), 'utf8');
  fs.writeFileSync(OUTPUT_REPORT, report, 'utf8');

  console.log(`Listo. Modificados: ${modifiedCount}`);
  console.log(`Output JSON: ${OUTPUT_JSON}`);
  console.log(`Reporte: ${OUTPUT_REPORT}`);
}

main();
