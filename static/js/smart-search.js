// ============================================
// NATURAL BE - BÚSQUEDA INTELIGENTE
// ============================================
// Sistema de búsqueda con autocompletado y tolerancia a errores

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
      // Esperar a que PRODUCTS esté disponible
      if (typeof window.PRODUCTS === 'undefined') {
        setTimeout(() => this.init(), 100);
        return;
      }

      this.buildIndex();
      this.attachListeners();
      console.log('✓ Smart Search initialized');
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

      // Agregar sinónimos
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

    search(query, limit = 10) {
      if (!query || query.length < 2) return [];

      const queries = this.expandQuery(query);
      const results = [];
      const seen = new Set();

      this.index.forEach(item => {
        if (seen.has(item.id)) return;

        let score = 0;

        queries.forEach(q => {
          // Coincidencia exacta en nombre
          if (item.nameNormalized === q) {
            score += 100;
          }
          // Comienza con la búsqueda
          else if (item.nameNormalized.startsWith(q)) {
            score += 50;
          }
          // Contiene la búsqueda
          else if (item.nameNormalized.includes(q)) {
            score += 25;
          }
          // Coincidencia en keywords
          else if (item.keywords.includes(q)) {
            score += 10;
          }
          // Fuzzy match (tolerancia a errores)
          else if (this.fuzzyMatch(item.nameNormalized, q)) {
            score += 5;
          }
        });

        if (score > 0) {
          results.push({ ...item, score });
          seen.add(item.id);
        }
      });

      // Ordenar por score descendente
      results.sort((a, b) => b.score - a.score);

      return results.slice(0, limit);
    },

    fuzzyMatch(text, query) {
      // Tolerancia a 1-2 caracteres de diferencia
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
        // Crear contenedor de sugerencias
        const container = this.createSuggestionsContainer(input);
        
        // Debounce para no buscar en cada tecla
        let timeout;
        input.addEventListener('input', (e) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            this.handleSearch(e.target.value, container, input);
          }, 200);
        });

        // Cerrar sugerencias al hacer click fuera
        document.addEventListener('click', (e) => {
          if (!input.contains(e.target) && !container.contains(e.target)) {
            container.style.display = 'none';
          }
        });

        // Navegación con teclado
        input.addEventListener('keydown', (e) => {
          // Solo manejar navegación si hay sugerencias visibles
          if (container.style.display === 'block') {
            this.handleKeyboard(e, container);
          }
        });
        
        // Cerrar sugerencias cuando el usuario hace submit
        const form = input.closest('form');
        if (form) {
          form.addEventListener('submit', () => {
            container.style.display = 'none';
          });
        }
      });
    },

    createSuggestionsContainer(input) {
      const container = document.createElement('div');
      container.className = 'search-suggestions';
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

    handleSearch(query, container, input) {
      if (!query || query.length < 2) {
        container.style.display = 'none';
        return;
      }

      const results = this.search(query, 8);

      if (results.length === 0) {
        container.innerHTML = `
          <div style="padding: 16px; text-align: center; color: #666;">
            No se encontraron resultados para "${this.escapeHtml(query)}"
          </div>
        `;
        container.style.display = 'block';
        return;
      }

      container.innerHTML = results.map((item, index) => `
        <a href="./producto/${item.slug}.html" 
           class="search-suggestion-item"
           data-index="${index}"
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
            <div style="font-weight: 500; margin-bottom: 4px;">
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
      const regex = new RegExp(`(${normalized})`, 'gi');
      return this.escapeHtml(text).replace(regex, '<strong>$1</strong>');
    },

    handleKeyboard(e, container) {
      const items = container.querySelectorAll('.search-suggestion-item');
      if (items.length === 0) return;

      const current = container.querySelector('.search-suggestion-item[data-selected="true"]');
      let index = current ? parseInt(current.dataset.index) : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        index = Math.min(index + 1, items.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        index = Math.max(index - 1, 0);
      } else if (e.key === 'Enter' && index >= 0) {
        // Solo prevenir Enter si hay una sugerencia seleccionada
        e.preventDefault();
        items[index].click();
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        container.style.display = 'none';
        return;
      } else {
        return;
      }

      // Actualizar selección
      items.forEach((item, i) => {
        if (i === index) {
          item.setAttribute('data-selected', 'true');
          item.style.backgroundColor = '#f5f5f5';
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.removeAttribute('data-selected');
          item.style.backgroundColor = 'white';
        }
      });
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
    document.addEventListener('DOMContentLoaded', () => SEARCH.init());
  } else {
    SEARCH.init();
  }

  // Exponer globalmente para debugging
  window.NB_SEARCH = SEARCH;
})();
