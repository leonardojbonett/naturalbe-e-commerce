#!/usr/bin/env node
/*
 * Improve SEO title/description for product catalogs.
 * Usage:
 *   node scripts/improve-product-seo-copy.js
 *   node scripts/improve-product-seo-copy.js --mode both --apply commercial
 *   node scripts/improve-product-seo-copy.js static/data/productos.json productos_enriquecido.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DEFAULT_FILES = [
  path.join(ROOT, 'static', 'data', 'productos.json'),
  path.join(ROOT, 'productos_enriquecido.json')
];

const GENERIC_DESC_RE = /^suplemento\s+para\s+tu\s+rutina\s+diaria/i;
const MAX_TITLE = 85;
const MIN_DESC = 80;
const MAX_DESC = 220;
const ALWAYS_REWRITE = true;

const CATEGORY_HINTS = {
  suplementos: {
    keyword: 'suplemento dietario',
    intent: 'para bienestar general'
  },
  vitaminas: {
    keyword: 'vitaminas',
    intent: 'para complementar tu nutricion diaria'
  },
  cuidado_personal: {
    keyword: 'cuidado personal',
    intent: 'para tu rutina diaria de cuidado'
  },
  digestivos: {
    keyword: 'digestivo',
    intent: 'para apoyar el bienestar digestivo'
  },
  minerales: {
    keyword: 'minerales',
    intent: 'para equilibrio nutricional diario'
  },
  nutricion_deportiva: {
    keyword: 'nutricion deportiva',
    intent: 'para rendimiento y recuperacion'
  },
  nutricion: {
    keyword: 'complemento nutricional',
    intent: 'para apoyar tu alimentacion'
  },
  'suplementos dietarios': {
    keyword: 'suplemento dietario',
    intent: 'para bienestar general'
  }
};

function norm(v) {
  return String(v || '').replace(/\s+/g, ' ').trim();
}

function toSentence(v) {
  const s = norm(v).replace(/\.+$/, '');
  return s ? `${s}.` : '';
}

function stripHtml(v) {
  return norm(v).replace(/<[^>]+>/g, '');
}

function truncateAtWord(text, maxLen) {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, Math.max(0, maxLen - 3));
  const idx = cut.lastIndexOf(' ');
  const out = idx > 40 ? cut.slice(0, idx) : cut;
  return `${out}...`;
}

function cleanName(name) {
  return norm(name)
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normCategory(v) {
  return norm(v).toLowerCase().replace(/\s+/g, '_');
}

function detectFocusKeyword(product) {
  const blob = [product.nombre, product.name, product.categoria, product.subcategoria, product.presentacion, product.formato]
    .map(norm)
    .join(' ')
    .toLowerCase();
  const pairs = [
    ['omega', 'omega 3'],
    ['colageno', 'colageno'],
    ['creatina', 'creatina'],
    ['protein', 'proteina'],
    ['whey', 'proteina whey'],
    ['magnesio', 'magnesio'],
    ['vitamina c', 'vitamina c'],
    ['vitamina d', 'vitamina d'],
    ['zinc', 'zinc'],
    ['biotina', 'biotina'],
    ['probiot', 'probióticos']
  ];
  for (const [needle, label] of pairs) {
    if (blob.includes(needle)) return label;
  }
  return '';
}

function titleIncludes(title, token) {
  if (!token) return false;
  return title.toLowerCase().includes(token.toLowerCase());
}

function buildSeoTitle(product) {
  const brand = norm(product.marca || product.brand || 'Natural Be');
  const name = cleanName(product.nombre || product.name || 'Producto');
  const pres = norm(product.presentacion || product.presentation || '');

  let base = name;
  if (brand && !titleIncludes(name, brand)) {
    base = `${brand} ${name}`;
  }
  if (pres && !titleIncludes(base, pres)) {
    base = `${base} ${pres}`;
  }

  const withSuffix = `${base} | Natural Be`;
  if (withSuffix.length <= MAX_TITLE) return withSuffix;

  let compact = brand && !titleIncludes(name, brand) ? `${brand} ${name}` : name;
  compact = `${compact} | Natural Be`;
  if (compact.length <= MAX_TITLE) return compact;

  return truncateAtWord(compact, MAX_TITLE);
}

function firstBenefit(product) {
  const bullets = Array.isArray(product.beneficios_bullet)
    ? product.beneficios_bullet
    : Array.isArray(product.short_benefits)
      ? product.short_benefits
      : [];
  for (const raw of bullets) {
    const clean = toSentence(stripHtml(raw).replace(/^[-*•]\s*/, ''));
    if (clean.length >= 15) return clean;
  }
  return '';
}

