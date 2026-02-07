// Test de la función de búsqueda corregida

// Función normalizeText
function normalizeText(text) {
    return String(text || '')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

// Función matchesQuerySmart
function matchesQuerySmart(product, query) {
    if (!query || !query.trim()) return true;
    
    const normalizedQuery = normalizeText(query);
    
    const searchFields = [
        product.nombre || product.name || '',
        product.marca || product.brand || '',
        product.categoria || product.category || '',
        product.subcategoria || product.subcategory || '',
        product.descripcion_corta || product.description || '',
        product.seo_title || '',
        product.seo_description || '',
        ...(product.tags || [])
    ];
    
    return searchFields.some(field => {
        const normalizedField = normalizeText(field);
        return normalizedField.includes(normalizedQuery);
    });
}

// Productos de prueba
const testProducts = [
    {
        nombre: "Colágeno Hidrolizado",
        marca: "Natural Be",
        categoria: "colageno",
        descripcion_corta: "Para piel y articulaciones",
        tags: ["piel", "belleza", "articulaciones"]
    },
    {
        nombre: "Vitamina C 1000mg",
        marca: "Healthy America", 
        categoria: "vitaminas",
        descripcion_corta: "Vitamina C para inmunidad",
        tags: ["inmunidad", "antioxidante"]
    },
    {
        nombre: "Omega 3 Fish Oil",
        marca: "Nature's Bounty",
        categoria: "omega",
        descripcion_corta: "Ácidos grasos esenciales",
        tags: ["corazón", "cerebro"]
    },
    {
        nombre: "Proteína Whey",
        marca: "Healthy Sports",
        categoria: "proteinas",
        descripcion_corta: "Proteína de suero de leche",
        tags: ["músculo", "deporte"]
    }
];

// Pruebas
console.log("🧪 PRUEBAS DE BÚSQUEDA:");
console.log("======================");

const testCases = [
    "colageno",      // debe encontrar "Colágeno Hidrolizado"
    "vitamina",      // debe encontrar "Vitamina C 1000mg"
    "OMEGA",         // debe encontrar "Omega 3 Fish Oil"
    "proteina",      // debe encontrar "Proteína Whey"
    "natural",       // debe encontrar productos de marca "Natural Be"
    "inmunidad",     // debe encontrar por tag
    "piel"           // debe encontrar por tag
];

testCases.forEach(query => {
    console.log(`\n🔍 Búsqueda: "${query}"`);
    const results = testProducts.filter(p => matchesQuerySmart(p, query));
    
    if (results.length > 0) {
        console.log(`✅ Encontrados ${results.length} productos:`);
        results.forEach(p => console.log(`   - ${p.nombre}`));
    } else {
        console.log(`❌ No se encontraron productos`);
    }
});

console.log("\n🎯 PRUEBA DE NORMALIZACIÓN:");
console.log("===========================");
console.log(`"Colágeno" → "${normalizeText("Colágeno")}"`);
console.log(`"Vitamína" → "${normalizeText("Vitamína")}"`);
console.log(`"PROTEÍNA" → "${normalizeText("PROTEÍNA")}"`);
console.log(`"Omega-3" → "${normalizeText("Omega-3")}"`);