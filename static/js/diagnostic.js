// Script de diagnóstico para verificar carga de productos
(function() {
  console.log('🔍 DIAGNÓSTICO DE PRODUCTOS');
  console.log('========================');
  
  // Verificar si products-data.js cargó
  console.log('1️⃣ loadProductsData existe:', typeof window.loadProductsData === 'function' ? '✓' : '✗');
  console.log('2️⃣ ALL_PRODUCTS existe:', typeof window.ALL_PRODUCTS !== 'undefined' ? '✓' : '✗');
  console.log('3️⃣ ALL_PRODUCTS es array:', Array.isArray(window.ALL_PRODUCTS) ? '✓' : '✗');
  console.log('4️⃣ ALL_PRODUCTS count:', window.ALL_PRODUCTS ? window.ALL_PRODUCTS.length : 'N/A');
  
  // Verificar categorías disponibles
  if (window.ALL_PRODUCTS && window.ALL_PRODUCTS.length > 0) {
    const categories = [...new Set(window.ALL_PRODUCTS.map(p => p.categoria))];
    console.log('5️⃣ Categorías:', categories);
  }
  
  // Verificar grid
  const grid = document.getElementById('plpGrid');
  console.log('6️⃣ Grid existe:', grid ? '✓' : '✗');
  console.log('7️⃣ Grid tiene productos:', grid ? grid.querySelectorAll('.product-card').length : 'N/A');
  
  // Verificar filtros
  const filterSearch = document.getElementById('filterSearch');
  console.log('8️⃣ Filtro de búsqueda existe:', filterSearch ? '✓' : '✗');
  
  // Ver si renderProducts existe
  console.log('9️⃣ renderProducts existe:', typeof window.renderProducts === 'function' ? '✓' : '✗');
})();
