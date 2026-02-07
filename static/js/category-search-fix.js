/**
 * Natural Be - Search Optimization Fix
 * Soluciona el problema de búsqueda lenta mediante:
 * 1. Pre-cálculo de índices de búsqueda
 * 2. Caché de normalizaciones de texto
 * 3. Early exit de loops
 * 4. Eliminación de operaciones redundantes
 */

(function() {
  'use strict';

  // Debug mode
  const DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  window.__NB_SEARCH_DEBUG = {
    enabled: DEBUG,
    log: function(...args) {
      if (DEBUG) console.log('[NB Search]', ...args);
    },
    testSearch: function(query) {
      if (!window.matchesQueryOptimized) {
        console.error('matchesQueryOptimized no está disponible');
        return;
      }
      
      const startTime = performance.now();
      const products = window.ALL_PRODUCTS || [];
      let count = 0;
      
      for (const product of products) {
        if (window.matchesQueryOptimized(product, query)) count++;
      }
      
      const duration = performance.now() - startTime;
      console.log(`🔍 Búsqueda: "${query}" → ${count} resultados en ${duration.toFixed(2)}ms`);
      return { count, duration };
    }
  };

  /**
   * Cache de normalizaciones de texto
   * Evita normalizar múltiples veces el mismo valor
   */
  const textNormalizationCache = new Map();
  const MAX_CACHE_SIZE = 1000;
  let cacheHits = 0;
  let cacheMisses = 0;

  function normalizeTextCached(text) {
    if (!text) return '';
    
    // Check cache first
    if (textNormalizationCache.has(text)) {
      cacheHits++;
      return textNormalizationCache.get(text);
    }

    cacheMisses++;
    
    // Normalize: lowercase, remove accents, remove extra spaces
    let normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .trim()
      .replace(/\s+/g, ' '); // Collapse spaces

    // Clean cache if it gets too large (LRU-like behavior)
    if (textNormalizationCache.size >= MAX_CACHE_SIZE) {
      const firstKey = textNormalizationCache.keys().next().value;
      textNormalizationCache.delete(firstKey);
    }

    textNormalizationCache.set(text, normalized);
    return normalized;
  }

  function getSearchEngine() {
    return window.NB_SEARCH_ENGINE || null;
  }

  function getProductId(product) {
    return String(product?.id || product?.slug || '');
  }

  /**
   * Índice de búsqueda pre-calculado por producto
   * Se calcula una sola vez por producto
   */
  class SearchIndex {
    constructor(product) {
      this.product = product;
      this.fields = [];
      this.combinedIndex = '';
      this.buildIndex();
    }

    buildIndex() {
      // Pre-normalize all fields (done once)
      const fieldConfigs = [
        { field: 'nombre', weight: 3 },
        { field: 'marca', weight: 2 },
        { field: 'categoria', weight: 3 },
        { field: 'subcategoria', weight: 2 },
        { field: 'descripcion_corta', weight: 1 },
      ];

      for (const { field, weight } of fieldConfigs) {
        const value = this.product[field];
        if (value) {
          const normalized = normalizeTextCached(value);
          this.fields.push({
            normalized,
            original: value,
            weight
          });
          this.combinedIndex += normalized + ' ';
        }
      }

      // Add tags
      if (this.product.tags && Array.isArray(this.product.tags)) {
        for (const tag of this.product.tags) {
          const normalized = normalizeTextCached(tag);
          this.fields.push({
            normalized,
            original: tag,
            weight: 2
          });
          this.combinedIndex += normalized + ' ';
        }
      }

      this.combinedIndex = this.combinedIndex.trim();
    }

    matchesSimpleQuery(normalizedQuery) {
      // Fast path: check combined index for simple contains
      return this.combinedIndex.includes(normalizedQuery);
    }

    matchesComplexQuery(normalizedQuery) {
      const searchTerms = normalizedQuery.split(' ').filter(term => term.length > 1);
      if (searchTerms.length === 0) return true;

      let totalScore = 0;
      let maxPossibleScore = searchTerms.length * 3;

      // Early exit if we already can't reach threshold
      const threshold = maxPossibleScore * 0.3;

      for (const term of searchTerms) {
        let termScore = 0;

        for (const { normalized, weight } of this.fields) {
          if (normalized.includes(term)) {
            termScore += weight;

            if (normalized.startsWith(term)) {
              termScore += weight * 0.5;
            }

            if (normalized === term) {
              termScore += weight * 2;
            }
          }
        }

        totalScore += termScore;

        // Early exit if score is impossible to reach
        if (totalScore + (searchTerms.length - searchTerms.indexOf(term) - 1) * 3 < threshold) {
          return false;
        }
      }

      return totalScore >= threshold;
    }
  }

  /**
   * Cache de índices de búsqueda por producto
   */
  const searchIndexCache = new WeakMap();

  function getSearchIndex(product) {
    if (!searchIndexCache.has(product)) {
      searchIndexCache.set(product, new SearchIndex(product));
    }
    return searchIndexCache.get(product);
  }

  /**
   * Función optimizada de búsqueda
   * Reemplaza la función original matchesQuery
   */
  window.matchesQueryOptimized = function(product, query) {
    if (!query || typeof query !== 'string') return true;

    const normalizedQuery = normalizeTextCached(query);
    if (!normalizedQuery) return true;

    const engine = getSearchEngine();
    if (engine && typeof engine.getResultSet === 'function') {
      const resultSet = engine.getResultSet(normalizedQuery);
      if (resultSet) {
        return resultSet.has(getProductId(product));
      }
    }

    const index = getSearchIndex(product);
    const isSimpleQuery = normalizedQuery.split(' ').length === 1;

    if (isSimpleQuery) {
      return index.matchesSimpleQuery(normalizedQuery);
    } else {
      return index.matchesComplexQuery(normalizedQuery);
    }
  };

  /**
   * Hook para reemplazar la función original
   * Solo se ejecuta si category.html ya ha cargado
   */
  function replaceMatchesQuery() {
    if (window.matchesQuery && typeof window.matchesQuery === 'function') {
      const originalMatchesQuery = window.matchesQuery;
      window.matchesQuery = window.matchesQueryOptimized;
      __NB_SEARCH_DEBUG.log('✅ Función matchesQuery reemplazada con versión optimizada');
      return true;
    }
    return false;
  }

  /**
   * Inicialización
   */
  function init() {
    // Try to replace immediately
    if (replaceMatchesQuery()) {
      return;
    }

    // If not ready yet, wait for DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function checkAndReplace() {
        if (replaceMatchesQuery()) {
          document.removeEventListener('DOMContentLoaded', checkAndReplace);
        }
      });
    }

    // Also try periodically (max 10 times, 100ms interval)
    let attempts = 0;
    const checkInterval = setInterval(function() {
      attempts++;
      if (replaceMatchesQuery() || attempts >= 10) {
        clearInterval(checkInterval);
      }
    }, 100);
  }

  // Log performance stats
  function logStats() {
    __NB_SEARCH_DEBUG.log(
      `📊 Cache Stats: ${cacheHits} hits, ${cacheMisses} misses`,
      `(ratio: ${(cacheHits / (cacheHits + cacheMisses) * 100).toFixed(1)}%)`
    );
  }

  // Expose stats function
  window.__NB_SEARCH_DEBUG.getStats = logStats;

  // Clean cache every minute to prevent memory leaks
  setInterval(function() {
    if (textNormalizationCache.size > 500) {
      // Clear 25% of cache
      let toDelete = Math.ceil(textNormalizationCache.size * 0.25);
      for (const key of textNormalizationCache.keys()) {
        if (toDelete <= 0) break;
        textNormalizationCache.delete(key);
        toDelete--;
      }
      __NB_SEARCH_DEBUG.log(`🧹 Cache limpiado: ${textNormalizationCache.size} items restantes`);
    }
  }, 60000);

  // Initialize
  init();

  // Log initialization complete
  console.log('✅ Natural Be - Búsqueda optimizada cargada');

})();
