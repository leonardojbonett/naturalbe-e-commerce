/**
 * Schema Builder - Funciones para inyectar structured data (schema.org)
 * Mejora SEO en Google Rich Results y búsqueda enriquecida
 */

(() => {
  function upsertJsonLdScript(id, data) {
    if (!id || !data) return;
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  // Convertir URLs relativas a absolutas
  function toAbsoluteUrl(value) {
    if (!value) return undefined;
    const str = String(value);
    if (/^https?:\/\//i.test(str)) return str;
    if (/^\/\//.test(str)) return `https:${str}`;
    const base = 'https://naturalbe.com.co';
    try {
      return new URL(str, base).href;
    } catch (err) {
      return `${base}${str}`;
    }
  }

  // Obtener fecha de expiración de precio (fin de mes actual)
  function getPriceValidUntil() {
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
    return end.toISOString().slice(0, 10);
  }

  /**
   * Inyectar schema de Producto individual (usado en PDP)
   * @param {Object} product - Datos del producto
   */
  window.injectProductDetailSchema = function(product) {
    if (!product || !product.nombre || !product.precio) return;

    const priceValue = Number(product.precio_oferta || product.precio || 0);
    const imageRaw = product.imagen_principal_webp || product.imagen_principal || product.image || '';
    const url = toAbsoluteUrl(product.url || window.location.href);

    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.nombre || product.name || '',
      "image": imageRaw ? toAbsoluteUrl(imageRaw) : undefined,
      "description": product.descripcion_corta || product.description || product.descripcion || '',
      "sku": product.id || product.slug || '',
      "url": url,
      "brand": {
        "@type": "Brand",
        "name": product.marca || 'Natural Be'
      }
    };

    // Agregar rating si existe
    if (product.rating_value && product.rating_count) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": Number(product.rating_value),
        "reviewCount": Number(product.rating_count),
        "bestRating": 5,
        "worstRating": 1
      };
    }

    // Offers con detalles completos
    schema.offers = {
      "@type": "Offer",
      "priceCurrency": "COP",
      "price": priceValue,
      "availability": product.disponible === false
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      "priceValidUntil": getPriceValidUntil(),
      "url": url,
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "currency": "COP",
          "value": 15000
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "CO"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "d"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "d"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "CO",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility",
        "returnMethod": "https://schema.org/ReturnByMail",
        "merchantReturnDays": 5,
        "merchantReturnLink": "https://naturalbe.com.co/devoluciones.html"
      }
    };

    upsertJsonLdScript('product-detail-schema', schema);
  };

  /**
   * Inyectar schema de lista de productos (PLP/Categoría)
   * @param {Array} products - Array de productos
   * @param {Object} options - { title, description }
   */
  window.injectProductListSchema = function(products, options = {}) {
    if (!Array.isArray(products) || !products.length) return;

    const {
      title = 'Productos Natural Be',
      description = 'Catálogo de suplementos naturales',
      listUrl = window.location.href
    } = options;

    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": title,
      "url": toAbsoluteUrl(listUrl),
      "description": description,
      "itemListOrder": "https://schema.org/ItemListOrderAscending",
      "itemListElement": products
        .filter(p => p.nombre && p.precio)
        .slice(0, 50)
        .map((product, index) => {
          const priceValue = Number(product.precio_oferta || product.precio || 0);
          const imageRaw = product.imagen_principal_webp || product.imagen_principal || product.image || '';
          const url = toAbsoluteUrl(product.url || '');

          const listItem = {
            "@type": "ListItem",
            "position": index + 1,
            "url": url,
            "item": {
              "@type": "Product",
              "name": product.nombre || product.name || '',
              "image": imageRaw ? toAbsoluteUrl(imageRaw) : undefined,
              "url": url,
              "offers": {
                "@type": "Offer",
                "priceCurrency": "COP",
                "price": priceValue,
                "availability": product.disponible === false
                  ? "https://schema.org/OutOfStock"
                  : "https://schema.org/InStock"
              }
            }
          };

          // Agregar rating si existe
          if (product.rating_value) {
            listItem.item.aggregateRating = {
              "@type": "AggregateRating",
              "ratingValue": Number(product.rating_value),
              "reviewCount": Number(product.rating_count || 0)
            };
          }

          return listItem;
        })
        .filter(item => item.item && item.item.name && item.url)
    };

    if (schema.itemListElement.length > 0) {
      schema.numberOfItems = schema.itemListElement.length;
      upsertJsonLdScript('product-list-schema', schema);
    }
  };

  /**
   * Inyectar schema de Breadcrumb (para navegación SEO)
   * @param {Array} breadcrumbs - [ {name, url}, ... ]
   */
  window.injectBreadcrumbSchema = function(breadcrumbs) {
    if (!Array.isArray(breadcrumbs) || !breadcrumbs.length) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": toAbsoluteUrl(crumb.url)
      }))
    };

    upsertJsonLdScript('breadcrumb-schema', schema);
  };

  /**
   * Inyectar schema de FAQ (preguntas frecuentes)
   * @param {Array} faqs - [ {question, answer}, ... ]
   */
  window.injectFaqSchema = function(faqs) {
    if (!Array.isArray(faqs) || !faqs.length) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    upsertJsonLdScript('faq-schema', schema);
  };

  /**
   * Inyectar schema de Reseña/Review
   * @param {Object} review - { author, rating, text, datePublished }
   */
  window.injectReviewSchema = function(review) {
    if (!review || !review.author || !review.rating) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": String(review.rating),
        "bestRating": "5",
        "worstRating": "1"
      },
      "reviewBody": review.text,
      "datePublished": review.datePublished || new Date().toISOString().slice(0, 10)
    };

    upsertJsonLdScript('review-schema', schema);
  };

  // Exportar para uso en window
  window.SchemaBuilder = {
    toAbsoluteUrl,
    getPriceValidUntil,
    injectProductDetailSchema: window.injectProductDetailSchema,
    injectProductListSchema: window.injectProductListSchema,
    injectBreadcrumbSchema: window.injectBreadcrumbSchema,
    injectFaqSchema: window.injectFaqSchema,
    injectReviewSchema: window.injectReviewSchema
  };
})();