function priceCop(product) {
  const raw = product.precio_oferta ?? product.sale_price_cop ?? product.precio ?? product.price_cop ?? product.price;
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return '';
  const rounded = Math.round(num);
  return `$${rounded.toLocaleString('es-CO')} COP`;
}

function buildSeoDescription(product) {
  const name = cleanName(product.nombre || product.name || 'producto');
  const brand = norm(product.marca || product.brand || 'Natural Be');
  const pres = norm(product.presentacion || product.presentation || '');
  const benefit = firstBenefit(product);
  const price = priceCop(product);
  const cat = normCategory(product.categoria || product.category || '');
  const hint = CATEGORY_HINTS[cat] || CATEGORY_HINTS.suplementos;
  const focus = detectFocusKeyword(product);

  const introBits = [];
  introBits.push(`Compra ${name}`);
  if (brand && !titleIncludes(name, brand)) introBits.push(`de ${brand}`);
  if (pres) introBits.push(`en ${pres}`);
  let desc = `${introBits.join(' ')} en Colombia.`;
  desc += ` ${hint.keyword.charAt(0).toUpperCase()}${hint.keyword.slice(1)} ${hint.intent}.`;
  if (focus) desc += ` Ideal si buscas ${focus}.`;

  if (benefit) {
    desc += ` ${benefit}`;
  } else {
    desc += ' Ideal para complementar tu bienestar diario.';
  }

  if (price) {
    desc += ` Precio ${price}.`;
  }

  desc += ' Envío nacional rápido y compra segura en Natural Be.';

  desc = norm(desc);
  if (desc.length < MIN_DESC) {
    desc += ' Suplemento dietario. No es un medicamento.';
  }

  if (desc.length > MAX_DESC) {
    desc = truncateAtWord(desc, MAX_DESC);
    if (!/[.!?]$/.test(desc)) desc += '.';
  }
  return desc;
}

function buildCommercialDescription(product) {
  const name = cleanName(product.nombre || product.name || 'producto');
  const brand = norm(product.marca || product.brand || 'Natural Be');
  const pres = norm(product.presentacion || product.presentation || '');
  const benefit = firstBenefit(product);
  const price = priceCop(product);
  const cat = normCategory(product.categoria || product.category || '');
  const hint = CATEGORY_HINTS[cat] || CATEGORY_HINTS.suplementos;
  const focus = detectFocusKeyword(product);

  const introBits = [];
  introBits.push(`Compra ${name}`);
  if (brand && !titleIncludes(name, brand)) introBits.push(`de ${brand}`);
  if (pres) introBits.push(`en ${pres}`);
  let desc = `${introBits.join(' ')} en Colombia.`;
  desc += ` ${hint.keyword.charAt(0).toUpperCase()}${hint.keyword.slice(1)} ${hint.intent}.`;
  if (focus) desc += ` Ideal si buscas ${focus}.`;
  if (benefit) desc += ` ${benefit}`;
  if (price) desc += ` Precio ${price}.`;
  desc += ' Envío nacional rápido y compra segura en Natural Be.';

  desc = norm(desc);
  if (desc.length < MIN_DESC) desc += ' Suplemento dietario. No es un medicamento.';
  if (desc.length > MAX_DESC) {
    desc = truncateAtWord(desc, MAX_DESC);
    if (!/[.!?]$/.test(desc)) desc += '.';
  }
  return desc;
}

