#!/usr/bin/env node
/**
 * Migra imagenes externas a rutas locales usando el CSV de auditoria.
 *
 * Flujo:
 * 1) Lee reports/external-images-migration.csv
 * 2) Descarga imagenes a /static/img/productos/*
 * 3) Genera .webp para imagen_principal_webp (si hay sharp o la fuente ya es webp)
 * 4) Actualiza static/data/productos.json (opcional con --apply)
 * 5) Escribe reporte en reports/image-migration-report.json
 *
 * Uso recomendado:
 *   node scripts/migrate-external-images.js --apply
 *
 * Opciones:
 *   --csv <ruta>        CSV de entrada
 *   --catalog <ruta>    JSON de catalogo a actualizar
 *   --apply             Escribe cambios en productos.json
 *   --force             Re-descarga y sobreescribe archivos existentes
 *   --limit <n>         Procesa solo N filas (prueba rapida)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const options = {
  csv: getArgValue('--csv') || 'reports/external-images-migration.csv',
  catalog: getArgValue('--catalog') || 'static/data/productos.json',
  apply: args.includes('--apply'),
  force: args.includes('--force'),
  limit: Number(getArgValue('--limit') || 0)
};

const cwd = process.cwd();
const reportPath = path.join(cwd, 'reports', 'image-migration-report.json');
const sharp = tryLoadSharp();
const hasFfmpeg = commandExists('ffmpeg', ['-version']);

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return '';
  return args[idx + 1] || '';
}

function tryLoadSharp() {
  try {
    // Dependencia opcional.
    // Si no existe, se mantiene imagen principal y la webp se degrada a main.
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    return require('sharp');
  } catch (err) {
    return null;
  }
}

function commandExists(cmd, versionArgs) {
  try {
    execFileSync(cmd, versionArgs, { stdio: 'ignore' });
    return true;
  } catch (err) {
    return false;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

function toAbsFromWebPath(webPath) {
  const clean = String(webPath || '').replace(/^\//, '').replace(/\//g, path.sep);
  return path.join(cwd, clean);
}

function isWebpBuffer(buffer) {
  if (!buffer || buffer.length < 12) return false;
  const riff = buffer.toString('ascii', 0, 4) === 'RIFF';
  const webp = buffer.toString('ascii', 8, 12) === 'WEBP';
  return riff && webp;
}

async function fetchBuffer(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arr = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || '';
  return { buffer: Buffer.from(arr), contentType };
}

async function writeMainImage(row, source) {
  const abs = toAbsFromWebPath(row.url_destino_local);
  ensureDir(path.dirname(abs));
  if (!options.force && fs.existsSync(abs)) {
    return { path: row.url_destino_local, skipped: true, reason: 'exists' };
  }
  fs.writeFileSync(abs, source.buffer);
  return { path: row.url_destino_local, skipped: false, reason: '' };
}

async function writeWebpImage(row, source, fallbackMainPath) {
  const abs = toAbsFromWebPath(row.url_destino_local);
  ensureDir(path.dirname(abs));
  if (!options.force && fs.existsSync(abs)) {
    return { path: row.url_destino_local, skipped: true, reason: 'exists', converted: false };
  }

  if (isWebpBuffer(source.buffer) || /image\/webp/i.test(source.contentType)) {
    fs.writeFileSync(abs, source.buffer);
    return { path: row.url_destino_local, skipped: false, reason: '', converted: false };
  }

  if (!sharp) {
    if (hasFfmpeg) {
      const tempIn = path.join(
        os.tmpdir(),
        `nb-img-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.bin`
      );
      try {
        fs.writeFileSync(tempIn, source.buffer);
        execFileSync(
          'ffmpeg',
          [
            '-y',
            '-hide_banner',
            '-loglevel',
            'error',
            '-i',
            tempIn,
            '-vcodec',
            'libwebp',
            '-q:v',
            '82',
            '-compression_level',
            '6',
            abs
          ],
          { stdio: 'ignore' }
        );
        return {
          path: row.url_destino_local,
          skipped: false,
          reason: '',
          converted: true
        };
      } catch (err) {
        return {
          path: fallbackMainPath,
          skipped: true,
          reason: `ffmpeg-error:${err.message}`,
          converted: false
        };
      } finally {
        if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
      }
    }
    return {
      path: fallbackMainPath,
      skipped: true,
      reason: 'sharp-not-installed-and-no-ffmpeg',
      converted: false
    };
  }

  const webpBuffer = await sharp(source.buffer).webp({ quality: 82 }).toBuffer();
  fs.writeFileSync(abs, webpBuffer);
  return { path: row.url_destino_local, skipped: false, reason: '', converted: true };
}

function groupRows(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.id}::${row.slug}`;
    if (!map.has(key)) {
      map.set(key, {
        id: String(row.id || ''),
        slug: String(row.slug || ''),
        main: null,
        webp: null
      });
    }
    const entry = map.get(key);
    if (row.campo === 'imagen_principal') entry.main = row;
    if (row.campo === 'imagen_principal_webp') entry.webp = row;
  }
  return Array.from(map.values());
}

function buildProductsIndex(products) {
  const byId = new Map();
  const bySlug = new Map();
  for (const p of products) {
    if (p && p.id != null) byId.set(String(p.id), p);
    if (p && p.slug) bySlug.set(String(p.slug), p);
  }
  return { byId, bySlug };
}

function findProduct(index, id, slug) {
  if (id && index.byId.has(id)) return index.byId.get(id);
  if (slug && index.bySlug.has(slug)) return index.bySlug.get(slug);
  return null;
}

async function main() {
  if (!fs.existsSync(options.csv)) {
    console.error(`No existe CSV: ${options.csv}`);
    process.exit(1);
  }
  if (!fs.existsSync(options.catalog)) {
    console.error(`No existe catalogo: ${options.catalog}`);
    process.exit(1);
  }

  const csvRows = parseCsv(fs.readFileSync(options.csv, 'utf8'));
  const limitedRows = options.limit > 0 ? csvRows.slice(0, options.limit) : csvRows;
  const grouped = groupRows(limitedRows);
  const products = readJson(options.catalog);
  const index = buildProductsIndex(products);
  const fetchCache = new Map();
  const shouldWrite = options.apply;

  const report = {
    generated_at: new Date().toISOString(),
    csv: options.csv,
    catalog: options.catalog,
    apply: options.apply,
    force: options.force,
    limit: options.limit || null,
    sharp_available: Boolean(sharp),
    ffmpeg_available: Boolean(hasFfmpeg),
    totals: {
      csv_rows: csvRows.length,
      processed_rows: limitedRows.length,
      product_groups: grouped.length,
      products_updated: 0,
      files_written: 0,
      files_skipped: 0,
      errors: 0
    },
    items: []
  };

  for (const entry of grouped) {
    const product = findProduct(index, entry.id, entry.slug);
    const item = {
      id: entry.id,
      slug: entry.slug,
      found_product: Boolean(product),
      main: null,
      webp: null,
      updated_fields: [],
      error: ''
    };

    try {
      let mainLocalPath = '';

      if (entry.main) {
        if (!shouldWrite) {
          mainLocalPath = entry.main.url_destino_local;
          item.main = { path: entry.main.url_destino_local, skipped: true, reason: 'dry-run' };
          report.totals.files_skipped += 1;
        } else {
          const srcUrl = entry.main.url_actual;
          let src = fetchCache.get(srcUrl);
          if (!src) {
            src = await fetchBuffer(srcUrl);
            fetchCache.set(srcUrl, src);
          }
          const write = await writeMainImage(entry.main, src);
          mainLocalPath = write.path;
          item.main = write;
          if (write.skipped) report.totals.files_skipped += 1;
          else report.totals.files_written += 1;
        }
      }

      if (entry.webp) {
        if (!shouldWrite) {
          item.webp = { path: entry.webp.url_destino_local, skipped: true, reason: 'dry-run', converted: false };
          report.totals.files_skipped += 1;
        } else {
          const srcUrl = entry.webp.url_actual;
          let src = fetchCache.get(srcUrl);
          if (!src) {
            src = await fetchBuffer(srcUrl);
            fetchCache.set(srcUrl, src);
          }
          const write = await writeWebpImage(entry.webp, src, mainLocalPath);
          item.webp = write;
          if (write.skipped) report.totals.files_skipped += 1;
          else report.totals.files_written += 1;
        }
      }

      if (product) {
        const nextMain = item.main && item.main.path ? item.main.path : (product.imagen_principal || '');
        const nextWebp = item.webp && item.webp.path
          ? item.webp.path
          : (nextMain || product.imagen_principal_webp || product.imagen_principal || '');

        if (nextMain && product.imagen_principal !== nextMain) {
          product.imagen_principal = nextMain;
          item.updated_fields.push('imagen_principal');
        }
        if (nextWebp && product.imagen_principal_webp !== nextWebp) {
          product.imagen_principal_webp = nextWebp;
          item.updated_fields.push('imagen_principal_webp');
        }
      }
    } catch (err) {
      item.error = err && err.message ? err.message : String(err);
      report.totals.errors += 1;
    }

    if (item.updated_fields.length) {
      report.totals.products_updated += 1;
    }
    report.items.push(item);
  }

  ensureDir(path.dirname(reportPath));
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  if (options.apply) {
    writeJson(options.catalog, products);
  }

  console.log(`CSV leido: ${options.csv}`);
  console.log(`Filas procesadas: ${report.totals.processed_rows}`);
  console.log(`Productos agrupados: ${report.totals.product_groups}`);
  console.log(`Productos actualizados: ${report.totals.products_updated}${options.apply ? ' (escritos)' : ' (dry-run)'}`);
  console.log(`Archivos escritos: ${report.totals.files_written}`);
  console.log(`Archivos omitidos: ${report.totals.files_skipped}`);
  console.log(`Errores: ${report.totals.errors}`);
  console.log(`Sharp disponible: ${report.sharp_available ? 'si' : 'no'}`);
  console.log(`FFmpeg disponible: ${report.ffmpeg_available ? 'si' : 'no'}`);
  console.log(`Reporte: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
