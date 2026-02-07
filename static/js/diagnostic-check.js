// Diagnóstico - ejecutar en consola del navegador
window.diagnosticCheck = function() {
  console.clear();
  console.log('%c=== DIAGNOSTIC CHECK ===', 'background: #0f3c24; color: white; padding: 10px; font-size: 14px; font-weight: bold;');
  
  // 1. Verificar loadProductsData
  console.log('\n📍 1. loadProductsData:', typeof window.loadProductsData === 'function' ? '✅ EXISTE' : '❌ NO EXISTE');
  
  // 2. Verificar ALL_PRODUCTS
  console.log('📍 2. window.ALL_PRODUCTS:', window.ALL_PRODUCTS ? `✅ EXISTE (${window.ALL_PRODUCTS.length} productos)` : '❌ NO EXISTE');
  
  // 3. Verificar grid
  const grid = document.getElementById('plpGrid');
  console.log('📍 3. Grid (#plpGrid):', grid ? `✅ EXISTE (${grid.children.length} items)` : '❌ NO EXISTE');
  
  // 4. Verificar filter elements
  const filterEls = {
    search: document.getElementById('filterSearch'),
    category: document.getElementById('filterCategory'),
    objective: document.getElementById('filterObjective'),
    price: document.getElementById('filterPrice'),
    sale: document.getElementById('filterSale'),
    popular: document.getElementById('filterPopular'),
    isNew: document.getElementById('filterNew'),
    sort: document.getElementById('sortSelect'),
    reset: document.getElementById('filterReset')
  };
  
  console.log('📍 4. Filter Elements:', Object.values(filterEls).filter(el => el).length + '/' + Object.keys(filterEls).length + ' presentes');
  Object.entries(filterEls).forEach(([name, el]) => {
    console.log(`   - ${name}: ${el ? '✅' : '❌'}`);
  });
  
  // 5. Verificar productos.json
  console.log('\n📍 5. Intentando cargar productos.json...');
  fetch('./static/data/productos.json')
    .then(r => r.json())
    .then(data => {
      console.log(`   ✅ JSON válido: ${data.length || 'array'} items`);
      if (data.length) {
        console.log(`   Primera producto:`, data[0]);
      }
    })
    .catch(err => console.log(`   ❌ Error: ${err.message}`));
  
  // 6. Verificar funciones de rendering
  console.log('\n📍 6. Funciones de rendering:');
  console.log('   - window.renderProducts:', typeof window.renderProducts === 'function' ? '✅' : '❌');
  console.log('   - window.applyFilters:', typeof window.applyFilters === 'function' ? '✅' : '❌');
  console.log('   - window.bindFilters:', typeof window.bindFilters === 'function' ? '✅' : '❌');
  console.log('   - window.matchesQuery:', typeof window.matchesQuery === 'function' ? '✅' : '❌');
  
  // 7. Verificar event listeners
  console.log('\n📍 7. Event listeners registrados:', document._getEventListeners ? 'info disponible' : 'usar DevTools');
  
  console.log('\n%c=== FIN DIAGNOSTIC ===', 'background: #0f3c24; color: white; padding: 10px; font-size: 14px; font-weight: bold;');
};

// Auto-ejecutar después de que todo cargue
window.addEventListener('load', () => {
  setTimeout(() => {
    console.log('%c[Auto-diagnostic] Ejecutando verificación...', 'color: blue');
    window.diagnosticCheck();
  }, 500);
});

console.log('%c[Diagnostic Loaded] Ejecuta: window.diagnosticCheck()', 'color: green');
