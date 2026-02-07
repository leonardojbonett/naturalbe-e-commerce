// ============================================
// NATURAL BE - MOTOR DE RECOMENDACIONES
// ============================================
// Sistema inteligente de productos relacionados y cross-selling

(() => {
  'use strict';

  const RECOMMENDATIONS = {
    // Configuración
    config: {
      maxRecommendations: 6,
      minScore: 0.1,
      weights: {
        sameCategory: 0.4,
        sameBrand: 0.2,
        samePrice: 0.15,
        popularityBoost: 0.15,
        frequentlyBought: 0.1
      }
    },

    // Reglas de productos frecuentemente comprados juntos
    frequentlyBought: {
      // Colágeno + Biotina
      'colageno': ['biotina', 'vitamina-c', 'vitamina-e'],
      'biotina': ['colageno', 'vitamina-e'],
      
      // Omega 3 + Vitaminas
      'omega': ['vitamina-d', 'vitamina-e', 'coenzyme-q10'],
      'omega-3': ['vitamina-d', 'vitamina-e'],
      
      // Magnesio + Calcio
      'magnesio': ['calcio', 'vitamina-d', 'zinc'],
      'calcio': ['magnesio', 'vitamina-d'],
      
      // Vitamina C + Zinc
      'vitamina-c': ['zinc', 'vitamina-d', 'echinacea'],
      'zinc': ['vitamina-c', 'vitamina-d'],
      
      // Energía
      'ginseng': ['vitamina-b', 'coenzyme-q10', 'l-carnitina'],
      'b-complex': ['ginseng', 'magnesio', 'omega-3'],
      
      // Inmunidad
      'echinacea': ['vitamina-c', 'zinc', 'vitamina-d'],
      'propoleo': ['vitamina-c', 'echinacea', 'zinc']
    },

    // Categorías complementarias
    complementaryCategories: {
      'colageno': ['vitaminas', 'antioxidantes'],
      'omega': ['vitaminas', 'minerales'],
      'vitaminas': ['minerales', 'omega'],
      'minerales': ['vitaminas'],
      'energia': ['vitaminas', 'minerales'],
      'inmunidad': ['vitaminas', 'antioxidantes']
    },

    init() {
      if (typeof window.PRODUCTS === 'undefined') {
        setTimeout(() => this.init(), 100);
        return;
      }

      this.products = window.PRODUCTS || [];
      this.buildIndex();
      this.attachToProductPages();
      this.attachToCart();
      console.log('✓ Recommendations Engine initialized');
    },

    buildIndex() {
      // Crear índice de productos por categoría, marca, precio
      this.byCategory = {};
      this.byBrand = {};
      this.byPriceRange = {};

      this.products.forEach(product => {
        const category = this.normalize(product.categoria || product.category || '');
        const brand = this.normalize(product.marca || product.brand || '');
        const price = product.precio || product.precio_oferta || product.price || 0;
        const priceRange = this.getPriceRange(price);

        // Por categoría
        if (!this.byCategory[category]) this.byCategory[category] = [];
        this.byCategory[category].push(product);

        // Por marca
        if (!this.byBrand[brand]) this.byBrand[brand] = [];
        this.byBrand[brand].push(product);

        // Por rango de precio
        if (!this.byPriceRange[priceRange]) this.byPriceRange[priceRange] = [];
        this.byPriceRange[priceRange].push(product);
      });
    },

    normalize(text) {
      return String(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
    },

    getPriceRange(price) {
      if (price < 30000) return 'low';
      if (price < 70000) return 'medium';
      if (price < 120000) return 'high';
      return 'premium';
    },

    // Obtener recomendaciones para un producto
    getRecommendations(productId, options = {}) {
      const product = this.products.find(p => p.id === productId);
      if (!product) return [];

      const limit = options.limit || this.config.maxRecommendations;
      const excludeIds = options.excludeIds || [productId];

      // Calcular scores para todos los productos
      const scored = this.products
        .filter(p => !excludeIds.includes(p.id))
        .map(p => ({
          product: p,
          score: this.calculateScore(product, p)
        }))
        .filter(item => item.score >= this.config.minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return scored.map(item => item.product);
    },

    calculateScore(sourceProduct, targetProduct) {
      let score = 0;
      const weights = this.config.weights;

      // 1. Misma categoría
      const sourceCategory = this.normalize(sourceProduct.categoria || sourceProduct.category || '');
      const targetCategory = this.normalize(targetProduct.categoria || targetProduct.category || '');
      
      if (sourceCategory === targetCategory) {
        score += weights.sameCategory;
      } else if (this.areComplementary(sourceCategory, targetCategory)) {
        score += weights.sameCategory * 0.5;
      }

      // 2. Misma marca
      const sourceBrand = this.normalize(sourceProduct.marca || sourceProduct.brand || '');
      const targetBrand = this.normalize(targetProduct.marca || targetProduct.brand || '');
      
      if (sourceBrand === targetBrand && sourceBrand) {
        score += weights.sameBrand;
      }

      // 3. Rango de precio similar
      const sourcePrice = sourceProduct.precio || sourceProduct.precio_oferta || sourceProduct.price || 0;
      const targetPrice = targetProduct.precio || targetProduct.precio_oferta || targetProduct.price || 0;
      
      if (this.getPriceRange(sourcePrice) === this.getPriceRange(targetPrice)) {
        score += weights.samePrice;
      }

      // 4. Popularidad (productos con rating alto)
      const targetRating = targetProduct.rating_value || 0;
      if (targetRating >= 4.5) {
        score += weights.popularityBoost;
      } else if (targetRating >= 4.0) {
        score += weights.popularityBoost * 0.5;
      }

      // 5. Frecuentemente comprados juntos
      if (this.areFrequentlyBought(sourceProduct, targetProduct)) {
        score += weights.frequentlyBought;
      }

      return score;
    },

    areComplementary(category1, category2) {
      const complementary = this.complementaryCategories[category1] || [];
      return complementary.some(cat => category2.includes(cat));
    },

    areFrequentlyBought(product1, product2) {
      const slug1 = this.normalize(product1.slug || product1.nombre || '');
      const slug2 = this.normalize(product2.slug || product2.nombre || '');

      // Buscar en reglas de frecuentemente comprados
      for (const [key, values] of Object.entries(this.frequentlyBought)) {
        if (slug1.includes(key)) {
          return values.some(v => slug2.includes(v));
        }
      }

      return false;
    },

    // Obtener productos relacionados por categoría
    getRelatedByCategory(categoryName, limit = 6, excludeIds = []) {
      const normalized = this.normalize(categoryName);
      const products = this.byCategory[normalized] || [];
      
      return products
        .filter(p => !excludeIds.includes(p.id))
        .sort((a, b) => (b.rating_value || 0) - (a.rating_value || 0))
        .slice(0, limit);
    },

    // Obtener productos de la misma marca
    getRelatedByBrand(brandName, limit = 6, excludeIds = []) {
      const normalized = this.normalize(brandName);
      const products = this.byBrand[normalized] || [];
      
      return products
        .filter(p => !excludeIds.includes(p.id))
        .sort((a, b) => (b.rating_value || 0) - (a.rating_value || 0))
        .slice(0, limit);
    },

    // Obtener productos en el mismo rango de precio
    getRelatedByPrice(price, limit = 6, excludeIds = []) {
      const priceRange = this.getPriceRange(price);
      const products = this.byPriceRange[priceRange] || [];
      
      return products
        .filter(p => !excludeIds.includes(p.id))
        .sort((a, b) => (b.rating_value || 0) - (a.rating_value || 0))
        .slice(0, limit);
    },

    // Renderizar recomendaciones en página de producto
    attachToProductPages() {
      // Detectar si estamos en página de producto
      const urlParams = new URLSearchParams(window.location.search);
      const productSlug = urlParams.get('slug');
      
      if (!productSlug) return;

      // Buscar producto por slug
      const product = this.products.find(p => p.slug === productSlug);
      if (!product) return;

      // Obtener recomendaciones
      const recommendations = this.getRecommendations(product.id, { limit: 6 });
      
      if (recommendations.length === 0) return;

      // Crear sección de recomendaciones
      this.renderRecommendationsSection(recommendations, 'Productos relacionados');
    },

    // Renderizar recomendaciones en carrito
    attachToCart() {
      // Escuchar eventos del carrito
      document.addEventListener('cart:updated', (event) => {
        const cartItems = event.detail?.items || [];
        if (cartItems.length === 0) return;

        // Obtener IDs de productos en el carrito
        const cartProductIds = cartItems.map(item => item.id);

        // Obtener recomendaciones basadas en productos del carrito
        const recommendations = this.getCartRecommendations(cartProductIds);

        if (recommendations.length > 0) {
          this.renderCartRecommendations(recommendations);
        }
      });
    },

    getCartRecommendations(cartProductIds) {
      const allRecommendations = [];
      const seen = new Set(cartProductIds);

      // Obtener recomendaciones para cada producto del carrito
      cartProductIds.forEach(productId => {
        const recs = this.getRecommendations(productId, {
          limit: 3,
          excludeIds: Array.from(seen)
        });

        recs.forEach(rec => {
          if (!seen.has(rec.id)) {
            allRecommendations.push(rec);
            seen.add(rec.id);
          }
        });
      });

      // Ordenar por score y limitar
      return allRecommendations.slice(0, 4);
    },

    renderRecommendationsSection(products, title = 'Te puede interesar') {
      const container = document.createElement('section');
      container.className = 'recommendations-section page-shell';
      container.style.cssText = 'margin-top: 3rem; margin-bottom: 3rem;';

      container.innerHTML = `
        <h2 class="section-title">${this.escapeHtml(title)}</h2>
        <p class="section-subtitle">Productos seleccionados especialmente para ti</p>
        <div class="product-grid" id="recommendationsGrid"></div>
      `;

      // Insertar antes del footer
      const footer = document.querySelector('footer');
      if (footer) {
        footer.parentNode.insertBefore(container, footer);
      } else {
        document.body.appendChild(container);
      }

      // Renderizar productos
      const grid = container.querySelector('#recommendationsGrid');
      if (grid && window.nbMarketplace?.renderProductGrid) {
        window.nbMarketplace.renderProductGrid(products, grid);
      }
    },

    renderCartRecommendations(products) {
      const container = document.getElementById('recommendedContainer');
      if (!container) return;

      container.innerHTML = `
        <div class="recommended-header">
          <h3>También te puede interesar</h3>
        </div>
        <div class="recommended-grid" id="recommendedGrid"></div>
      `;

      const grid = container.querySelector('#recommendedGrid');
      if (!grid) return;

      // Renderizar productos compactos
      grid.innerHTML = products.map(product => {
        const name = product.nombre || product.name || '';
        const price = product.precio_oferta || product.precio || product.price || 0;
        const image = product.imagen_principal || product.image || './static/img/placeholder.webp';
        const url = product.url || `./producto/${product.slug}.html`;

        return `
          <div class="recommended-item">
            <a href="${this.escapeHtml(url)}">
              <img src="${this.escapeHtml(image)}" 
                   alt="${this.escapeHtml(name)}"
                   loading="lazy"
                   width="80" 
                   height="80"
                   onerror="this.src='./static/img/placeholder.webp'">
            </a>
            <div class="recommended-info">
              <a href="${this.escapeHtml(url)}" class="recommended-name">
                ${this.escapeHtml(name)}
              </a>
              <div class="recommended-price">
                ${this.formatPrice(price)}
              </div>
              <button class="btn-ghost btn-sm" 
                      onclick="addToCart('${product.id}', '${this.escapeHtml(name)}', ${price}, '${this.escapeHtml(image)}')">
                Agregar
              </button>
            </div>
          </div>
        `;
      }).join('');
    },

    formatPrice(price) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(price || 0);
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RECOMMENDATIONS.init());
  } else {
    RECOMMENDATIONS.init();
  }

  // Exponer API global
  window.NB_RECOMMENDATIONS = RECOMMENDATIONS;
})();
