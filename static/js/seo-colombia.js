// SEO Hiper-Localizado para Colombia - Natural Be
// Optimizado para dominar búsquedas en mercado colombiano

(function() {
  'use strict';

  // Base de datos de keywords colombianas por categoría
  const colombianKeywords = {
    vitaminas: {
      primary: ['vitaminas Colombia', 'comprar vitaminas Barranquilla', 'suplementos vitaminas Bogotá', 'vitaminas Medellín', 'vitaminas Cali'],
      secondary: ['vitaminas para energía Colombia', 'multivitamínicos colombianos', 'vitaminas originales Colombia', 'mejores vitaminas Colombia'],
      longTail: ['donde comprar vitaminas en Colombia', 'vitaminas con registro INVIMA', 'suplementos vitamínicos Bogotá', 'vitaminas deportivas Colombia'],
      cities: ['Barranquilla', 'Bogotá', 'Medellín', 'Cali', 'Bucaramanga', 'Cartagena', 'Pereira', 'Manizales']
    },
    proteinas: {
      primary: ['proteína Colombia', 'proteína whey Barranquilla', 'comprar proteína Bogotá', 'proteína deportiva Colombia'],
      secondary: ['proteína para músculo Colombia', 'whey protein colombiana', 'proteína original Colombia', 'mejor proteína Colombia'],
      longTail: ['proteína con registro INVIMA', 'proteína para gimnasio Colombia', 'proteína precio Colombia', 'proteína envío gratis Colombia'],
      cities: ['Barranquilla', 'Bogotá', 'Medellín', 'Cali', 'Bucaramanga']
    },
    colageno: {
      primary: ['colágeno Colombia', 'colageno hidrolizado Barranquilla', 'comprar colágeno Bogotá', 'colágeno para piel Colombia'],
      secondary: ['colágeno con vitamina C Colombia', 'colágeno original Colombia', 'mejor colágeno Colombia', 'colágeno natural Colombia'],
      longTail: ['colágeno con INVIMA', 'colágeno para articulaciones Colombia', 'colágeno precio Colombia', 'colágeno envío Bogotá'],
      cities: ['Barranquilla', 'Bogotá', 'Medellín', 'Cali']
    },
    omega: {
      primary: ['omega 3 Colombia', 'ácidos grasos Barranquilla', 'omega 3 Bogotá', 'comprar omega Colombia'],
      secondary: ['omega 3 para corazón Colombia', 'aceite de pescado Colombia', 'omega original Colombia', 'mejor omega 3 Colombia'],
      longTail: ['omega 3 con INVIMA', 'omega 3 para cerebro Colombia', 'omega 3 precio Colombia', 'omega 3 envío gratis Colombia'],
      cities: ['Barranquilla', 'Bogotá', 'Medellín', 'Cali']
    },
    magnesio: {
      primary: ['magnesio Colombia', 'cloruro de magnesio Barranquilla', 'magnesio Bogotá', 'comprar magnesio Colombia'],
      secondary: ['magnesio para dormir Colombia', 'magnesio original Colombia', 'mejor magnesio Colombia', 'magnesio natural Colombia'],
      longTail: ['magnesio con INVIMA', 'magnesio para músculos Colombia', 'magnesio precio Colombia', 'magnesio envío Colombia'],
      cities: ['Barranquilla', 'Bogotá', 'Medellín', 'Cali']
    }
  };

  // Schema markup para productos colombianos
  function generateProductSchema(product) {
    const category = product.categoria;
    const keywords = colombianKeywords[category] || {};
    
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": `${product.nombre} - Colombia`,
      "description": `${product.descripcion_corta || ''} Comprar en Colombia con envío a Bogotá, Medellín, Cali, Barranquilla`,
      "brand": {
        "@type": "Brand",
        "name": product.marca
      },
      "category": category,
      "offers": {
        "@type": "Offer",
        "price": product.precio_oferta || product.precio,
        "priceCurrency": "COP",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "Natural Be Colombia",
          "url": "https://naturalbe.com.co"
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "15000",
            "currency": "COP"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 1,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 1,
              "maxValue": 2,
              "unitCode": "DAY"
            }
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "CO"
          }
        }
      },
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Registro INVIMA",
          "value": "Cumple con regulaciones colombianas"
        },
        {
          "@type": "PropertyValue", 
          "name": "Envío a ciudades principales",
          "value": "Bogotá, Medellín, Cali, Barranquilla, Bucaramanga"
        }
      ],
      "keywords": [
        ...(keywords.primary || []),
        ...(keywords.secondary || []),
        ...(keywords.longTail || [])
      ].join(', '),
      "url": `https://naturalbe.com.co/producto/${product.slug}`,
      "image": product.imagen_principal
    };
  }

  // Schema markup para organización colombiana
  function generateOrganizationSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Natural Be Colombia",
      "url": "https://naturalbe.com.co",
      "logo": "https://naturalbe.com.co/static/img/logo.webp",
      "description": "Tienda líder de suplementos y vitaminas en Colombia. Envíos a Bogotá, Medellín, Cali, Barranquilla y todo el país.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Barranquilla, Atlántico",
        "addressLocality": "Barranquilla",
        "addressRegion": "Atlántico",
        "postalCode": "080001",
        "addressCountry": "CO"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+57-313-721-2923",
        "contactType": "customer service",
        "areaServed": "CO",
        "availableLanguage": "Spanish"
      },
      "sameAs": [
        "https://www.facebook.com/NaturalBeColombia",
        "https://www.instagram.com/naturalbe__/",
        "https://co.pinterest.com/naturalbetutiendasaludable"
      ],
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 10.9639,
        "longitude": -74.7963
      }
    };
  }

  // Schema markup para páginas de categorías colombianas
  function generateCategorySchema(categoryName, products) {
    const keywords = colombianKeywords[categoryName] || {};
    
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} - Colombia`,
      "description": `Catálogo completo de ${categoryName} en Colombia. Comprar ${keywords.primary?.join(', ')} con envío a todo el país.`,
      "url": `https://naturalbe.com.co/catalogo-${categoryName}.html`,
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": products.length,
        "itemListElement": products.map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": generateProductSchema(product)
        }))
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Inicio",
            "item": "https://naturalbe.com.co"
          },
          {
            "@type": "ListItem", 
            "position": 2,
            "name": categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
            "item": `https://naturalbe.com.co/catalogo-${categoryName}.html`
          }
        ]
      }
    };
  }

  // Función para actualizar meta tags dinámicamente
  function updateMetaTagsForColombia(pageType, data = {}) {
    const title = document.title;
    const description = document.querySelector('meta[name="description"]');
    
    let newTitle = title;
    let newDescription = description?.content || '';
    
    switch(pageType) {
      case 'category':
        const keywords = colombianKeywords[data.category] || {};
        newTitle = `${data.categoryName} en Colombia | Comprar ${keywords.primary?.[0] || data.categoryName} | Natural Be`;
        newDescription = `Compra ${data.categoryName} en Colombia con envío a Bogotá, Medellín, Cali, Barranquilla. ${keywords.primary?.join(' • ')}. Precio especial y garantía INVIMA.`;
        break;
        
      case 'product':
        newTitle = `${data.product.nombre} - Colombia | Comprar en Natural Be`;
        newDescription = `${data.product.descripcion_corta || ''} Comprar ${data.product.nombre} en Colombia con envío gratis. Precio: ${new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP'}).format(data.product.precio)}.`;
        break;
        
      case 'home':
        newTitle = 'Natural Be Colombia | Suplementos y Vitaminas con Envío a Todo el País';
        newDescription = 'Tienda líder de suplementos en Colombia. Vitaminas, proteínas, colágeno, omega 3. Envíos a Bogotá, Medellín, Cali, Barranquilla. Registro INVIMA.';
        break;
    }
    
    // Actualizar título
    document.title = newTitle;
    
    // Actualizar descripción
    if (description) {
      description.content = newDescription;
    }
    
    // Agregar meta tags adicionales para Colombia
    updateColombiaMetaTags(data);
  }

  // Meta tags específicos para Colombia
  function updateColombiaMetaTags(data) {
    const additionalTags = [
      { name: 'geo.region', content: 'CO' },
      { name: 'geo.placename', content: 'Colombia' },
      { name: 'geo.position', content: '4.5709;-74.2973' },
      { name: 'ICBM', content: '4.5709, -74.2973' },
      { name: 'language', content: 'es-CO' },
      { name: 'country', content: 'Colombia' },
      { property: 'og:locale', content: 'es_CO' },
      { property: 'og:country-name', content: 'Colombia' }
    ];
    
    additionalTags.forEach(tag => {
      let meta;
      if (tag.property) {
        meta = document.querySelector(`meta[property="${tag.property}"]`);
      } else {
        meta = document.querySelector(`meta[name="${tag.name}"]`);
      }
      
      if (!meta) {
        meta = document.createElement('meta');
        if (tag.property) {
          meta.setAttribute('property', tag.property);
        } else {
          meta.setAttribute('name', tag.name);
        }
        document.head.appendChild(meta);
      }
      meta.content = tag.content;
    });
  }

  // Inyectar schema markup en la página
  function injectSchemaMarkup(schema, id) {
    // Eliminar schema existente con mismo ID
    const existingScript = document.getElementById(id);
    if (existingScript) {
      existingScript.remove();
    }
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
  }

  // Función principal de inicialización
  function initSEOColombia() {
    // Detectar tipo de página
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    // Schema de organización (siempre presente)
    injectSchemaMarkup(generateOrganizationSchema(), 'organization-schema');
    
    if (path.includes('catalogo-') || path.includes('category')) {
      const category = path.match(/catalogo-([^.]+)/)?.[1] || params.get('category');
      if (category && window.ALL_PRODUCTS) {
        const categoryProducts = window.ALL_PRODUCTS.filter(p => p.categoria === category);
        injectSchemaMarkup(generateCategorySchema(category, categoryProducts), 'category-schema');
        updateMetaTagsForColombia('category', {
          category,
          categoryName: category.charAt(0).toUpperCase() + category.slice(1)
        });
      }
    } else if (path.includes('producto') || path.includes('product')) {
      const slug = params.get('slug') || path.match(/producto\/([^\/]+)/)?.[1];
      if (slug && window.PRODUCTS_BY_SLUG && window.PRODUCTS_BY_SLUG[slug]) {
        const product = window.PRODUCTS_BY_SLUG[slug];
        injectSchemaMarkup(generateProductSchema(product), 'product-schema');
        updateMetaTagsForColombia('product', { product });
      }
    } else if (path === '/' || path.includes('index')) {
      updateMetaTagsForColombia('home');
    }
  }

  // Exponer funciones globalmente
  window.SEOSColombia = {
    init: initSEOColombia,
    generateProductSchema,
    generateCategorySchema,
    generateOrganizationSchema,
    updateMetaTagsForColombia,
    colombianKeywords
  };

  // Auto-inicializar cuando el DOM esté listo y los productos cargados
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initSEOColombia, 1000); // Esperar a que carguen los productos
    });
  } else {
    setTimeout(initSEOColombia, 1000);
  }

})();
