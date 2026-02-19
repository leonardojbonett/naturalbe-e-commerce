#!/usr/bin/env node
/**
 * Audita imagenes externas en el catalogo y genera CSV de migracion.
 *
 * Uso:
 *   node scripts/audit-external-images.js
 *   node scripts/audit-external-images.js --input static/data/productos.json --out reports
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const inputPath = getArgValue('--input') || 'static/data/productos.json';
const outDir = getArgValue('--out') || 'reports';

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return '';
  return args[idx + 1] || '';
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function safeSlug(value, fallback) {
  const raw = String(value || '').trim().toLowerCase();
  const normalized = raw
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function getImageExt(urlString, fallbackExt) {
  try {
    const parsed = new URL(urlString);
    const ext = path.extname(parsed.pathname || '').toLowerCase();
    if (ext && ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
      return ext;
    }
  } catch (err) {
    // Ignorar parse error y usar fallback
  }
  return fallbackExt;
}

function csvEscape(value) {
  const str = String(value == null ? '' : value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function writeCsv(filePath, rows) {
  const content = rows.map((row) => row.map(csvEscape).join(',')).join('\n') + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function main() {
  if (!fs.existsSync(inputPath)) {
    console.error(`No existe el archivo de entrada: ${inputPath}`);
    process.exit(1);
  }

  const data = readJson(inputPath);
  if (!Array.isArray(data)) {
    console.error('El JSON de catalogo no es un arreglo.');
    process.exit(1);
  }

  const fields = ['imagen_principal', 'imagen_principal_webp'];
  const rows = [];
  const hostCount = new Map();

  for (const p of data) {
    const id = String(p && p.id != null ? p.id : '');
    const slug = safeSlug(p && p.slug, id || 'sin-id');

    for (const field of fields) {
      const value = String((p && p[field]) || '').trim();
      if (!isExternalUrl(value)) continue;

      let hostname = '';
      try {
        hostname = new URL(value).hostname;
      } catch (err) {
        hostname = 'invalid-url';
      }

      const fallbackExt = '.jpg';
      const ext = field === 'imagen_principal_webp' ? '.webp' : getImageExt(value, fallbackExt);
      const suffix = field === 'imagen_principal_webp' ? '-webp' : '-main';
      const target = `/static/img/productos/${slug}${suffix}${ext}`;
      const localFile = path.join(process.cwd(), target.replace(/^\//, '').replace(/\//g, path.sep));
      const localExists = fs.existsSync(localFile) ? 'yes' : 'no';

      rows.push([
        id,
        slug,
        value,
        target,
        field,
        hostname,
        localExists
      ]);

      hostCount.set(hostname, (hostCount.get(hostname) || 0) + 1);
    }
  }

  ensureDir(outDir);
  const csvPath = path.join(outDir, 'external-images-migration.csv');
  writeCsv(csvPath, [
    ['id', 'slug', 'url_actual', 'url_destino_local', 'campo', 'dominio', 'destino_ya_existe'],
    ...rows
  ]);

  const summaryRows = Array.from(hostCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([host, count]) => [host, String(count)]);
  const summaryPath = path.join(outDir, 'external-images-by-domain.csv');
  writeCsv(summaryPath, [['dominio', 'cantidad_campos_externos'], ...summaryRows]);

  console.log(`Catalogo analizado: ${inputPath}`);
  console.log(`Productos totales: ${data.length}`);
  console.log(`Campos de imagen externos: ${rows.length}`);
  console.log(`CSV migracion: ${csvPath}`);
  console.log(`CSV dominios: ${summaryPath}`);

  if (!rows.length) {
    console.log('No se encontraron imagenes externas.');
    return;
  }

  console.log('\nTop dominios externos:');
  for (const [host, count] of summaryRows.slice(0, 10)) {
    console.log(`- ${host}: ${count}`);
  }
}

main();
