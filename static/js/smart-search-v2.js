// ============================================
// NATURAL BE - BÚSQUEDA INTELIGENTE V2
// ============================================
// Sistema de autocompletado SIN interferir con búsqueda normal

(() => {
  'use strict';

  const SEARCH = {
    index: [],
    synonyms: {
      'vitamina c': ['acido ascorbico', 'ascorbico', 'vit c'],
      'omega 3': ['omega3', 'aceite pescado', 'fish oil'],
      'colageno': ['colágeno', 'colagen', 'collagen'],
      'magnesio': ['mg', 'magnesium'],
      'calcio': ['ca', 'calcium'],
      'biotina': ['biotin', 'vitamina b7', 'vitamina h'],
      'vitamina d': ['vit d', 'vitamina d3', 'd3'],
      'vitamina e': ['vit e', 'tocoferol'],
      'zinc': ['zn'],
      'hierro': ['fe', 'iron']
    },

    init() {
      if (typeof window.PRODUCTS === 'undefined') {
        setTimeout(() => this.init(), 100);
        return;
      }

      this.buildIndex();
      this.attachListeners();
      console.log('✓ Smart Search V2 initialized (non-intrusive)');
    },

    buildIndex() {
      this.index = window.PRODUCTS.map(p => {
        const keywords = [
          p.nombre || '',
          p.name || '',
          p.marca || '',
          p.brand || '',
          p.categoria || '',
          p.category || '',
          p.subcategoria || '',
          p.descripcion_corta || '',
          p.description || '',
          ...(p.tags || []),
          ...(p.etiquetas || [])
        ].join(' ').toLowerCase();

        return {
          id: p.id,
          slug: p.slug,
          name: p.nombre || p.name,
          brand: p.marca || p.brand,
          category: p.categoria || p.category,
          price: p.precio || p.precio_oferta,
          image: p.imagen_principal || p.image,
          keywords: keywords,
          nameNormalized: this.normalize(p.nombre || p.name || '')
        };
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

    expandQuery(query) {
      const normalized = this.normalize(query);
      const expanded = [normalized];

      Object.entries(this.synonyms).forEach(([key, values]) => {
        if (normalized.includes(key)) {
          expanded.push(...values);
        }
        values.forEach(synonym => {
          if (normalized.includes(synonym)) {
            expanded.push(key, ...values);
          }
        });
      });

      return [...new Set(expanded)];
    },

    search(query, limit = 8) {
      if (!query || query.length < 2) return [];

      const queries = this.expandQuery(query);
      const results = [];
      const seen = new Set();

      this.index.forEach(item => {
        if (seen.has(item.id)) return;

        let score = 0;

        queries.forEach(q => {
          if (item.nameNormalized === q) {
            score += 100;
          } else if (item.nameNormalized.startsWith(q)) {
            score += 50;
          } else if (item.nameNormalized.includes(q)) {
            score += 25;
          } else if (item.keywords.includes(q)) {
            score += 10;
          } else if (this.fuzzyMatch(item.nameNormalized, q)) {
            score += 5;
          }
        });

        if (score > 0) {
          results.push({ ...item, score });
          seen.add(item.id);
        }
      });

      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    },

    fuzzyMatch(text, query) {
      if (Math.abs(text.length - query.length) > 3) return false;
      const distance = this.levenshtein(text, query);
      return distance <= 2;
    },

    levenshtein(a, b) {
      const matrix = [];
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[b.length][a.length];
    },

    attachListeners() {
      const searchInputs = document.querySelectorAll('[data-search-form] input[type="search"]');
      
      searchInputs.forEach(input => {
        const container = this.createSuggestionsContainer(input);
        
        let timeout;
        input.addEventListener('input', (e) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            this.handleSearch(e.target.value, container);
          }, 200);
        });

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
          if (!input.contains(e.target) && !container.contains(e.target)) {
            container.style.display = 'none';
          }
        });

        // Cerrar al hacer focus out
        input.addEventListener('blur', () => {
          setTimeout(() => {
            container.style.display = 'none';
          }, 200);
        });

        // Mostrar al hacer focus si hay texto
        input.addEventListener('focus', () => {
          if (input.value.trim().length >= 2) {
            this.handleSearch(input.value, container);
          }
        });
      });
    },

    createSuggestionsContainer(input) {
      const container = document.createElement('div');
      container.className = 'search-suggestions-v2';
      container.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e0e0e0;
        border-top: none;
        border-radius: 0 0 4px 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        max-height: 400px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
      `;

      input.parentElement.style.position = 'relative';
      input.parentElement.appendChild(container);

      return container;
    },

    handleSearch(query, container) {
      if (!query || query.length < 2) {
        container.style.display = 'none';
        return;
      }

      const results = this.search(query, 8);

      if (results.length === 0) {
        container.innerHTML = `
          <div style="padding: 16px; text-align: center; color: #666; font-size: 14px;">
            No se encontraron sugerencias para "${this.escapeHtml(query)}"
          </div>
        `;
        container.style.display = 'block';
        return;
      }

      container.innerHTML = results.map(item => `
        <a href="./producto/${item.slug}.html" 
           class="search-suggestion-item-v2"
           style="
             display: flex;
             align-items: center;
             padding: 12px;
             text-decoration: none;
             color: inherit;
             border-bottom: 1px solid #f0f0f0;
             transition: background-color 0.2s;
           "
           onmouseover="this.style.backgroundColor='#f5f5f5'"
           onmouseout="this.style.backgroundColor='white'">
          <img src="${this.escapeHtml(item.image || './static/img/placeholder.webp')}" 
               alt="${this.escapeHtml(item.name)}"
               style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px; margin-right: 12px;"
               onerror="this.src='./static/img/placeholder.webp'">
          <div style="flex: 1;">
            <div style="font-weight: 500; margin-bottom: 4px; font-size: 14px;">
              ${this.highlightMatch(item.name, query)}
            </div>
            <div style="font-size: 12px; color: #666;">
              ${this.escapeHtml(item.brand || 'Natural Be')} · ${this.formatPrice(item.price)}
            </div>
          </div>
        </a>
      `).join('');

      container.style.display = 'block';
    },

    highlightMatch(text, query) {
      const normalized = this.normalize(query);
      const escapedText = this.escapeHtml(text);
      
      try {
        const regex = new RegExp(`(${normalized})`, 'gi');
        return escapedText.replace(regex, '<strong style="color: #458500;">$1</strong>');
      } catch (e) {
        return escapedText;
      }
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

  // Inicializar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SEARCH.init());
  } else {
    SEARCH.init();
  }

  window.NB_SEARCH = SEARCH;
})();
