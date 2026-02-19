#!/usr/bin/env node
/*
 * Validate SEO copy quality in product catalogs.
 * Usage:
 *   node scripts/validate-product-seo-copy.js
 *   node scripts/validate-product-seo-copy.js static/data/productos.json productos_enriquecido.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DEFAULT_FILES = [
  path.join(ROOT, 'static', 'data', 'productos.json'),
  path.join(ROOT, 'productos_enriquecido.json')
];

const ORAL_HINTS = [
  'caps', 'cáps', 'softgel', 'tableta', 'tablet', 'polvo', 'gomas', 'jarabe', 'sobres', 'oral'
];

const TOPICAL_PHRASES = [
  /uso\s+t[oó]pico/i,
  /f[aá]cil\s+de\s+aplicar/i,
  /aplica(?:r|ci[oó]n)\s+(?:en|sobre)\s+la\s+piel/i,
  /\bt[oó]pico\b/i
];

const GENERIC_COPY_PATTERNS = [
  /^suplemento\s+para\s+tu\s+rutina\s+diaria/i
];

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Catalogo invalido en ${filePath}: se esperaba un array`);
  }
  return parsed;
}

function normalize(v) {
  return String(v || '').trim();
}

function productId(p) {
  return normalize(p.product_id) || normalize(p.sku) || normalize(p.slug) || normalize(p.id) || 'UNKNOWN';
}

function looksOralProduct(p) {
  const blob = [p.nombre, p.name, p.presentacion, p.presentation, p.formato, p.category, p.categoria]
    .map(normalize)
    .join(' ')
    .toLowerCase();
  return ORAL_HINTS.some((token) => blob.includes(token));
}

function validateFile(filePath) {
  const rows = readJson(filePath);
  const findings = [];

  rows.forEach((p, idx) => {
    const id = productId(p);
    const title = normalize(p.seo_title);
    const desc = normalize(p.seo_description);

    if (!title) {
      findings.push({ severity: 'error', code: 'MISSING_SEO_TITLE', filePath, idx: idx + 1, id, detail: 'seo_title vacio' });
    }
    if (!desc) {
      findings.push({ severity: 'error', code: 'MISSING_SEO_DESCRIPTION', filePath, idx: idx + 1, id, detail: 'seo_description vacio' });
    }

    const oral = looksOralProduct(p);
    const combined = `${title} ${desc}`;
    TOPICAL_PHRASES.forEach((rx) => {
      if (rx.test(combined) && oral) {
        findings.push({
          severity: 'error',
          code: 'SEMANTIC_MISMATCH_TOPICAL_COPY',
          filePath,
          idx: idx + 1,
          id,
          detail: `Frase incompatible para producto oral: ${rx}`
        });
      }
    });

    if (title && title.length > 85) {
      findings.push({ severity: 'warn', code: 'SEO_TITLE_TOO_LONG', filePath, idx: idx + 1, id, detail: `Longitud=${title.length}` });
    }
    if (desc && (desc.length < 80 || desc.length > 220)) {
      findings.push({ severity: 'warn', code: 'SEO_DESCRIPTION_LENGTH', filePath, idx: idx + 1, id, detail: `Longitud=${desc.length}` });
    }

    if (desc && GENERIC_COPY_PATTERNS.some((rx) => rx.test(desc))) {
      findings.push({
        severity: 'warn',
        code: 'GENERIC_SEO_DESCRIPTION',
        filePath,
        idx: idx + 1,
        id,
        detail: 'Descripcion demasiado generica'
      });
    }
  });

  return { rows: rows.length, findings };
}

function main() {
  const args = process.argv.slice(2);
  const strictWarnings = args.includes('--strict-warnings');
  const fileArgs = args.filter((a) => a !== '--strict-warnings');
  const files = fileArgs.length ? fileArgs.map((p) => path.resolve(ROOT, p)) : DEFAULT_FILES;

  let totalRows = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  let checkedFiles = 0;

  files.forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`[SKIP] Archivo no encontrado: ${filePath}`);
      return;
    }
    checkedFiles += 1;
    const { rows, findings } = validateFile(filePath);
    totalRows += rows;
    const errors = findings.filter((f) => f.severity === 'error');
    const warnings = findings.filter((f) => f.severity === 'warn');
    totalErrors += errors.length;
    totalWarnings += warnings.length;

    if (findings.length) {
      console.log(`\n[${filePath}] errors=${errors.length} warnings=${warnings.length}`);
      findings.slice(0, 100).forEach((f) => {
        console.log(`${f.severity.toUpperCase()} ${f.code} ${f.filePath}:${f.idx} ${f.id} -> ${f.detail}`);
      });
      if (findings.length > 100) {
        console.log(`... +${findings.length - 100} findings more`);
      }
    } else {
      console.log(`\n[${filePath}] OK (${rows} productos)`);
    }

  });

  if (checkedFiles === 0) {
    console.error('validate-product-seo-copy: FAIL (no se encontro ningun archivo de entrada)');
    process.exit(1);
  }

  if (totalErrors > 0 || (strictWarnings && totalWarnings > 0)) {
    console.error(
      `\nvalidate-product-seo-copy: FAIL (rows=${totalRows}, errors=${totalErrors}, warnings=${totalWarnings}, strictWarnings=${strictWarnings})`
    );
    process.exit(1);
  }

  const status = totalWarnings > 0 ? 'OK_WITH_WARNINGS' : 'OK';
  console.log(`\nvalidate-product-seo-copy: ${status} (rows=${totalRows}, errors=${totalErrors}, warnings=${totalWarnings})`);
}

main();
