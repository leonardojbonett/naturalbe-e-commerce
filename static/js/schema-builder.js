/**
 * Schema Builder - Funciones para inyectar structured data (schema.org)
 * Mejora SEO en Google Rich Results y búsqueda enriquecida
 */

(() => {
  const DEFAULT_SCHEMA_IMAGE = 'https://naturalbe.com.co/static/img/og-naturalbe.jpg';
  const DEFAULT_PRODUCT_DESCRIPTION = 'Suplemento disponible en Natural Be con envio en Colombia y pago seguro.';

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

  function getSchemaImage(product) {
    const imageRaw = product?.imagen_principal_webp || product?.imagen_principal || product?.image || '';
    return toAbsoluteUrl(imageRaw) || DEFAULT_SCHEMA_IMAGE;
  }

  function getSchemaDescription(product) {
    const text = String(
      product?.descripcion_corta
      || product?.description
      || product?.descripcion
      || product?.nombre
      || product?.name
      || ''
    ).trim();
    return text || DEFAULT_PRODUCT_DESCRIPTION;
  }

  function getOfferPriceValue(product) {
    return Number(product?.precio_oferta || product?.precio || product?.price || 0);
  }

  function getDefaultShippingDetails() {
    return {
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
    };
  }

  function getDefaultReturnPolicy() {
    return {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "CO",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility",
      "returnMethod": "https://schema.org/ReturnByMail",
      "merchantReturnDays": 5,
      "merchantReturnLink": "https://naturalbe.com.co/devoluciones"
    };
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

    const priceValue = getOfferPriceValue(product);
    const url = toAbsoluteUrl(product.url || window.location.href);
    const productGroupId = String(
      product.product_group_id
      || product.productGroupID
      || product.inProductGroupWithID
      || ''
    ).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_.]/g, '');
    const variantDimensions = {};
    const size = String(product.size || product.talla || product.presentacion_unidades || product.presentacion || '').trim();
    const color = String(product.color || '').trim();
    const material = String(product.material || '').trim();
    const pattern = String(product.pattern || '').trim();
    if (size) variantDimensions.size = size;
    if (color) variantDimensions.color = color;
    if (material) variantDimensions.material = material;
    if (pattern) variantDimensions.pattern = pattern;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.nombre || product.name || '',
      "image": getSchemaImage(product),
      "description": getSchemaDescription(product),
      "sku": product.id || product.slug || '',
      "url": url,
      "brand": {
        "@type": "Brand",
        "name": product.marca || 'Natural Be'
      }
    };
    Object.assign(schema, variantDimensions);
    if (productGroupId) {
      schema.inProductGroupWithID = productGroupId;
      const variesBy = Object.keys(variantDimensions).map((key) => `https://schema.org/${key}`);
      schema.isVariantOf = {
        "@type": "ProductGroup",
        "@id": `https://naturalbe.com.co/#product-group-${productGroupId}`,
        "productGroupID": productGroupId,
        "name": product.nombre || product.name || ''
      };
      if (variesBy.length) {
        schema.isVariantOf.variesBy = variesBy;
      }
    }

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
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.disponible === false
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      "priceValidUntil": getPriceValidUntil(),
      "url": url,
      "seller": {
        "@type": "Organization",
        "name": "Natural Be"
      },
      "shippingDetails": getDefaultShippingDetails(),
      "hasMerchantReturnPolicy": getDefaultReturnPolicy()
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
          const priceValue = getOfferPriceValue(product);
          const url = toAbsoluteUrl(product.url || '');

          const listItem = {
            "@type": "ListItem",
            "position": index + 1,
            "url": url,
            "item": {
              "@type": "Product",
              "name": product.nombre || product.name || '',
              "image": getSchemaImage(product),
              "description": getSchemaDescription(product),
              "sku": product.id || product.slug || '',
              "url": url,
              "offers": {
                "@type": "Offer",
                "priceCurrency": "COP",
                "price": priceValue,
                "itemCondition": "https://schema.org/NewCondition",
                "availability": product.disponible === false
                  ? "https://schema.org/OutOfStock"
                  : "https://schema.org/InStock",
                "priceValidUntil": getPriceValidUntil(),
                "url": url,
                "seller": {
                  "@type": "Organization",
                  "name": "Natural Be"
                },
                "shippingDetails": getDefaultShippingDetails(),
                "hasMerchantReturnPolicy": getDefaultReturnPolicy()
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
    if (!Array.isArray(breadcrumbs) || breadcrumbs.length < 2) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => {
        const listItem = {
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name
        };
        // El ultimo item puede omitir URL; Google usa la URL de la pagina.
        if (index !== breadcrumbs.length - 1 && crumb.url) {
          listItem.item = toAbsoluteUrl(crumb.url);
        }
        return listItem;
      }).filter((item) => item.name)
    };

    if (schema.itemListElement.length >= 2) {
      upsertJsonLdScript('breadcrumb-schema', schema);
    }
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
