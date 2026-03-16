#!/usr/bin/env node
/*
 * Crawl/index hygiene audit for the main static site.
 *
 * Checks:
 * - Broken internal HTML links from indexable pages.
 * - Internal links from indexable pages pointing to noindex/redirect-bridge pages.
 * - Canonical issues in indexable pages (missing/relative/wrong host/targeting noindex).
 *
 * Usage: node scripts/audit-crawl-index-hygiene.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SITE_HOST = 'naturalbe.com.co';
const SITE_ORIGIN = `https://${SITE_HOST}`;
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  '.tmp',
  '.catalog_cache',
  '__pycache__',
  'reports',
  'cache_images',
  'cache_images_v2',
  'cache_images_v3',
  'cache_images_v4',
  'cache_images_v5',
  'cache_images_v6',
  'cache_images_v7',
  'cache_images_v8',
  'cache_images_final',
  'cache_images_final_v2'
]);
const MAIN_SITE_EXTRA_SKIP = new Set(['academia', 'apps', 'play']);

function walkHtml(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkHtml(full, out);
      continue;
    }
    if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith('.html') &&
      !/\.report\.html$/i.test(entry.name)
    ) {
      out.push(full);
    }
  }
}

function stripUrlNoise(value) {
  return String(value || '').split('#')[0].split('?')[0].trim();
}

function fileRelToWebPath(relFile) {
  const rel = relFile.replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  return `/${rel}`;
}

function webPathToFile(webPath) {
  const clean = stripUrlNoise(webPath);
  if (!clean || clean === '/') return path.join(ROOT, 'index.html');
  if (!clean.endsWith('.html')) return null;
  return path.join(ROOT, clean.slice(1).replace(/\//g, path.sep));
}

function extractMetaRobots(html) {
  const m = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["']/i);
  return m ? String(m[1]).trim() : '';
}

function hasNoindex(metaRobots) {
  return /(^|[\s,])noindex([\s,]|$)/i.test(metaRobots || '');
}

function extractRefreshTarget(html) {
  const m = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]*content=["'][^"']*url\s*=\s*([^"']+)["']/i);
  return m ? String(m[1]).trim() : '';
}

function extractCanonical(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  return m ? String(m[1]).trim() : '';
}

function supportsDynamicProductCanonical(page) {
  if (!page || page.rel !== 'product.html') return false;
  const html = fs.readFileSync(page.filePath, 'utf8');
  return (
    /\/producto\/\$\{encodeURIComponent\(slug\)\}/.test(html) &&
    /link\[rel="canonical"\]/.test(html)
  );
}

function extractHrefs(html) {
  const out = [];
  const re = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) out.push(String(m[1]).trim());
  return out;
}

function normalizeInternalHref(href, sourceWebPath) {
  const raw = String(href || '').trim();
  if (!raw) return '';
  if (/^(mailto:|tel:|javascript:|data:)/i.test(raw)) return '';
  if (raw.startsWith('#')) return '';

  let pathOnly = '';
  if (/^https?:\/\//i.test(raw)) {
    let u;
    try {
      u = new URL(raw);
    } catch {
      return '';
    }
    if (u.hostname !== SITE_HOST) return '';
    pathOnly = `${u.pathname || '/'}${u.search || ''}${u.hash || ''}`;
  } else if (raw.startsWith('/')) {
    pathOnly = raw;
  } else {
    const sourceDir = sourceWebPath.endsWith('/')
      ? sourceWebPath
      : sourceWebPath.substring(0, sourceWebPath.lastIndexOf('/') + 1) || '/';
    const base = new URL(`${SITE_ORIGIN}${sourceDir}`);
    pathOnly = new URL(raw, base).pathname;
  }

  const normalized = stripUrlNoise(pathOnly) || '/';
  if (normalized === '/index.html') return '/';
  return normalized;
}

function isKnownRoutedPath(webPath) {
  return /^\/(producto|categoria)\//i.test(webPath);
}

function main() {
  const mainSiteOnly = process.argv.includes('--main-site');
  if (mainSiteOnly) {
    for (const dir of MAIN_SITE_EXTRA_SKIP) SKIP_DIRS.add(dir);
  }

  const files = [];
  walkHtml(ROOT, files);
  files.sort();

  const pages = new Map();
  for (const filePath of files) {
    const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
    const webPath = fileRelToWebPath(rel);
    const html = fs.readFileSync(filePath, 'utf8');
    const robots = extractMetaRobots(html);
    const refresh = extractRefreshTarget(html);
    const canonical = extractCanonical(html);
    pages.set(webPath, {
      rel,
      filePath,
      robots,
      noindex: hasNoindex(robots),
      refresh,
      canonical,
      hrefs: extractHrefs(html)
    });
  }

  const issues = [];
  const warnings = [];
  const indexablePages = [...pages.entries()].filter(([, p]) => !p.noindex && !p.refresh);

  for (const [webPath, page] of indexablePages) {
    if (!page.canonical) {
      if (!supportsDynamicProductCanonical(page)) {
        issues.push({ type: 'missing-canonical', file: page.rel, detail: webPath });
      }
    } else {
      let cu;
      try {
        cu = new URL(page.canonical, SITE_ORIGIN);
      } catch {
        issues.push({ type: 'invalid-canonical-url', file: page.rel, detail: page.canonical });
        cu = null;
      }

      if (cu) {
        if (cu.hostname !== SITE_HOST) {
          issues.push({ type: 'canonical-wrong-host', file: page.rel, detail: page.canonical });
        }
        if (!/^https?:$/.test(cu.protocol)) {
          issues.push({ type: 'canonical-invalid-protocol', file: page.rel, detail: page.canonical });
        }
        const cPath = stripUrlNoise(cu.pathname || '/');
        if (cPath.endsWith('.html')) {
          const target = pages.get(cPath);
          if (target && (target.noindex || target.refresh)) {
            issues.push({
              type: 'canonical-points-noindex-or-bridge',
              file: page.rel,
              detail: `${page.canonical} -> ${target.rel}`
            });
          }
        }
      }
    }

    for (const href of page.hrefs) {
      const targetPath = normalizeInternalHref(href, webPath);
      if (!targetPath) continue;
      if (isKnownRoutedPath(targetPath)) continue;

      if (targetPath.endsWith('.html') || targetPath === '/') {
        const target = pages.get(targetPath);
        if (!target) {
          issues.push({
            type: 'broken-internal-link',
            file: page.rel,
            detail: `${href} -> ${targetPath}`
          });
          continue;
        }
        if (target.noindex) {
          warnings.push({
            type: 'link-to-noindex-page',
            file: page.rel,
            detail: `${href} -> ${target.rel}`
          });
        } else if (target.refresh) {
          issues.push({
            type: 'link-to-redirect-bridge',
            file: page.rel,
            detail: `${href} -> ${target.rel}`
          });
        }
      } else {
        const targetFile = webPathToFile(targetPath);
        if (targetFile && !fs.existsSync(targetFile)) {
          issues.push({
            type: 'broken-internal-link',
            file: page.rel,
            detail: `${href} -> ${targetPath}`
          });
        }
      }
    }
  }

  if (!issues.length && !warnings.length) {
    console.log('[audit-crawl-index-hygiene] OK: sin hallazgos criticos.');
    return;
  }

  if (issues.length) {
    console.error(`[audit-crawl-index-hygiene] FAIL: ${issues.length} hallazgo(s) critico(s).`);
    for (const issue of issues.slice(0, 120)) {
      console.error(`- ${issue.type} | ${issue.file} | ${issue.detail}`);
    }
    if (issues.length > 120) {
      console.error(`... y ${issues.length - 120} hallazgos criticos mas`);
    }
  } else {
    console.log('[audit-crawl-index-hygiene] OK: sin hallazgos criticos.');
  }

  if (warnings.length) {
    console.log(`[audit-crawl-index-hygiene] WARN: ${warnings.length} enlace(s) hacia URLs noindex.`);
    for (const warning of warnings.slice(0, 60)) {
      console.log(`- ${warning.type} | ${warning.file} | ${warning.detail}`);
    }
    if (warnings.length > 60) {
      console.log(`... y ${warnings.length - 60} advertencias mas`);
    }
  }

  if (issues.length) process.exit(1);
}

main();
