// ========================================
// NATURAL BE - DIAGNÓSTICO CSP Y SERVICIOS
// ========================================
// Copia este código completo y pégalo en la consola del navegador (F12)

(function() {
    console.log('%c🔍 INICIANDO DIAGNÓSTICO DE NATURAL BE', 'color: #2d8659; font-size: 16px; font-weight: bold;');
    console.log('='.repeat(60));
    
    const results = {
        csp: null,
        services: {},
        errors: [],
        warnings: []
    };
    
    // 1. VERIFICAR CSP
    console.log('\n%c1️⃣ VERIFICANDO CONTENT SECURITY POLICY', 'color: #4a90e2; font-weight: bold;');
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
        results.csp = cspMeta.content;
        console.log('✅ CSP encontrado en meta tag');
        
        // Verificar dominios críticos
        const criticalDomains = {
            'UserWay': 'cdn.userway.org',
            'Tawk.to': 'embed.tawk.to',
            'Facebook': 'www.facebook.com',
            'Wompi': 'checkout.wompi.co'
        };
        
        console.log('\n📋 Verificando dominios en CSP:');
        for (const [service, domain] of Object.entries(criticalDomains)) {
            const hasIt = results.csp.includes(domain);
            console.log(`  ${hasIt ? '✅' : '❌'} ${service}: ${domain}`);
            if (!hasIt) {
                results.errors.push(`CSP no incluye ${service} (${domain})`);
            }
        }
    } else {
        console.log('⚠️ No se encontró CSP en meta tag');
        results.warnings.push('CSP no configurado en meta tag');
    }
    
    // 2. VERIFICAR SERVICIOS CARGADOS
    console.log('\n%c2️⃣ VERIFICANDO SERVICIOS EXTERNOS', 'color: #4a90e2; font-weight: bold;');
    
    const services = {
        'Google Analytics': () => typeof window.gtag !== 'undefined' || typeof window.ga !== 'undefined',
        'Google Tag Manager': () => typeof window.google_tag_manager !== 'undefined',
        'Facebook Pixel': () => typeof window.fbq !== 'undefined',
        'UserWay Widget': () => typeof window.UserWay !== 'undefined',
        'Tawk.to Chat': () => typeof window.Tawk_API !== 'undefined',
        'Wompi Checkout': () => typeof window.WidgetCheckout !== 'undefined',
        'PRODUCTS Data': () => typeof window.PRODUCTS !== 'undefined' && Array.isArray(window.PRODUCTS),
        'Cart System': () => typeof window.cart !== 'undefined'
    };
    
    for (const [service, checker] of Object.entries(services)) {
        const loaded = checker();
        results.services[service] = loaded;
        console.log(`  ${loaded ? '✅' : '❌'} ${service}`);
        if (!loaded) {
            results.errors.push(`${service} no cargado`);
        }
    }
    
    // 3. VERIFICAR ERRORES EN CONSOLA
    console.log('\n%c3️⃣ ERRORES CSP EN CONSOLA', 'color: #4a90e2; font-weight: bold;');
    console.log('⚠️ Revisa arriba si hay errores que contengan "Content Security Policy"');
    
    // 4. VERIFICAR PRODUCTOS
    console.log('\n%c4️⃣ VERIFICANDO CATÁLOGO DE PRODUCTOS', 'color: #4a90e2; font-weight: bold;');
    if (typeof window.PRODUCTS !== 'undefined') {
        console.log(`  ✅ ${window.PRODUCTS.length} productos cargados`);
        
        // Verificar estructura
        if (window.PRODUCTS.length > 0) {
            const sample = window.PRODUCTS[0];
            const requiredFields = ['id', 'nombre', 'precio', 'categoria'];
            const missingFields = requiredFields.filter(field => !(field in sample));
            
            if (missingFields.length > 0) {
                console.log(`  ⚠️ Campos faltantes en productos: ${missingFields.join(', ')}`);
                results.warnings.push(`Productos sin campos: ${missingFields.join(', ')}`);
            } else {
                console.log('  ✅ Estructura de productos correcta');
            }
        }
    } else {
        console.log('  ❌ Productos no cargados');
        results.errors.push('PRODUCTS no definido');
    }
    
    // 5. VERIFICAR FUNCIONES DE BÚSQUEDA
    console.log('\n%c5️⃣ VERIFICANDO SISTEMA DE BÚSQUEDA', 'color: #4a90e2; font-weight: bold;');
    
    const searchFunctions = {
        'filterProductsAdvanced': typeof window.filterProductsAdvanced === 'function',
        'normalizeText': typeof window.normalizeText === 'function',
        'matchesQuerySmart': typeof window.matchesQuerySmart === 'function',
        'renderProducts': typeof window.renderProducts === 'function'
    };
    
    for (const [func, exists] of Object.entries(searchFunctions)) {
        console.log(`  ${exists ? '✅' : '❌'} ${func}()`);
        if (!exists) {
            results.warnings.push(`Función ${func} no disponible`);
        }
    }
    
    // 6. TEST DE BÚSQUEDA
    if (searchFunctions.normalizeText && searchFunctions.matchesQuerySmart) {
        console.log('\n%c6️⃣ TEST DE BÚSQUEDA (TILDES)', 'color: #4a90e2; font-weight: bold;');
        
        const testProduct = {
            nombre: 'Colágeno Hidrolizado',
            marca: 'Nature\'s Bounty',
            categoria: 'colageno'
        };
        
        const testQueries = ['colageno', 'colágeno', 'COLAGENO', 'Colágeno'];
        
        testQueries.forEach(query => {
            const matches = window.matchesQuerySmart(testProduct, query);
            console.log(`  ${matches ? '✅' : '❌'} "${query}" ${matches ? 'encuentra' : 'NO encuentra'} "Colágeno Hidrolizado"`);
        });
    }
    
    // 7. VERIFICAR STORAGE
    console.log('\n%c7️⃣ VERIFICANDO STORAGE', 'color: #4a90e2; font-weight: bold;');
    
    try {
        const testKey = 'nb_test_' + Date.now();
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        console.log('  ✅ localStorage funcionando');
    } catch (e) {
        console.log('  ❌ localStorage no disponible:', e.message);
        results.errors.push('localStorage bloqueado');
    }
    
    // 8. RESUMEN FINAL
    console.log('\n' + '='.repeat(60));
    console.log('%c📊 RESUMEN DEL DIAGNÓSTICO', 'color: #2d8659; font-size: 14px; font-weight: bold;');
    console.log('='.repeat(60));
    
    const errorsCount = results.errors.length;
    const warningsCount = results.warnings.length;
    
    if (errorsCount === 0 && warningsCount === 0) {
        console.log('%c✅ TODO FUNCIONA CORRECTAMENTE', 'color: green; font-size: 14px; font-weight: bold;');
    } else {
        if (errorsCount > 0) {
            console.log(`%c❌ ${errorsCount} ERROR(ES) ENCONTRADO(S):`, 'color: red; font-weight: bold;');
            results.errors.forEach(error => console.log(`  • ${error}`));
        }
        
        if (warningsCount > 0) {
            console.log(`%c⚠️ ${warningsCount} ADVERTENCIA(S):`, 'color: orange; font-weight: bold;');
            results.warnings.forEach(warning => console.log(`  • ${warning}`));
        }
    }
    
    // 9. RECOMENDACIONES
    console.log('\n%c💡 RECOMENDACIONES', 'color: #4a90e2; font-weight: bold;');
    
    if (!results.services['UserWay Widget']) {
        console.log('  📌 Actualiza CSP para incluir: cdn.userway.org y api.userway.org');
    }
    
    if (!results.services['Tawk.to Chat']) {
        console.log('  📌 Actualiza CSP para incluir: embed.tawk.to, va.tawk.to, wss://va.tawk.to');
    }
    
    if (!results.services['Facebook Pixel']) {
        console.log('  📌 Actualiza CSP para incluir: www.facebook.com en img-src y connect-src');
    }
    
    if (!searchFunctions.matchesQuerySmart) {
        console.log('  📌 Agrega el script cart-search-fix.js para mejorar la búsqueda');
    }
    
    // 10. EXPORT RESULTS
    console.log('\n%c📋 DATOS EXPORTADOS', 'color: #4a90e2; font-weight: bold;');
    console.log('Los resultados están guardados en: window.NB_DIAGNOSTIC_RESULTS');
    window.NB_DIAGNOSTIC_RESULTS = results;
    
    console.log('\n' + '='.repeat(60));
    console.log('%c✅ DIAGNÓSTICO COMPLETADO', 'color: #2d8659; font-size: 14px; font-weight: bold;');
    console.log('Para ver CSP completo: console.log(window.NB_DIAGNOSTIC_RESULTS.csp)');
    console.log('='.repeat(60));
    
    return results;
})();
