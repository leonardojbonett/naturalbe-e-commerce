// WebP Support Detection and Optimization - v2026-01-13
(function() {
  'use strict';
  
  // Detectar soporte WebP
  function checkWebPSupport() {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }
  
  // Crear picture element con WebP fallback
  function createPictureElement(src, alt, width, height, loading = 'lazy', eager = false) {
    const isFile = window.location && window.location.protocol === 'file:';
    const basePath = isFile ? './' : '/';
    
    // Generar URLs WebP y fallback
    const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const absoluteWebp = src.startsWith('http') ? webpSrc : `${basePath}${webpSrc.replace(/^\.?\//, '')}`;
    const absoluteSrc = src.startsWith('http') ? src : `${basePath}${src.replace(/^\.?\//, '')}`;
    
    const loadingAttr = eager ? 'eager' : loading;
    const fetchpriority = eager ? 'fetchpriority="high"' : '';
    
    return `
      <picture>
        <source srcset="${absoluteWebp}" type="image/webp">
        <img src="${absoluteSrc}" 
             alt="${alt}" 
             width="${width}" 
             height="${height}" 
             loading="${loadingAttr}" 
             decoding="async" 
             ${fetchpriority}
             onerror="this.onerror=null;this.src='${basePath}static/img/placeholder.webp';">
      </picture>
    `;
  }
  
  // Optimizar imágenes existentes en la página
  function optimizeExistingImages() {
    const images = document.querySelectorAll('img[data-webp-optimized]');
    images.forEach(img => {
      const src = img.dataset.src || img.src;
      const alt = img.alt || '';
      const width = img.width || 320;
      const height = img.height || 240;
      const loading = img.dataset.loading || 'lazy';
      const eager = img.dataset.eager === 'true';
      
      const picture = createPictureElement(src, alt, width, height, loading, eager);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = picture;
      
      const pictureElement = tempDiv.firstElementChild;
      img.parentNode.replaceChild(pictureElement, img);
    });
  }
  
  // Función para buildProductCardHtml con WebP
  function buildProductCardHtmlWithWebP(product, eager = false) {
    const price = product.precio_oferta || product.precio || product.price || 0;
    const originalPrice = product.precio_oferta ? product.precio : null;
    const discount = product.discountPercent || (originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0);
    const badge = product.badgeLabel || product.badge || "";
    const isNew = product.isNew ? "Nuevo" : "";
    const description = product.descripcion_corta || product.description || "";
    
    // URLs optimizadas
    const url = sanitizeUrl(product.url || (product.slug ? `/producto/${encodeURIComponent(product.slug)}` : `/product.html`));
    const safeName = escapeHtml(product.nombre || product.name || "");
    const safeDesc = escapeHtml(description || "");
    const safeUrl = escapeHtml(url);
    
    // Imagen con WebP
    const imgSrc = sanitizeUrl(product.imagen_principal || product.imagen_principal_webp || product.image || '/static/img/placeholder.webp');
    const webpSrc = product.imagen_principal_webp || imgSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const loading = eager ? 'eager' : 'lazy';
    const fetchpriority = eager ? 'fetchpriority="high"' : '';
    
    const pictureHtml = `
      <picture>
        <source srcset="${sanitizeUrl(webpSrc)}" type="image/webp">
        <img src="${sanitizeUrl(imgSrc)}" 
             alt="${safeName}" 
             loading="${loading}" 
             decoding="async" 
             width="320" 
             height="240"
             ${fetchpriority}
             onerror="this.onerror=null;this.src='/static/img/placeholder.webp';">
      </picture>
    `;
    
    return `
      <article class="product-card" itemscope itemtype="https://schema.org/Product">
        <a class="product-card__media" href="${safeUrl}">
          ${pictureHtml}
        </a>
        <div class="product-card__body">
          <div class="product-card__badges">
            ${badge ? `<span class="product-badge">${escapeHtml(badge)}</span>` : ''}
            ${isNew ? `<span class="product-badge">${escapeHtml(isNew)}</span>` : ''}
            ${discount ? `<span class="product-badge">-${discount}%</span>` : ''}
          </div>
          <h3 class="product-card__title" itemprop="name">
            <a href="${safeUrl}">${safeName}</a>
          </h3>
          ${description ? `<p class="product-card__desc" itemprop="description">${safeDesc}</p>` : ""}
          <div class="product-card__price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <meta itemprop="priceCurrency" content="COP">
            <meta itemprop="price" content="${price}">
            <meta itemprop="availability" content="https://schema.org/InStock">
            <span>${formatCOP(price)}</span>
            ${originalPrice ? `<span class="price-old">${formatCOP(originalPrice)}</span>` : ""}
            ${discount ? `<span class="price-save">Ahorra ${discount}%</span>` : ""}
          </div>
          <div class="product-card__actions">
            <button class="btn-primary" type="button" data-add-to-cart="1" data-product-id="${product.id}" data-product-name="${safeName}" data-product-price="${price}" data-product-image="${sanitizeUrl(imgSrc)}">Agregar al carrito</button>
            <a class="btn-ghost" href="${safeUrl}">Ver detalle</a>
          </div>
        </div>
      </article>
    `;
  }
  
  // Formatear precios
  function formatCOP(value) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }
  
  // Sanitizar URL
  function sanitizeUrl(value) {
    const raw = String(value || '');
    if (/^\s*javascript:/i.test(raw)) return '#';
    return raw;
  }
  
  // Escapar HTML
  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  // Inicializar soporte WebP
  async function initWebPSupport() {
    const hasWebPSupport = await checkWebPSupport();
    
    // Agregar clase al body para CSS
    document.body.classList.toggle('webp', hasWebPSupport);
    document.body.classList.toggle('no-webp', !hasWebPSupport);
    
    // Guardar en localStorage para futuras visitas
    localStorage.setItem('webp-support', hasWebPSupport);
    
    console.log(`WebP Support: ${hasWebPSupport ? 'Available' : 'Not Available'}`);
    
    // Optimizar imágenes existentes
    if (hasWebPSupport) {
      optimizeExistingImages();
    }
    
    return hasWebPSupport;
  }
  
  // Exponer funciones globalmente
  window.WebPSupport = {
    init: initWebPSupport,
    createPictureElement,
    buildProductCardHtml: buildProductCardHtmlWithWebP,
    checkSupport: checkWebPSupport
  };
  
  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWebPSupport);
  } else {
    initWebPSupport();
  }
  
})();
