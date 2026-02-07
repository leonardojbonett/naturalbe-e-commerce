(() => {
  const DATA_VERSION = "2026-02-05";
  window.NB_DATA_VERSION = window.NB_DATA_VERSION || DATA_VERSION;
  const PLACEHOLDER_IMAGE = "./static/img/placeholder.webp";

  // Cache reset helper: use ?clearcache=1 to unregister SW + clear caches
  (function handleCacheReset() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      if (!params.has("clearcache")) return;
      const clearAndReload = async () => {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
        if (window.caches && caches.keys) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        params.delete("clearcache");
        const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash || ""}`;
        window.location.replace(next);
      };
      clearAndReload();
    } catch (err) {
      console.warn("Cache reset failed:", err);
    }
  })();
  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  const sanitizeUrl = (value) => {
    const raw = String(value || "");
    if (/^\s*javascript:/i.test(raw)) return "#";
    return raw;
  };

  const formatCOP = (value) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(Number(value || 0));

  const normalizeImageSrc = (src) => {
    if (!src) return PLACEHOLDER_IMAGE;
    if (/^https?:\/\//i.test(src)) return src;
    if (src.startsWith("//")) return `/${src.replace(/^\/+/, "")}`;
    if (window.location && window.location.protocol === "file:") {
      if (/^[a-zA-Z]:[\\/]/.test(src)) return src;
      if (src.startsWith("/")) return `.${src}`;
      return src;
    }
    if (src.startsWith("/")) return src;
    return `/${src.replace(/^\.?\//, "")}`;
  };

  const buildPicture = (product, width = 320, height = 240, eager = false) => {
    const imgSrc = sanitizeUrl(normalizeImageSrc(
      product.imagen_principal ||
        product.imagen_principal_webp ||
        product.image ||
        PLACEHOLDER_IMAGE
    ));
    const webpSrc = product.imagen_principal_webp
      ? sanitizeUrl(normalizeImageSrc(product.imagen_principal_webp))
      : "";
    
    // ALT optimizado con marca + nombre + categoría
    const altText = `${product.marca || ''} ${product.nombre || product.name || ''} - ${product.categoria || 'Suplemento natural'}`.trim();
    
    const loading = eager ? 'eager' : 'lazy';
    const fetchpriority = eager ? ' fetchpriority="high"' : '';
    const aspectRatio = ` style="aspect-ratio: ${width}/${height};"`;
    const onError = ` onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}';"`;
    
    if (webpSrc && /\.webp(\?.*)?$/i.test(webpSrc)) {
      return `<picture><source srcset="${escapeHtml(webpSrc)}" type="image/webp"><img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(altText)}" loading="${loading}"${fetchpriority} decoding="async" width="${width}" height="${height}"${aspectRatio}${onError}></picture>`;
    }
    return `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(altText)}" loading="${loading}"${fetchpriority} decoding="async" width="${width}" height="${height}"${aspectRatio}${onError}>`;
  };

  const buildProductCardHtml = (product, eager = false) => {
    const price = product.precio_oferta || product.precio || product.price || 0;
    const originalPrice = product.precio_oferta ? product.precio : null;
    const discount = product.discountPercent || (originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0);
    const badge = product.badgeLabel || product.badge || "";
    const isNew = product.isNew ? "Nuevo" : "";
    const ratingValue = product.rating_value || 0;
    const ratingCount = product.rating_count || 0;
    const ratingText = ratingValue ? `${ratingValue.toFixed(1)}/5 (${ratingCount || 0})` : "Valorado por clientes";
    const badges = [badge, isNew, discount ? `-${discount}%` : ""].filter(Boolean);
    const description = product.descripcion_corta || product.description || "";

    // Build product detail URL using shared helper
    const url = sanitizeUrl(
      (window.NaturalBe && typeof window.NaturalBe.buildProductURL === 'function')
        ? window.NaturalBe.buildProductURL(product)
        : (product.slug ? `./product.html?slug=${encodeURIComponent(product.slug)}` : './product.html')
    );
    const safeName = escapeHtml(product.nombre || product.name || "");
    const safeDesc = escapeHtml(description || "");
    const safeUrl = escapeHtml(url);
    const safeBadgeHtml = badges.map((b) => `<span class="product-badge">${escapeHtml(b)}</span>`).join("");
    const safeImgAttr = escapeHtml(sanitizeUrl(product.imagen_principal || product.image || ""));
    return `
      <article class="product-card" itemscope itemtype="https://schema.org/Product">
        <a class="product-card__media" href="${safeUrl}">
          ${buildPicture(product, 320, 240, eager)}
        </a>
        <div class="product-card__body">
          <div class="product-card__badges">
            ${safeBadgeHtml}
          </div>
          <h3 class="product-card__title" itemprop="name">
            <a href="${safeUrl}">${safeName}</a>
          </h3>
          ${description ? `<p class="product-card__desc" itemprop="description">${safeDesc}</p>` : ""}
          <div class="product-card__rating">${ratingText}</div>
          <div class="product-card__price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <meta itemprop="priceCurrency" content="COP">
            <meta itemprop="price" content="${price}">
            <meta itemprop="availability" content="https://schema.org/InStock">
            <span>${formatCOP(price)}</span>
            ${originalPrice ? `<span class="price-old">${formatCOP(originalPrice)}</span>` : ""}
            ${discount ? `<span class="price-save">Ahorra ${discount}%</span>` : ""}
          </div>
          <div class="product-card__actions">
            <button class="btn-primary" type="button" data-add-to-cart="1" data-product-id="${product.id}" data-product-name="${safeName}" data-product-price="${price}" data-product-image="${safeImgAttr}">Agregar al carrito</button>
            <a class="btn-ghost" href="${safeUrl}">Ver detalle</a>
          </div>
        </div>
      </article>
    `;
  };

  const renderProductGrid = (list, container) => {
    if (!container) return;
    if (!list.length) {
      container.innerHTML = '<p class="section-subtitle">No hay productos disponibles por ahora.</p>';
      return;
    }
    // Primeras 6 tarjetas con eager loading para mejorar LCP
    container.innerHTML = list.map((product, index) => {
      const isAboveFold = index < 6;
      return buildProductCardHtml(product, isAboveFold);
    }).join("");
    attachAddToCartHandler(container);
    attachImageErrorReporter(container);
  };

  const attachAddToCartHandler = (container) => {
    if (!container || container.dataset.cartBound === "1") return;
    container.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-add-to-cart]");
      if (!btn) return;
      if (typeof addToCart !== "function") return;
      addToCart(
        String(btn.dataset.productId || ""),
        String(btn.dataset.productName || ""),
        Number(btn.dataset.productPrice || 0),
        String(btn.dataset.productImage || "")
      );
    });
    container.dataset.cartBound = "1";
  };

  const attachImageErrorReporter = (container) => {
    if (!container || container.dataset.imageErrorBound === "1") return;
    const selector = container.dataset.imageStatus || "";
    const statusEl = selector
      ? document.querySelector(selector)
      : document.getElementById("catalogStatus");
    if (!statusEl) return;
    const onError = (event) => {
      const target = event.target;
      if (!target || target.tagName !== "IMG") return;
      const src = target.getAttribute("src") || "";
      if (!src) return;
      const safeSrc = escapeHtml(sanitizeUrl(src));
      statusEl.innerHTML = `
        <div class="catalog-alert">
          <span>No pudimos cargar una imagen del catalogo.</span>
          <small>URL: ${safeSrc}</small>
        </div>
      `;
      container.removeEventListener("error", onError, true);
    };
    container.addEventListener("error", onError, true);
    container.dataset.imageErrorBound = "1";
  };

  const initSearchForms = () => {
    document.querySelectorAll("[data-search-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = form.querySelector("input[type='search']");
        if (!input) return;
        const query = input.value.trim();
        if (!query) return;
        window.location.href = `category.html?q=${encodeURIComponent(query)}`;
      });
    });
  };

  const initMegaMenu = () => {
    const toggle = document.querySelector("[data-mega-toggle]");
    const menu = document.querySelector("[data-mega-menu]");
    if (!toggle || !menu) return;

    let lastFocused = null;

    const setMenuState = (isOpen) => {
      menu.classList.toggle("is-open", isOpen);
      menu.hidden = !isOpen;
      menu.setAttribute("aria-hidden", isOpen ? "false" : "true");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    };

    const closeMenu = () => {
      setMenuState(false);
      if (lastFocused) lastFocused.focus();
    };

    const openMenu = () => {
      lastFocused = document.activeElement;
      setMenuState(true);
      const firstLink = menu.querySelector("a");
      if (firstLink) firstLink.focus();
    };

    const trapFocus = (event) => {
      if (!menu.classList.contains("is-open") || event.key !== "Tab") return;
      const focusables = menu.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])");
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    setMenuState(false);

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = !menu.classList.contains("is-open");
      if (willOpen) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    menu.addEventListener("keydown", trapFocus);
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      if (!menu.contains(event.target) && event.target !== toggle) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("is-open")) {
        closeMenu();
      }
    });

    window.addEventListener("scroll", () => {
      if (window.innerWidth < 900 && menu.classList.contains("is-open")) {
        closeMenu();
      }
    }, { passive: true });
  };

  const initCarousels = () => {
    const setupCarousel = (carousel) => {
      if (!carousel || carousel.dataset.carouselBound === "1") return;
      const track = carousel.querySelector("[data-carousel-track]");
      const prev = carousel.querySelector("[data-carousel-prev]");
      const next = carousel.querySelector("[data-carousel-next]");
      if (!track || !prev || !next) return;

      const scrollByCard = (direction) => {
        const card = track.querySelector(".product-card");
        const amount = card ? card.getBoundingClientRect().width + 16 : 260;
        track.scrollBy({ left: direction * amount, behavior: "smooth" });
      };

      prev.addEventListener("click", () => scrollByCard(-1));
      next.addEventListener("click", () => scrollByCard(1));
      carousel.dataset.carouselBound = "1";
    };

    const carousels = Array.from(document.querySelectorAll("[data-carousel]"));
    if (!carousels.length) return;

    if (!("IntersectionObserver" in window)) {
      carousels.forEach(setupCarousel);
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setupCarousel(entry.target);
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "200px" });

    carousels.forEach((carousel) => observer.observe(carousel));
  };

  const initCartTriggers = () => {
    document.querySelectorAll("[data-cart-trigger]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (typeof toggleCart === "function") toggleCart();
      });
    });
  };

  // Load products data from JSON
  let productsCache = null;
  const loadProductsData = async (options = {}) => {
    if (!options.force && productsCache) {
      return Promise.resolve(productsCache);
    }
    
    try {
      const version = window.NB_DATA_VERSION || "2026-02-05";
      // Try multiple paths for compatibility
      const paths = [
        `/static/data/productos.json?v=${encodeURIComponent(version)}`,
        `./static/data/productos.json?v=${encodeURIComponent(version)}`,
        `https://naturalbe.com.co/static/data/productos.json?v=${encodeURIComponent(version)}`
      ];
      
      let response = null;
      let lastError = null;
      
      for (const url of paths) {
        try {
          response = await fetch(url);
          if (response.ok) {
            break;
          }
        } catch (err) {
          lastError = err;
          continue;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to load products from all paths. Last error: ${lastError?.message}`);
      }
      
      const data = await response.json();
      window.ALL_PRODUCTS = Array.isArray(data) ? data : data.productos || [];
      
      // Create index by slug for quick lookup
      window.PRODUCTS_BY_SLUG = {};
      window.ALL_PRODUCTS.forEach(product => {
        if (product.slug) {
          window.PRODUCTS_BY_SLUG[product.slug] = product;
        }
      });
      
      productsCache = window.ALL_PRODUCTS;
      window.NB_CATALOG_ERROR = false;
      return window.ALL_PRODUCTS;
    } catch (error) {
      window.ALL_PRODUCTS = [];
      window.NB_CATALOG_ERROR = true;
      return [];
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    initSearchForms();
    initMegaMenu();
    initCarousels();
    initCartTriggers();
  });

  window.nbMarketplace = {
    formatCOP,
    buildProductCardHtml,
    renderProductGrid
  };

  window.loadProductsData = loadProductsData;
})();