function buildTechnicalDescription(product) {
  const name = cleanName(product.nombre || product.name || 'producto');
  const brand = norm(product.marca || product.brand || 'Natural Be');
  const pres = norm(product.presentacion || product.presentation || '');
  const cat = normCategory(product.categoria || product.category || '');
  const hint = CATEGORY_HINTS[cat] || CATEGORY_HINTS.suplementos;
  const focus = detectFocusKeyword(product);
  const benefit = firstBenefit(product);

  const parts = [];
  parts.push(`${name}${brand && !titleIncludes(name, brand) ? ` de ${brand}` : ''} en ${pres || 'presentación estándar'}.`);
  parts.push(`Producto de ${hint.keyword} ${hint.intent}.`);
  if (focus) parts.push(`Enfoque de uso: ${focus}.`);
  if (benefit) parts.push(benefit);
  if (product.dosis_recomendada) parts.push(`Uso sugerido: ${toSentence(stripHtml(product.dosis_recomendada))}`);
  parts.push('Suplemento dietario. No es un medicamento. Compra online en Natural Be Colombia.');

  let desc = norm(parts.join(' '));
  if (desc.length < MIN_DESC) {
    desc += ' Consulta la etiqueta para información nutricional y recomendaciones de consumo.';
  }
  if (desc.length > MAX_DESC) {
    desc = truncateAtWord(desc, MAX_DESC);
    if (!/[.!?]$/.test(desc)) desc += '.';
  }
  return desc;
}

function shouldRefreshDescription(product) {
  if (ALWAYS_REWRITE) return true;
  const current = norm(product.seo_description);
  if (!current) return true;
  if (GENERIC_DESC_RE.test(current)) return true;
  if (current.length < MIN_DESC || current.length > MAX_DESC) return true;
  const cat = normCategory(product.categoria || product.category || '');
  const hint = CATEGORY_HINTS[cat] || CATEGORY_HINTS.suplementos;
  if (!current.toLowerCase().includes(hint.keyword.toLowerCase())) return true;
  return false;
}

function improveFile(filePath) {
  const options = global.__NB_OPTIONS || { mode: 'both', apply: 'commercial' };
  const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(rows)) {
    throw new Error(`Formato invalido en ${filePath}: se esperaba un array`);
  }

  let updatedTitles = 0;
  let updatedDescriptions = 0;
  let updatedCommercial = 0;
  let updatedTechnical = 0;

  const out = rows.map((p) => {
    const next = { ...p };

    const currentTitle = norm(next.seo_title);
    if (!currentTitle || currentTitle.length > MAX_TITLE || /\(\s*\)/.test(currentTitle)) {
      next.seo_title = buildSeoTitle(next);
      updatedTitles += 1;
    }

    if (shouldRefreshDescription(next) || options.mode !== 'single') {
      const commercial = buildCommercialDescription(next);
      const technical = buildTechnicalDescription(next);

      if (options.mode === 'both') {
        next.seo_description_comercial = commercial;
        next.seo_description_tecnica = technical;
        updatedCommercial += 1;
        updatedTechnical += 1;
      }

      if (options.mode === 'single') {
        next.seo_description = options.apply === 'technical' ? technical : commercial;
        updatedDescriptions += 1;
      } else {
        next.seo_description = options.apply === 'technical' ? technical : commercial;
        updatedDescriptions += 1;
      }
    }

    return next;
  });

  fs.writeFileSync(filePath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  return { total: out.length, updatedTitles, updatedDescriptions, updatedCommercial, updatedTechnical };
}

function main() {
  const args = process.argv.slice(2);
  let mode = 'both';
  let apply = 'commercial';
  const files = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--mode') {
      mode = args[i + 1] || mode;
      i += 1;
      continue;
    }
    if (arg === '--apply') {
      apply = args[i + 1] || apply;
      i += 1;
      continue;
    }
    files.push(path.resolve(ROOT, arg));
  }

  if (!['both', 'single'].includes(mode)) {
    console.error(`--mode invalido: ${mode} (usa both|single)`);
    process.exit(1);
  }
  if (!['commercial', 'technical'].includes(apply)) {
    console.error(`--apply invalido: ${apply} (usa commercial|technical)`);
    process.exit(1);
  }

  const finalFiles = files.length ? files : DEFAULT_FILES;
  global.__NB_OPTIONS = { mode, apply };

  let touched = 0;
  for (const filePath of finalFiles) {
    if (!fs.existsSync(filePath)) {
      console.warn(`[SKIP] No existe: ${filePath}`);
      continue;
    }
    const res = improveFile(filePath);
    touched += 1;
    console.log(
      `[OK] ${filePath} -> total=${res.total}, titles_updated=${res.updatedTitles}, descriptions_updated=${res.updatedDescriptions}, comercial=${res.updatedCommercial}, tecnica=${res.updatedTechnical}, apply=${apply}, mode=${mode}`
    );
  }

  if (!touched) {
    console.error('No se proceso ningun archivo');
    process.exit(1);
  }
}

main();
