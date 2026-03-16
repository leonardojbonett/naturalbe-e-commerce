/**
 * Natural Be - Smart Search Engine v2 (local, no external dependency)
 * Compatible API: setProducts, searchProducts, getResultSet, ensureFuse, prefetchFuse
 */
(function () {
  "use strict";

  const SYNONYMS = {
    colageno: ["collagen", "colágeno", "hidrolizado"],
    omega: ["omega3", "omega-3", "fish oil", "aceite de pescado"],
    magnesio: ["magnesium", "citrato", "cloruro"],
    probioticos: ["probiotico", "probiotic", "microbiota"],
    vitaminas: ["vitamina", "multivitaminico", "multivitamínico"],
    cabello: ["pelo", "hair"],
    sueno: ["sueño", "dormir", "descanso", "melatonina"],
    estres: ["estrés", "ansiedad", "calma"],
    defensas: ["inmunidad", "sistema inmune", "inmune"],
  };

  const PRIORITY_BRAND_WEIGHT = {
    "funat": 22,
    "healthy america": 19,
    "millennium natural systems": 18,
    "millenium natural systems": 18,
    "botanitas": 14,
    "satibo": 12,
    "natural be": 8
  };

  const INTENT_RULES = [
    {
      tokens: ["colageno", "collagen", "biotina"],
      categories: ["suplementos", "vitaminas"],
      brands: ["funat", "vitalim", "healthy america"],
      weight: 18
    },
    {
      tokens: ["omega", "omega3", "omega-3", "fish", "aceite"],
      categories: ["suplementos", "vitaminas"],
      brands: ["healthy america", "natural be"],
      weight: 16
    },
    {
      tokens: ["energia", "preentreno", "rendimiento", "fuerza"],
      categories: ["nutricion deportiva", "nutricion_deportiva", "suplementos"],
      brands: ["funat", "healthy sports", "optimum nutrition"],
      weight: 16
    },
    {
      tokens: ["cabello", "pelo", "unas", "piel", "beauty"],
      categories: ["vitaminas", "suplementos"],
      brands: ["funat", "healthy america", "botanitas"],
      weight: 14
    },
    {
      tokens: ["defensas", "inmunidad", "inmune", "vitamina c", "zinc"],
      categories: ["vitaminas", "suplementos"],
      brands: ["healthy america", "funat", "essential vitamins"],
      weight: 14
    }
  ];

  /**
   * Merchandising editable:
   * - whenAnyTokens: si la búsqueda contiene alguno de estos tokens
   * - pinProductIds: IDs exactos a fijar primero
   * - pinProductSlugs: slugs exactos a fijar primero
   * - pinBrands: marcas a priorizar al inicio
   *
   * Puedes ajustar esta tabla según campañas comerciales.
   */
  const PIN_RULES = [
    {
      whenAnyTokens: ["colageno", "collagen", "biotina"],
      pinProductSlugs: [
        "colageno-y-biotina-gomas",
        "colageno-hidrolizado-liquido",
        "be-ha-sn-60-softgels"
      ],
      pinBrands: ["funat", "vitalim", "healthy america"]
    },
    {
      whenAnyTokens: ["omega", "omega3", "omega-3", "fish"],
      pinProductSlugs: [
        "omega-3-6-9",
        "omega-3-1000mg",
        "fish-oil-omega3-1200mg-60softgels"
      ],
      pinBrands: ["healthy america", "natural be"]
    },
    {
      whenAnyTokens: ["energia", "preentreno", "rendimiento", "fuerza"],
      pinBrands: ["funat", "healthy sports", "optimum nutrition"]
    },
    {
      whenAnyTokens: ["defensas", "inmunidad", "inmune", "zinc", "vitamina c"],
      pinBrands: ["healthy america", "funat", "essential vitamins"]
    }
  ];

  const TOKEN_STOPWORDS = new Set([
    "de", "del", "la", "el", "los", "las", "para", "con", "y", "en", "por", "un", "una", "x"
  ]);

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    const norm = normalize(text);
    if (!norm) return [];
    return norm.split(" ").filter((t) => t.length > 1 && !TOKEN_STOPWORDS.has(t));
  }

  function unique(arr) {
    return Array.from(new Set(arr));
  }

  function getProductId(product) {
    return String(product?.id || product?.slug || "");
  }

  function getProductName(product) {
    return String(product?.nombre || product?.name || "");
  }

  function getProductBrand(product) {
    return String(product?.marca || product?.brand || "");
  }

  function getProductCategory(product) {
    return String(product?.categoria || product?.category || "");
  }

  function getProductTags(product) {
    const tags = Array.isArray(product?.tags) ? product.tags : [];
    return tags.map((x) => String(x || ""));
  }

  function getProductBenefits(product) {
    const bullets = Array.isArray(product?.beneficios_bullet) ? product.beneficios_bullet : [];
    return bullets.map((x) => String(x || ""));
  }

  function tokenStartsWith(candidateTokens, token) {
    for (let i = 0; i < candidateTokens.length; i += 1) {
      if (candidateTokens[i].startsWith(token)) return true;
    }
    return false;
  }

  function tokenEquals(candidateTokens, token) {
    for (let i = 0; i < candidateTokens.length; i += 1) {
      if (candidateTokens[i] === token) return true;
    }
    return false;
  }

  function expandQueryTokens(tokens) {
    const expanded = [...tokens];
    tokens.forEach((token) => {
      const list = SYNONYMS[token];
      if (Array.isArray(list)) {
        list.forEach((term) => expanded.push(...tokenize(term)));
      }
      Object.keys(SYNONYMS).forEach((key) => {
        const values = SYNONYMS[key];
        if (Array.isArray(values) && values.map(normalize).includes(token)) {
          expanded.push(...tokenize(key));
        }
      });
    });
    return unique(expanded);
  }

  function includesAnyToken(tokens, candidates) {
    for (let i = 0; i < candidates.length; i += 1) {
      if (tokens.includes(normalize(candidates[i]))) return true;
    }
    return false;
  }

  function includesText(haystack, needle) {
    const h = normalize(haystack);
    const n = normalize(needle);
    if (!h || !n) return false;
    return h.includes(n);
  }

  function normalizeSlug(value) {
    return normalize(String(value || ""))
      .replace(/^producto\s+/i, "")
      .replace(/\.html?$/i, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getDocSlug(doc) {
    return normalizeSlug(doc.product?.slug || doc.product?.product_slug || "");
  }

  function findActivePinRules(queryTokensExpanded) {
    return PIN_RULES.filter((rule) => {
      const tokens = Array.isArray(rule.whenAnyTokens) ? rule.whenAnyTokens : [];
      return tokens.some((token) => queryTokensExpanded.includes(normalize(token)));
    });
  }

  function applyPinRules(ranked, queryTokensExpanded) {
    const activeRules = findActivePinRules(queryTokensExpanded);
    if (!activeRules.length || !ranked.length) return ranked;

    const byId = new Map();
    ranked.forEach((entry) => byId.set(String(entry.doc.__id), entry));

    const bySlug = new Map();
    ranked.forEach((entry) => {
      const slug = getDocSlug(entry.doc);
      if (slug) bySlug.set(slug, entry);
    });

    const pinned = [];
    const pinnedIds = new Set();
    const pushPinned = (entry, pinBoost = 10000) => {
      if (!entry) return;
      const key = String(entry.doc.__id);
      if (pinnedIds.has(key)) return;
      pinnedIds.add(key);
      pinned.push({ doc: entry.doc, score: entry.score + pinBoost });
    };

    activeRules.forEach((rule, idx) => {
      const baseBoost = 20000 - idx * 1000;
      (rule.pinProductIds || []).forEach((id) => {
        pushPinned(byId.get(String(id)), baseBoost + 400);
      });
      (rule.pinProductSlugs || []).forEach((slug) => {
        pushPinned(bySlug.get(normalizeSlug(slug)), baseBoost + 300);
      });
      if (Array.isArray(rule.pinBrands) && rule.pinBrands.length) {
        ranked.forEach((entry) => {
          const brand = normalize(entry.doc.__brand);
          if (rule.pinBrands.some((b) => includesText(brand, b))) {
            pushPinned(entry, baseBoost + 120);
          }
        });
      }
    });

    if (!pinned.length) return ranked;

    const merged = [...pinned];
    ranked.forEach((entry) => {
      const key = String(entry.doc.__id);
      if (!pinnedIds.has(key)) merged.push(entry);
    });
    return merged;
  }

  const ENGINE = {
    products: [],
    docs: [],
    docsById: new Map(),
    lastQuery: "",
    lastResultSet: null,
    fusePromise: null,

    normalize,
    getProductId,

    buildDocs(list) {
      return list.map((product) => {
        const id = getProductId(product);
        const name = normalize(getProductName(product));
        const brand = normalize(getProductBrand(product));
        const category = normalize(getProductCategory(product));
        const tags = normalize(getProductTags(product).join(" "));
        const benefits = normalize(getProductBenefits(product).join(" "));
        const searchable = [name, brand, category, tags, benefits].join(" ").trim();
        return {
          __id: id,
          __name: name,
          __brand: brand,
          __category: category,
          __tags: tags,
          __benefits: benefits,
          __tokens: unique(tokenize(searchable)),
          __searchable: searchable,
          product,
        };
      });
    },

    setProducts(list) {
      this.products = Array.isArray(list) ? list : [];
      this.docs = this.buildDocs(this.products);
      this.docsById = new Map(this.docs.map((doc) => [doc.__id, doc]));
      this.lastQuery = "";
      this.lastResultSet = null;
    },

    scoreDoc(doc, queryNorm, queryTokensExpanded) {
      let score = 0;
      const name = doc.__name;
      const brand = doc.__brand;
      const category = doc.__category;
      const searchable = doc.__searchable;

      if (!queryNorm) return score;

      if (name === queryNorm) score += 220;
      if (name.startsWith(queryNorm)) score += 160;
      if (searchable.includes(queryNorm)) score += 90;
      if (brand === queryNorm) score += 80;
      if (brand.startsWith(queryNorm)) score += 40;

      const tokenPool = doc.__tokens;
      queryTokensExpanded.forEach((token) => {
        if (tokenEquals(tokenPool, token)) {
          score += 35;
          return;
        }
        if (tokenStartsWith(tokenPool, token)) {
          score += 16;
          return;
        }
        if (searchable.includes(token)) {
          score += 8;
        }
      });

      if (Object.prototype.hasOwnProperty.call(PRIORITY_BRAND_WEIGHT, brand)) {
        score += PRIORITY_BRAND_WEIGHT[brand];
      }

      for (let i = 0; i < INTENT_RULES.length; i += 1) {
        const rule = INTENT_RULES[i];
        if (!includesAnyToken(queryTokensExpanded, rule.tokens)) continue;
        if (rule.categories.some((c) => includesText(category, c))) {
          score += rule.weight;
        }
        if (rule.brands.some((b) => includesText(brand, b))) {
          score += Math.round(rule.weight * 0.8);
        }
      }

      if (doc.product?.isPopular) score += 6;
      if (doc.product?.isNew) score += 3;
      if (doc.product?.stock_bajo) score += 2;

      return score;
    },

    rank(query, sourceDocs) {
      const queryNorm = normalize(query);
      if (!queryNorm) return sourceDocs.map((doc) => ({ doc, score: 1 }));
      const queryTokens = tokenize(queryNorm);
      const queryTokensExpanded = expandQueryTokens(queryTokens);
      let ranked = [];
      for (let i = 0; i < sourceDocs.length; i += 1) {
        const doc = sourceDocs[i];
        const score = this.scoreDoc(doc, queryNorm, queryTokensExpanded);
        if (score > 0) ranked.push({ doc, score });
      }
      ranked.sort((a, b) => b.score - a.score);
      ranked = applyPinRules(ranked, queryTokensExpanded);
      return ranked;
    },

    searchProducts(query, candidates) {
      const queryNorm = normalize(query);
      const source = Array.isArray(candidates) ? candidates : this.products;
      if (!queryNorm) return source;
      if (!source.length) return [];

      const sourceIds = new Set(source.map((p) => getProductId(p)));
      const sourceDocs = this.docs.filter((doc) => sourceIds.has(doc.__id));
      const ranked = this.rank(queryNorm, sourceDocs);

      if (!ranked.length) {
        return source.filter((p) => normalize([
          getProductName(p),
          getProductBrand(p),
          getProductCategory(p),
          getProductTags(p).join(" "),
          getProductBenefits(p).join(" ")
        ].join(" ")).includes(queryNorm));
      }

      return ranked.map((entry) => entry.doc.product);
    },

    getResultSet(query) {
      const queryNorm = normalize(query);
      if (!queryNorm) return null;
      if (queryNorm === this.lastQuery && this.lastResultSet) return this.lastResultSet;
      const ranked = this.rank(queryNorm, this.docs);
      const set = new Set(ranked.map((entry) => entry.doc.__id));
      this.lastQuery = queryNorm;
      this.lastResultSet = set;
      return set;
    },

    getSuggestions(term, options = {}) {
      const queryNorm = normalize(term);
      const maxItems = Number(options.maxItems || 8);
      const products = Array.isArray(options.products) ? options.products : this.products;
      if (!queryNorm || queryNorm.length < 2) return [];

      const rankedProducts = this.searchProducts(queryNorm, products).slice(0, Math.max(4, maxItems));
      const productItems = rankedProducts.slice(0, 6).map((p) => ({
        type: "producto",
        label: getProductName(p),
        url: p.url || p.link || "",
        category: getProductCategory(p)
      }));

      const categorySet = new Set();
      products.forEach((p) => {
        const category = getProductCategory(p);
        const normCategory = normalize(category);
        if (!category || !normCategory) return;
        if (normCategory.includes(queryNorm)) categorySet.add(category);
      });
      const categoryItems = Array.from(categorySet).slice(0, 3).map((category) => ({
        type: "categoria",
        label: `Ver todos los productos de ${category}`,
        category
      }));

      return [...productItems, ...categoryItems].slice(0, maxItems);
    },

    ensureFuse() {
      // Compatibilidad legacy: algunos módulos llaman ensureFuse/getResultSet.
      return Promise.resolve(true);
    },

    prefetchFuse() {
      return;
    }
  };

  window.NB_SEARCH_ENGINE = ENGINE;

  function bindPrefetch() {
    const ids = ["siteSearch", "productSearch", "filterSearch", "headerSearch"];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const trigger = () => ENGINE.prefetchFuse();
      el.addEventListener("focus", trigger, { passive: true, once: true });
      el.addEventListener("keydown", trigger, { passive: true, once: true });
      el.addEventListener("pointerdown", trigger, { passive: true, once: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindPrefetch);
  } else {
    bindPrefetch();
  }
})();
