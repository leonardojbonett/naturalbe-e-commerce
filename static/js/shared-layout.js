(() => {
  const basePath = (() => {
    if (window.NB_BASE_PATH) return window.NB_BASE_PATH;
    const path = window.location.pathname || '/';
    const base = path.replace(/[^/]*$/, '');
    window.NB_BASE_PATH = base.startsWith('/') ? base : `/${base}`;
    return window.NB_BASE_PATH;
  })();

  const linkTo = (path) => `${basePath}${path}`;

  const headerHtml = `
    <div class="promo-bar" id="promoBar" aria-live="polite">
      <span class="promo-icon">●</span>
      <span class="promo-message" id="promoMessage">Envios 24-48h en Colombia · Pagos seguros con Wompi · Asesoria por WhatsApp</span>
      <button class="promo-close" type="button" onclick="closePromoBar()" aria-label="Cerrar promocion">×</button>
    </div>
    <header class="market-header" role="banner">
      <div class="market-header__top">
        <div class="market-brand">
          <a class="brand-logo" href="${linkTo('index.html')}" aria-label="Natural Be - Inicio">
            <img src="${linkTo('static/img/logo.webp')}" alt="Natural Be" width="48" height="48">
            <span>Natural Be</span>
          </a>
          <button id="menuToggle" class="hamburger-btn" type="button" aria-label="Abrir menu" aria-haspopup="dialog" aria-expanded="false" aria-controls="mobileMenu">Menu</button>
        </div>
        <form class="market-search" data-search-form>
          <label class="sr-only" for="siteSearch">Buscar</label>
          <input id="siteSearch" type="search" placeholder="Buscar suplementos, marcas o objetivos">
          <button type="submit">Buscar</button>
        </form>
        <div class="market-actions">
          <a class="market-action-link" href="${linkTo('catalogo-suplementos.html')}">Catalogo</a>
          <a class="market-action-link" href="${linkTo('sobre-natural-be.html')}">Confianza</a>
          <a class="market-action-pill" href="https://wa.me/573137212923?utm_source=naturalbe&utm_medium=website&utm_campaign=retail&utm_content=nav_whatsapp" id="navWhatsappLink" data-wa-content="nav_whatsapp" target="_blank" rel="noopener">WhatsApp</a>
          <button class="market-action-pill" type="button" data-cart-trigger>
            Carrito
            <span class="cart-badge">0</span>
          </button>
        </div>
      </div>
      <div class="market-header__nav">
        <div class="mega-wrapper">
          <button class="mega-toggle" type="button" data-mega-toggle aria-expanded="false" aria-controls="megaMenu">Categorias</button>
          <div class="mega-menu" id="megaMenu" data-mega-menu aria-hidden="true" hidden>
            <div class="mega-column">
              <h4>Comprar por objetivo</h4>
              <a href="${linkTo('objetivo-energia.html')}">Energia & rendimiento</a>
              <a href="${linkTo('objetivo-inmunidad.html')}">Inmunidad</a>
              <a href="${linkTo('objetivo-piel.html')}">Piel & colageno</a>
              <a href="${linkTo('objetivo-estres.html')}">Estres & sueno</a>
            </div>
            <div class="mega-column">
              <h4>Suplementos</h4>
              <a href="${linkTo('catalogo-vitaminas.html')}">Vitaminas</a>
              <a href="${linkTo('catalogo-minerales.html')}">Minerales</a>
              <a href="${linkTo('catalogo-omega.html')}">Omega & aceites</a>
              <a href="${linkTo('catalogo-colageno.html')}">Colageno</a>
            </div>
            <div class="mega-column">
              <h4>Explorar</h4>
              <a href="${linkTo('catalogo-energia.html')}">Energia diaria</a>
              <a href="${linkTo('catalogo-inmunidad.html')}">Defensas</a>
              <a href="${linkTo('catalogo-suplementos.html')}">Todos los suplementos</a>
              <a href="${linkTo('catalogo-botanitas.html')}">Marca Botanitas</a>
              <a href="${linkTo('catalogo-satibo.html')}">Marca Satibo</a>
              <a href="${linkTo('blog.html')}">Blog</a>
            </div>
            <div class="mega-column">
              <h4>Mas categorias</h4>
              <a href="${linkTo('catalogo-antioxidantes.html')}">Antioxidantes</a>
              <a href="${linkTo('catalogo-huesos.html')}">Huesos y articulaciones</a>
              <a href="${linkTo('catalogo-cabello.html')}">Cabello</a>
              <a href="${linkTo('catalogo-digestivos.html')}">Digestivos</a>
              <a href="${linkTo('catalogo-cuidado-piel.html')}">Cuidado piel</a>
              <a href="${linkTo('catalogo-cuidado-intimo.html')}">Cuidado intimo</a>
            </div>
          </div>
        </div>
        <nav class="market-links" aria-label="Navegacion rapida">
          <a href="${linkTo('index.html#destacados-marcas')}">Destacados</a>
          <a href="${linkTo('index.html#ofertas')}">Ofertas</a>
          <a href="${linkTo('index.html#nuevos')}">Nuevos</a>
          <a href="${linkTo('index.html#categorias')}">Categorias</a>
          <a href="${linkTo('index.html#proceso')}">Como comprar</a>
        </nav>
      </div>
    </header>
    <div id="menuOverlay" class="menu-overlay" tabindex="-1" aria-hidden="true"></div>
    <div id="mobileMenu" class="mobile-menu" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="mobileMenuTitle">
      <div class="mobile-menu-header">
        <h2 id="mobileMenuTitle" class="sr-only">Menu principal</h2>
        <button class="mobile-menu-close" type="button" onclick="toggleMobileMenu(true)" aria-label="Cerrar menu">×</button>
      </div>
      <nav class="nav-mobile" aria-label="Navegacion principal">
        <a href="${linkTo('index.html#inicio')}">Inicio</a>
        <a href="${linkTo('catalogo-suplementos.html')}">Catalogo</a>
        <a href="${linkTo('index.html#destacados-marcas')}">Destacados</a>
        <a href="${linkTo('index.html#ofertas')}">Ofertas</a>
        <a href="${linkTo('index.html#nuevos')}">Nuevos</a>
        <a href="${linkTo('index.html#categorias')}">Categorias</a>
        <a href="${linkTo('index.html#proceso')}">Como comprar</a>
        <a href="${linkTo('envios.html')}">Envios</a>
        <a href="${linkTo('devoluciones.html')}">Devoluciones</a>
        <a href="${linkTo('blog.html')}">Blog</a>
        <a href="https://wa.me/573137212923?utm_source=naturalbe&utm_medium=website&utm_campaign=retail&utm_content=menu_whatsapp" id="menuWhatsappLink" data-wa-content="menu_whatsapp" target="_blank" rel="noopener">WhatsApp</a>
      </nav>
    </div>
    <a href="https://wa.me/573137212923?text=Hola!%20Quiero%20informacion%20sobre%20los%20productos%20de%20Natural%20Be&utm_source=naturalbe&utm_medium=website&utm_campaign=retail&utm_content=float_whatsapp"
       class="whatsapp-float" id="floatWhatsappLink" data-wa-content="float_whatsapp" target="_blank" aria-label="Contactar por WhatsApp">WA</a>
    <button class="cart-float" type="button" aria-label="Ver carrito de compras" aria-controls="cartModal" aria-expanded="false" data-cart-trigger>
      Carrito
      <span class="cart-badge">0</span>
    </button>
    <div class="cart-modal" id="cartModal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="cartTitle" aria-describedby="cartDesc" onclick="closeCartOnOutsideClick(event)">
      <div class="cart-content" onclick="event.stopPropagation()" tabindex="-1">
        <div class="cart-header">
          <h2 class="cart-title" id="cartTitle">Mi carrito</h2>
          <p class="sr-only" id="cartDesc">Revisa productos, ajusta cantidades y finaliza compra por WhatsApp o Wompi.</p>
          <button class="cart-close" type="button" onclick="toggleCart()" aria-label="Cerrar carrito">×</button>
        </div>
        <div class="cart-body" id="cartBody"></div>
        <div class="recommended-block" id="recommendedContainer" aria-live="polite"></div>
        <div class="cart-footer" id="cartFooter">
          <div class="cart-total">
            <span class="cart-total-label">Total:</span>
            <span class="cart-total-amount" id="cartTotal">$0</span>
          </div>
          <button class="cart-checkout-btn" onclick="checkoutWhatsApp()">Finalizar compra por WhatsApp</button>
          <button class="cart-clear-btn" onclick="clearCart()">Vaciar carrito</button>
          <div class="alt-payment">
            <p class="alt-payment-text">Tambien puedes pagar con Wompi desde aqui.</p>
            <button class="alt-payment-btn" type="button" onclick="checkoutWompi()">Pagar con Wompi</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const footerHtml = `
    <footer class="footer-market">
      <div class="page-shell footer-grid">
        <div>
          <h3>Natural Be</h3>
          <p>Suplementos confiables para energia, inmunidad y bienestar integral.</p>
        </div>
        <div>
          <h4>Categorias</h4>
        <ul class="footer-links">
          <li><a href="${linkTo('catalogo-vitaminas.html')}">Vitaminas</a></li>
          <li><a href="${linkTo('catalogo-minerales.html')}">Minerales</a></li>
          <li><a href="${linkTo('catalogo-omega.html')}">Omega & aceites</a></li>
          <li><a href="${linkTo('catalogo-colageno.html')}">Colageno</a></li>
          <li><a href="${linkTo('catalogo-energia.html')}">Energia</a></li>
          <li><a href="${linkTo('catalogo-inmunidad.html')}">Inmunidad</a></li>
          <li><a href="${linkTo('catalogo-antioxidantes.html')}">Antioxidantes</a></li>
          <li><a href="${linkTo('catalogo-huesos.html')}">Huesos</a></li>
          <li><a href="${linkTo('catalogo-cabello.html')}">Cabello</a></li>
          <li><a href="${linkTo('catalogo-digestivos.html')}">Digestivos</a></li>
          <li><a href="${linkTo('catalogo-cuidado-piel.html')}">Cuidado piel</a></li>
          <li><a href="${linkTo('catalogo-cuidado-intimo.html')}">Cuidado intimo</a></li>
          <li><a href="${linkTo('catalogo-cuidado-adulto.html')}">Cuidado adulto</a></li>
          <li><a href="${linkTo('catalogo-antisepticos.html')}">Antisepticos</a></li>
          <li><a href="${linkTo('catalogo-medicamentos.html')}">Medicamentos</a></li>
          <li><a href="${linkTo('catalogo-botanitas.html')}">Marca Botanitas</a></li>
          <li><a href="${linkTo('catalogo-satibo.html')}">Marca Satibo</a></li>
          <li><a href="${linkTo('catalogo-suplementos.html')}">Todos los suplementos</a></li>
        </ul>
        </div>
        <div>
          <h4>Soporte</h4>
          <ul class="footer-links">
            <li><a href="${linkTo('envios.html')}">Envios</a></li>
            <li><a href="${linkTo('devoluciones.html')}">Devoluciones</a></li>
            <li><a href="${linkTo('terminos.html')}">Terminos y condiciones</a></li>
            <li><a href="${linkTo('privacidad.html')}">Politica de privacidad</a></li>
            <li><a href="${linkTo('sobre-natural-be.html')}">Sobre Natural Be</a></li>
          </ul>
        </div>
        <div>
          <h4>Contacto</h4>
          <p>Barranquilla, Atlantico, Colombia</p>
          <p>WhatsApp: +57 313 721 2923</p>
          <a href="https://wa.me/573137212923?utm_source=naturalbe&utm_medium=website&utm_campaign=retail&utm_content=footer_whatsapp" id="footerWhatsappLink" data-wa-content="footer_whatsapp" target="_blank" rel="noopener">Escribenos</a>
        </div>
      </div>
    </footer>
  `;

  const headerTarget = document.getElementById('siteHeader');
  const footerTarget = document.getElementById('siteFooter');
  if (headerTarget) headerTarget.innerHTML = headerHtml;
  if (footerTarget) footerTarget.innerHTML = footerHtml;
})();
