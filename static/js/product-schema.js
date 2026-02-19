// ============================================
// NATURAL BE - SCHEMA.ORG PRODUCT MARKUP
// ============================================
// Agrega datos estructurados de producto para Google

(() => {
    'use strict';

    // Obtener datos del producto desde la página
    function getProductData() {
        if (typeof window.PRODUCTS_BY_SLUG === 'undefined') {
            console.warn("PRODUCTS_BY_SLUG no está disponible.");
            return null;
        }

        // 1. Intentar obtener el slug de la URL
        const urlParams = new URLSearchParams(window.location.search);
        let slug = urlParams.get('slug') || urlParams.get('producto'); // Preferir 'slug' o 'producto' param
        
        // Si no hay slug en los parámetros, intentar del pathname (ej. /producto/mi-slug.html)
        if (!slug) {
            const path = new URL(window.location.href).pathname;
            const pathMatch = path.match(/\/producto\/([^/]+?)(?:\.html)?$/);
            if (pathMatch && pathMatch[1]) {
                slug = decodeURIComponent(pathMatch[1]);
            }
        }

        if (slug) {
            const product = window.PRODUCTS_BY_SLUG[slug];
            if (product) return product;
        }

        // Fallback: Si no se encontró por slug, intentar por ID si está presente
        const productId = urlParams.get('id');
        if (productId && typeof window.PRODUCTS_BY_ID !== 'undefined') {
            const product = window.PRODUCTS_BY_ID[productId];
            if (product) return product;
        }
        
        return null;
    }

    // Construir schema Product
    function buildProductSchema(product) {
        const baseUrl = 'https://naturalbe.com.co';
        
        // Precio
        const price = product.precio_oferta || product.precio || 0;
        const currency = 'COP';
        
        // Disponibilidad
        const availability = product.disponible === false || (product.quantity && product.quantity <= 0)
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock';
        
        // Imagen
        let image = product.imagen_principal || product.image || '';
        if (image && !image.startsWith('http')) {
            image = `${baseUrl}/${image.replace(/^\.?\//, '')}`;
        }
        // No convertir WebP a JPG: mantener el formato original
        
        // URL del producto
        const productUrl = product.url || product.link || `${baseUrl}/producto/${encodeURIComponent(product.slug || '')}`;
        
        // Marca
        const brand = product.marca || product.brand || 'Natural Be';
        
        // Descripción
        const description = product.descripcion_larga || product.descripcion_corta || product.description || '';
        
        // SKU
        const sku = product.sku || product.product_id || product.id;
        
        // Construir schema
        const schema = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.nombre || product.name || '',
            "image": image,
            "description": description,
            "sku": sku,
            "brand": {
                "@type": "Brand",
                "name": brand
            },
            "offers": {
                "@type": "Offer",
                "url": productUrl,
                "priceCurrency": currency,
                "price": price,
                "availability": availability,
                "priceValidUntil": "2027-12-31", // Considerar generar dinámicamente
                "seller": {
                    "@type": "Organization",
                    "name": "Natural Be"
                }
            }
        };
        
        // Agregar GTIN si existe
        if (product.gtin) {
            schema.gtin = product.gtin;
        }
        
        // Agregar MPN si existe
        if (product.mpn) {
            schema.mpn = product.mpn;
        }
        
        // Agregar categoría
        if (product.categoria || product.category) {
            schema.category = product.categoria || product.category;
        }
        
        // Agregar rating si existe
        if (product.rating && product.reviewCount) {
            schema.aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": product.rating,
                "reviewCount": product.reviewCount
            };
        }
        
        return schema;
    }

    // Inyectar schema en el head
    function injectSchema(schema) {
        // Verificar si ya existe
        const existing = document.querySelector('script[type="application/ld+json"][data-product-schema]');
        if (existing) {
            existing.remove();
        }
        
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-product-schema', 'true');
        script.textContent = JSON.stringify(schema, null, 2);
        document.head.appendChild(script);
    }

    // Actualizar meta tags Open Graph
    function updateMetaTags(product) {
        const baseUrl = 'https://naturalbe.com.co';
        
        // Título
        const title = product.seo_title || `${product.nombre || product.name} | Natural Be`;
        document.title = title;
        
        // Descripción
        const description = product.seo_description || product.descripcion_corta || product.description || '';
        
        // Imagen
        let image = product.imagen_principal || product.image || '';
        if (image && !image.startsWith('http')) {
            image = `${baseUrl}/${image.replace(/^\.?\//, '')}`;
        }
        
        // URL
        const url = product.url || product.link || window.location.href;
        
        // Precio
        const price = product.precio_oferta || product.precio || 0;
        
        // Actualizar meta tags
        updateOrCreateMeta('name', 'description', description);
        updateOrCreateMeta('property', 'og:title', title);
        updateOrCreateMeta('property', 'og:description', description);
        updateOrCreateMeta('property', 'og:image', image);
        updateOrCreateMeta('property', 'og:url', url);
        updateOrCreateMeta('property', 'og:type', 'product');
        updateOrCreateMeta('property', 'product:price:amount', price);
        updateOrCreateMeta('property', 'product:price:currency', 'COP');
        updateOrCreateMeta('property', 'product:availability', product.disponible !== false ? 'in stock' : 'out of stock');
        updateOrCreateMeta('name', 'twitter:title', title);
        updateOrCreateMeta('name', 'twitter:description', description);
        updateOrCreateMeta('name', 'twitter:image', image);
        
        // Canonical
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.href = url;
        }
    }

    function updateOrCreateMeta(attr, attrValue, content) {
        let meta = document.querySelector(`meta[${attr}="${attrValue}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attr, attrValue);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }

    // Inicializar
    function init() {
        // Esperar a que PRODUCTS esté disponible
        const checkProducts = setInterval(() => {
            if (typeof PRODUCTS !== 'undefined') {
                clearInterval(checkProducts);
                
                const product = getProductData();
                if (product) {
                    const schema = buildProductSchema(product);
                    injectSchema(schema);
                    updateMetaTags(product);
                    
                    console.log('✓ Product schema injected:', product.nombre || product.name);
                }
            }
        }, 100);
        
        // Timeout después de 5 segundos
        setTimeout(() => clearInterval(checkProducts), 5000);
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
