#!/usr/bin/env node
// TEST: Verificar orden de carga de scripts en category.html

const fs = require('fs');
const path = require('path');
const regex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;

const filePath = path.join(__dirname, '../../category.html');
const content = fs.readFileSync(filePath, 'utf-8');

const scripts = [];
let match;
while ((match = regex.exec(content)) !== null) {
  scripts.push(match[1]);
}

console.log('\n=== SCRIPT LOAD ORDER ANALYSIS ===\n');
console.log('📋 Scripts encontrados en category.html:\n');

scripts.forEach((src, idx) => {
  const isDefer = content.includes(`src="${src}"`) && content.substring(content.indexOf(`src="${src}"`), content.indexOf(`src="${src}"`) + 200).includes('defer');
  const isAsync = content.includes(`src="${src}"`) && content.substring(content.indexOf(`src="${src}"`), content.indexOf(`src="${src}"`) + 200).includes('async');
  
  const type = isDefer ? '⏳ DEFER' : (isAsync ? '⚡ ASYNC' : '🔴 BLOCKING');
  const status = src.includes('products-data') ? '📦 CRITICAL' : 
                 src.includes('cart') ? '🛒 IMPORTANT' : 
                 src.includes('diagnostic') ? '🔍 DEBUG' : '📄 OTHER';
  
  console.log(`${idx + 1}. ${type.padEnd(12)} | ${status.padEnd(12)} | ${src}`);
});

console.log('\n✅ Orden esperado:');
console.log('   1. products-data.js (defer) - Carga productos');
console.log('   2. cart.js (defer) - Usa productos');
console.log('   3. webp-support.js (defer) - Soporte de imagen');
console.log('   4. marketplace.js (defer) - Utilidades');
console.log('   5. category-search-fix.js (defer) - Optimización de búsqueda');
console.log('   6. diagnostic-check.js (defer) - Debug (REMOVER EN PRODUCCIÓN)');

console.log('\n📌 Línea temporal de ejecución:');
console.log('   1. HTML parsea y crea DOM');
console.log('   2. Scripts inline ejecutan (si los hay)');
console.log('   3. Scripts defer cargan en paralelo');
console.log('   4. DOMContentLoaded dispara');
console.log('   5. Scripts defer ejecutan EN ORDEN');
console.log('   6. Evento ProductsDataReady dispara (de products-data.js)');
console.log('   7. initCatalog() se ejecuta');

console.log('\n✅ TEST COMPLETADO\n');
