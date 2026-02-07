/**
 * Natural Be - Unified Search Engine (Fuse.js + fallback)
 * Shared across PLP, header, and cart search logic.
 */
(function() {
  'use strict';

  const ENGINE = {
    products: [],
    fuse: null,
    lastQuery: '',
    lastResultSet: null,
    fusePromise: null,
    options: {
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: '__nombre', weight: 0.45 },
        { name: '__marca', weight: 0.2 },
        { name: '__tags', weight: 0.2 },
        { name: '__beneficios_bullet', weight: 0.15 }
      ]
    },

    normalize(text) {
      return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    },

    normalizeArray(value) {
      if (!Array.isArray(value)) return '';
      return value.map(item => this.normalize(String(item))).join(' ');
    },

    getProductId(product) {
      return String(product?.id || product?.slug || '');
    },

    buildDocs(list) {
      return list.map(product => ({
        __id: this.getProductId(product),
        __nombre: this.normalize(product.nombre || product.name || ''),
        __marca: this.normalize(product.marca || product.brand || ''),
        __tags: this.normalizeArray(product.tags),
        __beneficios_bullet: this.normalizeArray(product.beneficios_bullet),
        product
      }));
    },

    setProducts(list) {
      this.products = Array.isArray(list) ? list : [];
      this.buildIndex();
    },

    buildIndex() {
      this.lastQuery = '';
      this.lastResultSet = null;
      if (!window.Fuse || !this.products.length) {
        this.fuse = null;
        return;
      }
      const docs = this.buildDocs(this.products);
      this.fuse = new window.Fuse(docs, this.options);
    },

    ensureFuse() {
      if (window.Fuse) return Promise.resolve(true);
      if (this.fusePromise) return this.fusePromise;
      this.fusePromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.min.js';
        script.async = true;
        script.onload = () => {
          this.buildIndex();
          resolve(true);
        };
        script.onerror = () => {
          this.fusePromise = null;
          reject(new Error('Fuse.js failed to load'));
        };
        document.head.appendChild(script);
      });
      return this.fusePromise;
    },

    prefetchFuse() {
      this.ensureFuse().catch(() => {});
    },

    getResultSet(query) {
      const normalizedQuery = this.normalize(query);
      if (!normalizedQuery) return null;
      if (normalizedQuery === this.lastQuery && this.lastResultSet) return this.lastResultSet;
      if (!this.fuse) {
        this.ensureFuse().catch(() => {});
        return null;
      }
      const results = this.fuse.search(normalizedQuery);
      const set = new Set(results.map(result => result.item.__id));
      this.lastQuery = normalizedQuery;
      this.lastResultSet = set;
      return set;
    },

    searchProducts(query, candidates) {
      const normalizedQuery = this.normalize(query);
      if (!normalizedQuery) return Array.isArray(candidates) ? candidates : this.products;

      const source = Array.isArray(candidates) ? candidates : this.products;
      const ids = new Set(source.map(p => this.getProductId(p)));

      const resultSet = this.getResultSet(normalizedQuery);
      if (resultSet) {
        return source.filter(p => resultSet.has(this.getProductId(p)));
      }

      this.ensureFuse().catch(() => {});

      // Fallback: normalized contains
      return source.filter(p => {
        const blob = this.normalize([
          p.nombre || p.name || '',
          p.marca || p.brand || '',
          Array.isArray(p.tags) ? p.tags.join(' ') : '',
          Array.isArray(p.beneficios_bullet) ? p.beneficios_bullet.join(' ') : ''
        ].join(' '));
        return blob.includes(normalizedQuery);
      });
    }
  };

  window.NB_SEARCH_ENGINE = ENGINE;

  function bindPrefetch() {
    const inputs = new Set();
    document.querySelectorAll('[data-search-form] input[type="search"]').forEach(input => inputs.add(input));
    const ids = ['siteSearch', 'productSearch', 'filterSearch', 'headerSearch'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) inputs.add(el);
    });

    inputs.forEach(input => {
      input.addEventListener('focus', () => ENGINE.prefetchFuse(), { passive: true, once: true });
      input.addEventListener('keydown', () => ENGINE.prefetchFuse(), { passive: true, once: true });
      input.addEventListener('pointerdown', () => ENGINE.prefetchFuse(), { passive: true, once: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindPrefetch);
  } else {
    bindPrefetch();
  }
})();
