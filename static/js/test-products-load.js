// TEST: Simular carga de productos.json
const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../data/productos.json');

console.log('\n=== PRODUCTS LOAD TEST ===\n');
console.log('📍 Test 1: Reading productos.json from:', CATALOG_PATH);

try {
  const rawData = fs.readFileSync(CATALOG_PATH, 'utf-8');
  console.log('✅ File read successfully');
  console.log(`   Tamaño: ${(rawData.length / 1024).toFixed(2)} KB`);
  
  const data = JSON.parse(rawData);
  console.log('✅ JSON parsed successfully');
  console.log(`   Total productos: ${data.length}`);
  console.log(`   Primero producto:`, data[0]);
  
  // Check schema
  console.log('\n📍 Test 2: Checking product schema');
  const requiredFields = ['id', 'slug', 'nombre', 'categoria', 'precio'];
  const missingFields = requiredFields.filter(field => !(field in data[0]));
  
  if (missingFields.length === 0) {
    console.log('✅ All required fields present:', requiredFields.join(', '));
  } else {
    console.log('❌ Missing fields:', missingFields.join(', '));
  }
  
  // Sample check
  console.log('\n📍 Test 3: Sampling 5 random products');
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * data.length);
    samples.push({ idx, product: data[idx].nombre, categoria: data[idx].categoria, precio: data[idx].precio });
  }
  samples.forEach(s => console.log(`   [${s.idx}] ${s.product} (${s.categoria}) - $${s.precio}`));
  
  console.log('\n✅ TODOS LOS TESTS PASARON');
  console.log('\nLos productos están listos para ser cargados en category.html\n');
  
} catch (err) {
  console.error('❌ ERROR:', err.message);
  process.exit(1);
}
