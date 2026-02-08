// ============================================
// NATURAL BE - SHOPPING CART + CATÁLOGO DINÁMICO
// ============================================

(() => {
let cart = [];
Object.defineProperty(window, 'cart', {
  get: () => cart,
  set: (value) => {
    cart = Array.isArray(value) ? value : value;
  },
  configurable: true
});
let currentCategory = 'all';
let currentPriceRange = 'all';
let currentQuery = '';
let productsMap = {};
let currentSort = 'featured';
const NB_MINI_CART_ENABLED = window.NB_MINI_CART_ENABLED !== false;

// Función para ignorar tildes y mayúsculas
function normalizeText(text) {
    return String(text || '')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}
const PLACEHOLDER_IMAGE = `${(window.NB_BASE_PATH || './')}static/img/placeholder.webp`;
let miniCartTimer = null;
const CART_STORAGE_KEY = 'naturalbe_cart';
const getCartStorage = () => {
    try {
        return window.localStorage || window.sessionStorage || null;
    } catch (e) {
        return null;
    }
};
const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const sanitizeUrl = (value) => {
    const raw = String(value || '');
    if (/^\s*javascript:/i.test(raw)) return '#';
    return raw;
};
const toJsString = (value) => JSON.stringify(String(value || ''));
const toJsStringAttr = (value) => escapeHtml(toJsString(value));

function normalizeCategory(value) {
    return normalizeText(value).replace(/[_-]+/g, ' ').trim();
}

function getProductCategory(product) {
    return product?.category || product?.categoria || '';
}

function getSearchableText(product) {
    if (!product) return '';
    const name = product.name || product.nombre || '';
    const brand = product.marca || product.brand || '';
    const tags = Array.isArray(product.tags) ? product.tags.join(' ') : '';
    const benefits = Array.isArray(product.beneficios_bullet) ? product.beneficios_bullet.join(' ') : '';
    return normalizeText([name, brand, tags, benefits].join(' '));
}

function getSearchEngine() {
    return window.NB_SEARCH_ENGINE || null;
}

const isPackProduct = (typeof window.isPackProduct === 'function')
    ? window.isPackProduct
    : (product) => {
        if (!product) return false;
        if (product.es_pack === true || product.is_pack === true) return true;
        const items = product.packItems || product.pack_items || product.packItemsIds;
        return Array.isArray(items) && items.length > 0;
    };

const nbViewedItems = (typeof Set !== 'undefined') ? new Set() : [];
let lastCartFocused = null;
let cartTrapHandlerBound = false;
let wompiLoader = null;
const NB_BASE_PATH = (window.location && window.location.protocol === 'file:') ? './' : '/';

function wompiCheckoutStub() {
    ensureWompiReady()
        .then(() => {
            if (window.checkoutWompi && window.checkoutWompi !== wompiCheckoutStub) {
                window.checkoutWompi();
            } else {
                alert('No pudimos cargar el pago. Intenta de nuevo.');
            }
        })
        .catch(() => {
            alert('No pudimos cargar el pago. Intenta de nuevo.');
        });
}

if (typeof window.checkoutWompi !== 'function') {
    window.checkoutWompi = wompiCheckoutStub;
}

function trapFocusInCart(event) {
    if (event.key !== 'Tab') return;
    const cartModal = document.getElementById('cartModal');
    if (!cartModal || !cartModal.classList.contains('show')) return;
    const focusables = cartModal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
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
}

function isWebpSource(src) {
    return /\.webp(\?.*)?$/i.test(String(src || ''));
}

function getProductImage(product) {
    return product?.image || product?.imagen_principal || PLACEHOLDER_IMAGE;
}

function getProductWebp(product) {
    const candidate = product?.imagen_principal_webp || product?.image_webp || '';
    return isWebpSource(candidate) ? candidate : '';
}

function buildPictureMarkup(product, options = {}) {
    const src = sanitizeUrl(getProductImage(product) || PLACEHOLDER_IMAGE);
    const webp = sanitizeUrl(getProductWebp(product));
    const alt = escapeHtml(options.alt || product?.name || product?.nombre || '');
    const className = options.className ? ` class="${options.className}"` : '';
    const loading = options.loading ? ` loading="${options.loading}"` : '';
    const decoding = ' decoding="async"';
    const sizeAttrs = `${options.width ? ` width="${options.width}"` : ''}${options.height ? ` height="${options.height}"` : ''}`;
    const onError = ` onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}';"`;
    if (webp) {
        return `<picture><source srcset="${escapeHtml(webp)}" type="image/webp"><img src="${escapeHtml(src)}" alt="${alt}"${className}${loading}${decoding}${sizeAttrs}${onError}></picture>`;
    }
    return `<img src="${escapeHtml(src)}" alt="${alt}"${className}${loading}${decoding}${sizeAttrs}${onError}>`;
}

function ensureWompiReady() {
    if (typeof window.checkoutWompi === 'function') {
        return Promise.resolve();
    }
    if (wompiLoader) return wompiLoader;
    wompiLoader = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${NB_BASE_PATH}static/js/wompi-estatico-completo.min.js`;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Wompi load failed'));
        document.head.appendChild(script);
    });
    return wompiLoader;
}

function buildCartEcomItems(cartItems) {
    if (typeof buildEcommerceItems === 'function') {
        return buildEcommerceItems(cartItems.map(item => ({ ...item })));
    }
    return cartItems.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category || null,
        price: item.price,
        quantity: item.quantity || 1,
        image: item.image || ''
    }));
}

function nbTrackViewItem(product) {
    if (typeof nbGa4EcomEvent !== 'function' || typeof nbMapProductToGa4Item !== 'function') return;
    if (!product) return;

    const productId = product.id || product.item_id || product.product_id || null;
    const dedupeKey = productId !== null ? String(productId) : null;

    if (dedupeKey) {
        if (Array.isArray(nbViewedItems)) {
            if (nbViewedItems.indexOf(dedupeKey) !== -1) return;
            nbViewedItems.push(dedupeKey);
        } else if (typeof nbViewedItems.has === 'function' && nbViewedItems.has(dedupeKey)) {
            return;
        } else if (typeof nbViewedItems.add === 'function') {
            nbViewedItems.add(dedupeKey);
        }
    }

    const ga4Item = nbMapProductToGa4Item(product, 1);
    // GA4: view_item (fuente única)
    nbGa4EcomEvent('view_item', [ga4Item], ga4Item.price || 0);
}

// ---------------------------
// Loader de catálogo
// ---------------------------
function ensureProductsReady() {
    if (typeof loadProductsData === 'function') {
        return loadProductsData().then(() => {
            if (Array.isArray(window.PRODUCTS)) {
                productsMap = (typeof buildProductsMap === 'function') ? buildProductsMap(window.PRODUCTS) : {};
                if (window.NB_SEARCH_ENGINE && typeof window.NB_SEARCH_ENGINE.setProducts === 'function') {
                    window.NB_SEARCH_ENGINE.setProducts(window.PRODUCTS);
                }
            }
        });
    }
    if (Array.isArray(window.PRODUCTS)) {
        productsMap = (typeof buildProductsMap === 'function') ? buildProductsMap(window.PRODUCTS) : {};
        if (window.NB_SEARCH_ENGINE && typeof window.NB_SEARCH_ENGINE.setProducts === 'function') {
            window.NB_SEARCH_ENGINE.setProducts(window.PRODUCTS);
        }
    }
    return Promise.resolve(typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
}

// ---------------------------
// Persistencia de carrito
// ---------------------------
function loadCart() {
    let savedCart = null;
    const storage = getCartStorage();
    if (storage) {
        savedCart = storage.getItem(CART_STORAGE_KEY);
    }
    if (!savedCart) {
        try {
            savedCart = window.sessionStorage ? window.sessionStorage.getItem(CART_STORAGE_KEY) : null;
        } catch (e) {
            savedCart = null;
        }
    }
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    updateCartUI();
}

function saveCart() {
    const storage = getCartStorage();
    if (storage) {
        storage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
}

// ---------------------------
// Carrito: operaciones básicas
// ---------------------------
function addToCart(id, name, price, image) {
    const idStr = String(id);
    const productMeta = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(p => String(p.id) === idStr) : null;
    const trackingProduct = productMeta ? { ...productMeta } : { id, name, price, image };
    const packItems = Array.isArray(trackingProduct.packItems) ? trackingProduct.packItems : [];

    const existingItem = cart.find(item => String(item.id) === idStr);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: idStr, name, price, image, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    showCartNotification(name);
    showMiniCart(name);

    if (typeof nbGa4EcomEvent === 'function' && typeof nbMapProductToGa4Item === 'function') {
        const isPack = isPackProduct(trackingProduct);
        const gaItems = [nbMapProductToGa4Item({ ...trackingProduct, item_category: trackingProduct.category || (isPack ? 'packs' : null) }, 1)];
        if (isPack && Array.isArray(packItems)) {
            packItems.forEach(pid => {
                const sub = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(p => p.id === pid) : null;
                if (sub) {
                    gaItems.push(nbMapProductToGa4Item({ ...sub, price: 0, item_category: 'pack_component' }, 1));
                }
            });
        }
        // GA4: add_to_cart (fuente única)
        nbGa4EcomEvent('add_to_cart', gaItems, price);
    }
}

function removeFromCart(id) {
    const idStr = String(id);
    const removedItem = cart.find(item => String(item.id) === idStr) || null;
    cart = cart.filter(item => String(item.id) !== idStr);
    saveCart();
    updateCartUI();

    if (removedItem && typeof nbGa4EcomEvent === 'function' && typeof nbMapProductToGa4Item === 'function') {
        const productMeta = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(p => p.id === removedItem.id) : null;
        const trackingProduct = productMeta ? { ...productMeta } : { ...removedItem };
        const gaItem = nbMapProductToGa4Item(trackingProduct, removedItem.quantity || 1);
        // GA4: remove_from_cart (fuente única)
        nbGa4EcomEvent('remove_from_cart', [gaItem], removedItem.price || 0);
    }
}

function ensureMiniCart() {
    if (!NB_MINI_CART_ENABLED) return null;
    let drawer = document.getElementById('miniCart');
    if (drawer) return drawer;
    drawer = document.createElement('aside');
    drawer.id = 'miniCart';
    drawer.className = 'mini-cart';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `
        <div class="mini-cart-header">
            <span>Carrito actualizado</span>
            <button type="button" class="btn-ghost" data-mini-close>Cerrar</button>
        </div>
        <div class="mini-cart-body">
            <p class="mini-cart-product" data-mini-product>Producto agregado</p>
            <p><strong data-mini-count>0</strong> items · <strong data-mini-total>$0</strong></p>
            <p class="mini-cart-shipping">Envío $15.000 · Gratis desde $100.000.</p>
        </div>
        <div class="mini-cart-actions">
            <button type="button" class="btn-primary" data-mini-view>Ver carrito</button>
            <button type="button" class="btn-ghost" data-mini-continue>Seguir comprando</button>
        </div>
    `;
    document.body.appendChild(drawer);
    const closeBtn = drawer.querySelector('[data-mini-close]');
    const viewBtn = drawer.querySelector('[data-mini-view]');
    const continueBtn = drawer.querySelector('[data-mini-continue]');
    if (closeBtn) closeBtn.addEventListener('click', hideMiniCart);
    if (continueBtn) continueBtn.addEventListener('click', hideMiniCart);
    if (viewBtn) {
        viewBtn.addEventListener('click', () => {
            hideMiniCart();
            if (typeof toggleCart === 'function') toggleCart();
        });
    }
    return drawer;
}

function updateMiniCartSummary(productName, drawerOverride) {
    const drawer = drawerOverride || ensureMiniCart();
    if (!drawer) return;
    const total = getCartTotal();
    const count = getCartItemCount();
    const totalText = (typeof formatCOP === 'function') ? formatCOP(total) : `$${total.toLocaleString('es-CO')}`;
    const productEl = drawer.querySelector('[data-mini-product]');
    const countEl = drawer.querySelector('[data-mini-count]');
    const totalEl = drawer.querySelector('[data-mini-total]');
    if (productEl && productName) productEl.textContent = productName;
    if (countEl) countEl.textContent = count;
    if (totalEl) totalEl.textContent = totalText;
}

function showMiniCart(productName) {
    if (!NB_MINI_CART_ENABLED) return;
    const drawer = ensureMiniCart();
    if (!drawer) return;
    updateMiniCartSummary(productName);
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (miniCartTimer) clearTimeout(miniCartTimer);
    miniCartTimer = setTimeout(() => {
        hideMiniCart();
    }, 5000);
}

function hideMiniCart() {
    const drawer = document.getElementById('miniCart');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (miniCartTimer) clearTimeout(miniCartTimer);
    miniCartTimer = null;
}

function updateQuantity(id, change) {
    const idStr = String(id);
    const item = cart.find(item => String(item.id) === idStr);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            updateCartUI();
            if (change < 0 && typeof nbGa4EcomEvent === 'function' && typeof nbMapProductToGa4Item === 'function') {
                const productMeta = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(p => String(p.id) === String(item.id)) : null;
                const trackingProduct = productMeta ? { ...productMeta } : { ...item };
                const gaItem = nbMapProductToGa4Item(trackingProduct, Math.abs(change));
                // GA4: remove_from_cart (fuente única)
                nbGa4EcomEvent('remove_from_cart', [gaItem], item.price || 0);
            }
        }
    }
}

function clearCart() {
    if (confirm('¿Quieres vaciar tu carrito por ahora?')) {
        clearCartForce();
    }
}

function clearCartForce() {
    cart = [];
    saveCart();
    updateCartUI();
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartItemCount() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

// ---------------------------
// UI del carrito
// ---------------------------
function updateCartUI() {
    const cartBadges = document.querySelectorAll('.cart-badge');
    const cartBody = document.getElementById('cartBody');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartBadges.length || !cartBody || !cartFooter || !cartTotal) return;

    const itemCount = getCartItemCount();
    const total = getCartTotal();
    const subtotal = (typeof computeCartSubtotal === 'function') ? computeCartSubtotal(cart, productsMap) : total;
    const shippingState = (typeof getFreeShippingState === 'function') ? getFreeShippingState({ subtotal, city: window.NB_SELECTED_CITY || '' }) : null;
    
    cartBadges.forEach((badge) => {
        badge.textContent = itemCount;
        badge.style.display = itemCount > 0 ? 'flex' : 'none';
    });

    const miniDrawer = document.getElementById('miniCart');
    if (miniDrawer) {
        updateMiniCartSummary(null, miniDrawer);
    }
    
    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <h3>Tu carrito está vacío por ahora</h3>
                <p>Agrega productos para comenzar tu compra</p>
            </div>
            <div id="shippingWidgetCartEmpty"></div>
        `;
        cartFooter.style.display = 'none';
        if (shippingState && typeof renderShippingWidget === 'function') {
            renderShippingWidget(document.getElementById('shippingWidgetCartEmpty'), shippingState, { compact: false, showCityNote: true });
        }
    } else {
        cartBody.innerHTML = cart.map(item => {
        const safeIdAttr = toJsStringAttr(item.id);
            const safeName = escapeHtml(item.name || '');
            const safeImg = escapeHtml(sanitizeUrl(item.image || PLACEHOLDER_IMAGE));
            return `
            <div class="cart-item">
                <img src="${safeImg}" alt="${safeName}" class="cart-item-image" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}';">
                <div class="cart-item-info">
                    <div class="cart-item-name">${safeName}</div>
                    <div class="cart-item-price">$${item.price.toLocaleString('es-CO')}</div>
                    <div class="cart-item-controls">
                        <button class="cart-qty-btn" onclick="updateQuantity(${safeIdAttr}, -1)">-</button>
                        <span class="cart-qty">${item.quantity}</span>
                        <button class="cart-qty-btn" onclick="updateQuantity(${safeIdAttr}, 1)">+</button>
                        <button class="cart-remove" onclick="removeFromCart(${safeIdAttr})">Eliminar</button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
        
        cartFooter.style.display = 'block';
        let shippingContainer = document.getElementById('shippingWidgetCart');
        if (!shippingContainer) {
            shippingContainer = document.createElement('div');
            shippingContainer.id = 'shippingWidgetCart';
            cartFooter.insertBefore(shippingContainer, cartFooter.firstChild);
        }
        if (shippingState && typeof renderShippingWidget === 'function') {
            renderShippingWidget(shippingContainer, shippingState, { compact: false, showCityNote: true });
        }
        let trustBlock = document.getElementById('cartTrust');
        if (!trustBlock) {
            trustBlock = document.createElement('div');
            trustBlock.id = 'cartTrust';
            trustBlock.className = 'cart-trust';
            cartFooter.appendChild(trustBlock);
        }
        trustBlock.innerHTML = `
            <p class="cart-trust__title">Compra segura Natural Be</p>
            <ul class="cart-trust__list">
                <li>Pagos Wompi: tarjeta, PSE, Nequi y billeteras.</li>
                <li>Envío $15.000 · Gratis desde $100.000.</li>
                <li>Envío 24-48h con guía y soporte directo por WhatsApp.</li>
                <li>Reemplazo o devolución si tu pedido llega con novedad.</li>
            </ul>
        `;
    }
    
    cartTotal.textContent = (typeof formatCOP === 'function') ? formatCOP(total) : `$${total.toLocaleString('es-CO')}`;
    if (shippingState) {
        window.dispatchEvent(new CustomEvent('nb:cart-updated', { detail: { cart: [...cart], subtotal, shipping: shippingState } }));
    }
    
    if (typeof addWompiButtonToCart === 'function') {
        addWompiButtonToCart();
    }

    renderRecommended(cart);
}

function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    const cartTrigger = document.querySelector('.cart-float');
    const cartContent = cartModal ? cartModal.querySelector('.cart-content') : null;
    if (!cartModal) return;

    const willOpen = !cartModal.classList.contains('show');
    cartModal.classList.toggle('show', willOpen);
    cartModal.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
    if (cartTrigger) {
        cartTrigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }

    if (willOpen) {
        lastCartFocused = document.activeElement;
        if (typeof nbGa4EcomEvent === 'function') {
            // GA4: view_cart (fuente unica)
            nbGa4EcomEvent('view_cart', cart, getCartTotal());
        }
        document.body.style.overflow = 'hidden';
        renderRecommended(cart);
        if (cartContent) cartContent.focus();
    } else {
        document.body.style.overflow = 'auto';
        if (lastCartFocused && typeof lastCartFocused.focus === 'function') {
            lastCartFocused.focus();
        }
    }
}

function closeCartOnOutsideClick(event) {
    if (event.target.id === 'cartModal') {
        toggleCart();
    }
}

// ---------------------------
// Recomendaciones
// ---------------------------
function getRecommendedProducts(cartItems, maxItems = 3) {
    if (typeof PRODUCTS === 'undefined') return [];

    const cartIds = new Set(cartItems.map(item => String(item.id)));
    const cartProducts = PRODUCTS.filter(p => cartIds.has(String(p.id)));
    const candidates = PRODUCTS.filter(p => !cartIds.has(String(p.id)) && !isPromoProduct(p));

    const recommendations = [];
    const recommendedIds = new Set(cartIds);

    const addRecommendations = (items) => {
        for (const product of items) {
            if (recommendations.length >= maxItems) break;
            const id = String(product.id);
            if (recommendedIds.has(id)) continue;
            recommendedIds.add(id);
            recommendations.push(product);
        }
    };

    const cartCategories = cartProducts
        .map(p => normalizeCategory(getProductCategory(p)))
        .filter(Boolean);
    const cartText = cartProducts.map(p => getSearchableText(p)).join(' ');
    const hasFacialCare = cartCategories.some(cat =>
        cat.includes('cuidado') && (cat.includes('facial') || cat.includes('piel') || cat.includes('personal'))
    );
    const hasProtein = cartText.includes('proteina');

    const pickByKeyword = (keyword) => {
        const terms = normalizeText(keyword).split(' ').filter(Boolean);
        if (!terms.length) return [];
        return candidates.filter(product => {
            const blob = getSearchableText(product);
            return terms.every(term => blob.includes(term));
        });
    };

    if (hasFacialCare) {
        addRecommendations(pickByKeyword('bloqueador solar'));
    }

    if (hasProtein) {
        addRecommendations(pickByKeyword('creatina'));
    }

    if (recommendations.length < maxItems) {
        const lowStock = candidates.filter(p => p.stock_bajo);
        addRecommendations(lowStock);
    }

    if (recommendations.length < maxItems) {
        const popular = candidates.filter(p => p.isPopular || String(p.badge || '').toLowerCase().includes('vendido'));
        addRecommendations(popular);
    }

    if (recommendations.length < maxItems) {
        addRecommendations(candidates);
    }

    return recommendations.slice(0, maxItems);
}

function renderRecommended(cartItems) {
    const container = document.getElementById('recommendedContainer');
    if (!container) return;

    const recommendations = getRecommendedProducts(cartItems, 3);

    if (!recommendations || recommendations.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    const cardsHtml = recommendations.map(p => {
        const safeIdAttr = toJsStringAttr(p.id);
        const safeName = escapeHtml(p.name || '');
        const safeNameJs = toJsStringAttr(p.name);
        const safeImgJs = toJsStringAttr(p.image || PLACEHOLDER_IMAGE);
        return `
                <div class="recommended-card">
                    <div class="recommended-thumb">
                        ${buildPictureMarkup(p, { alt: p.name, className: 'recommended-thumb-image', loading: 'lazy' })}
                    </div>
                    <div class="recommended-info">
                        <div class="recommended-name">${safeName}</div>
                        <div class="recommended-price">$${p.price.toLocaleString('es-CO')}</div>
                        <button class="recommended-add" onclick="addToCart(${safeIdAttr}, ${safeNameJs}, ${p.price}, ${safeImgJs})" aria-label="Agregar ${safeName} al carrito">
                            Agregar al carrito
                        </button>
                    </div>
                </div>
            `;
    }).join('');
    container.innerHTML = `
        <div class="recommended-header">
            <h4>Te puede interesar</h4>
            <p class="recommended-subtitle">Productos que combinan con tu compra</p>
        </div>
        <div class="recommended-grid">
            ${cardsHtml}
        </div>
    `;

    if (typeof logEvent === 'function') {
        logEvent('view_recommendations', { from: 'cart_modal', count: recommendations.length });
    }
}

function showCartNotification(productName) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #2d8659;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10001;
        animation: slideIn 0.3s ease-out;
    `;
    const safeName = escapeHtml(productName || '');
    notification.innerHTML = `
        <strong>✔ Agregado al carrito</strong><br>
        <small>${safeName}</small>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function checkoutWhatsApp() {
    if (cart.length === 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('Tu carrito está vacío por ahora', 'error');
        } else {
            alert('Tu carrito está vacío por ahora');
        }
        return;
    }
    
    // Mostrar estado de carga
    const checkoutBtn = document.querySelector('[onclick*="checkoutWhatsApp"]');
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Preparando pedido...';
    }
    
    const total = getCartTotal();
    let message = `Hola! 👋 Quisiera armar mi pedido con estos productos:%0A%0A`;
    
    cart.forEach(item => {
        message += `*${item.name}*%0A`;
        message += `Cantidad: ${item.quantity}%0A`;
        message += `Precio: $${item.price.toLocaleString('es-CO')}%0A`;
        message += `Subtotal: $${(item.price * item.quantity).toLocaleString('es-CO')}%0A%0A`;
    });
    
    message += `*TOTAL: $${total.toLocaleString('es-CO')}*%0A%0A`;
    message += `¿Me ayudas a confirmar disponibilidad y costo de envío?`;
    
    if (typeof logEvent === 'function') {
        logEvent('begin_checkout_whatsapp', { total, items: cart });
    }

    if (typeof nbGa4EcomEvent === 'function') {
        // GA4: begin_checkout + add_shipping_info + add_payment_info (WhatsApp)
        nbGa4EcomEvent('begin_checkout', cart, total, { method: 'whatsapp' });
        nbGa4EcomEvent('add_shipping_info', cart, total, { method: 'whatsapp' });
        nbGa4EcomEvent('add_payment_info', cart, total, { method: 'whatsapp' });
    }
    
    // Mostrar toast de éxito
    if (typeof window.showToast === 'function') {
        window.showToast('Abriendo WhatsApp con tu pedido...', 'success');
    }
    
    // Abrir WhatsApp
    window.open(`https://wa.me/573137212923?text=${message}&utm_source=naturalbe&utm_medium=website&utm_campaign=retail&utm_content=checkout_whatsapp`, '_blank');
    
    // Restaurar botón después de 2 segundos
    setTimeout(() => {
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Finalizar por WhatsApp';
        }
    }, 2000);
}

// ---------------------------
// Catálogo dinámico y filtros
// ---------------------------
function getPriceFilter(range, price) {
    if (range === 'low') return price <= 30000;
    if (range === 'mid') return price > 30000 && price <= 40000;
    if (range === 'high') return price > 40000;
    return true;
}

// Ordenamiento UI sin mutar el arreglo original
function sortProductsList(list = []) {
    const arr = Array.isArray(list) ? [...list] : [];
    if (currentSort === 'price-asc') return arr.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (currentSort === 'price-desc') return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (currentSort === 'new') return arr.sort((a, b) => Number(b.isNew || 0) - Number(a.isNew || 0));
    return arr.sort((a, b) => {
        const scoreA = (a.isPopular ? 2 : 0) + (a.isNew ? 0.5 : 0);
        const scoreB = (b.isPopular ? 2 : 0) + (b.isNew ? 0.5 : 0);
        if (scoreA === scoreB) return (a.price || 0) - (b.price || 0);
        return scoreB - scoreA;
    });
}

function isPromoProduct(product) {
    return !!(product && (product.es_pack || product.es_2x1 || product.isPack || product.category === 'packs' || product.offerType === '2x1'));
}



function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
        return;
    }

    const visibleProducts = products.filter(p => !isPromoProduct(p));
    if (!visibleProducts.length) {
        grid.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
        return;
    }

    if (noResults) noResults.style.display = 'none';

    const cards = visibleProducts.map(p => {
        const badges = [];
        const safeName = escapeHtml(p.name || '');
        const safeDesc = escapeHtml(p.description || '');
        const safeUrl = escapeHtml(sanitizeUrl(p.url || '#'));
        const safeCategory = escapeHtml(p.category || '');
        const safeBadgeLabel = escapeHtml(p.badgeLabel || '');
        const safeIdAttr = escapeHtml(String(p.id != null ? p.id : ''));
        const safeNameJs = toJsStringAttr(p.name);
        const safeImgJs = toJsStringAttr(p.image || PLACEHOLDER_IMAGE);
        if (p.isPopular) badges.push('<span class="badge badge-popular">Popular</span>');
        if (p.isNew) badges.push('<span class="badge badge-new">Nuevo</span>');
        if (p.badgeLabel && !p.isPopular) badges.push(`<span class="badge badge-featured">${safeBadgeLabel}</span>`);
        const priceFormatted = `$${p.price.toLocaleString('es-CO')}`;
        const stockNote = p.stock_bajo
            ? '<div class="product-stock-note">¡Últimas 5 unidades disponibles!</div>'
            : '';
        const perks = `
            <div class="product-perks">
                <span class="perk-chip">🚚 24-48h</span>
                <span class="perk-chip soft">Pagos Wompi</span>
            </div>
        `;

        const priceBlock = `
                <div class="price-block">
                    <div class="price-current-row">
                        <span class="price price-current">${priceFormatted}</span>
                    </div>
                </div>
            `;

        return `
            <div class="product-card" data-category="${safeCategory}" data-product-id="${safeIdAttr}">
                <div class="product-media">
                    <div class="product-badges">
                        ${badges.join('')}
                    </div>
                    <a href="${safeUrl}" aria-label="Ver ${safeName}">
                        ${buildPictureMarkup(p, { alt: p.name, className: 'product-image', loading: 'lazy' })}
                    </a>
                </div>
        <div class="product-info">
            <h3><a href="${safeUrl}">${safeName}</a></h3>
            <p class="product-description">${safeDesc}</p>
            ${perks}
            ${priceBlock}
            ${stockNote}
            <div class="product-actions">
                <button class="buy-button" onclick="addToCart(${toJsStringAttr(p.id)}, ${safeNameJs}, ${p.price}, ${safeImgJs})">Agregar al carrito</button>
                <a class="ghost-button" href="${safeUrl}">Ver detalles</a>
            </div>
                </div>
            </div>
        `;
    }).join('');

    grid.innerHTML = cards;

    if (typeof nbTrackViewItem === 'function') {
        const cardsRendered = grid.querySelectorAll('.product-card');
        cardsRendered.forEach(card => {
            const productId = card.dataset.productId || card.getAttribute('data-product-id');
            const productData = visibleProducts.find(p => String(p.id) === String(productId));
            if (!productData) return;
            card.addEventListener('click', function() {
                nbTrackViewItem(productData);
            }, { once: true });
        });
    }

    if (typeof nbGa4EcomEvent === 'function') {
        const totalValue = visibleProducts.reduce((sum, p) => sum + (p.price || 0), 0);
        const listName = currentQuery
            ? `Búsqueda: ${currentQuery}`
            : (currentCategory && currentCategory !== 'all' ? `Categoría: ${currentCategory}` : 'Catálogo');
        const listId = currentQuery
            ? 'busqueda'
            : (currentCategory && currentCategory !== 'all' ? `categoria-${currentCategory}` : 'catalogo');
        // GA4: view_item_list (fuente única)
        nbGa4EcomEvent('view_item_list', visibleProducts, totalValue, {
            item_list_name: listName,
            item_list_id: listId
        });
    }
}

function filterByCategory(category) {
    currentCategory = category || 'all';
    const categoryButtons = document.querySelectorAll('.filter-btn');
    if (categoryButtons.length) {
        categoryButtons.forEach(btn => {
            const btnCategory = btn.getAttribute('data-category') || 'all';
            btn.classList.toggle('active', btnCategory === currentCategory);
        });
    }
    filterProductsAdvanced();
    const productsSection = document.getElementById('productos');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function filterProductsAdvanced(queryOverride) {
    if (typeof PRODUCTS === 'undefined') return [];
    const q = typeof queryOverride === 'string' ? queryOverride : currentQuery;
    const normalizedQuery = normalizeText(q);
    const baseList = PRODUCTS.filter(p => {
        if (isPromoProduct(p)) return false;
        const byCategory = currentCategory === 'all' ? true : (p.category && p.category.includes(currentCategory));
        const byPrice = getPriceFilter(currentPriceRange, p.price);
        return byCategory && byPrice;
    });

    let filtered = baseList;
    if (normalizedQuery) {
        const engine = getSearchEngine();
        if (engine && typeof engine.searchProducts === 'function') {
            filtered = engine.searchProducts(normalizedQuery, baseList);
        } else {
            filtered = baseList.filter(p => getSearchableText(p).includes(normalizedQuery));
        }
    }
    const ordered = sortProductsList(filtered);
    renderProducts(ordered);
    if (typeof logEvent === 'function') {
        logEvent('filter_products', { category: currentCategory, priceRange: currentPriceRange, query: currentQuery });
    }
    return ordered;
}

function setupFilters() {
    const categoryButtons = document.querySelectorAll('.filter-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.getAttribute('data-category') || 'all';
            filterProductsAdvanced();
        });
    });

    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentQuery = e.target.value.trim();
            filterProductsAdvanced();
            renderSuggestions(currentQuery);
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const filtered = filterProductsAdvanced();
                if (typeof logEvent === 'function') {
                    logEvent('search', { search_term: currentQuery, results_count: filtered.length });
                }
                if (typeof nbPushEcommerceEvent === 'function') {
                    nbPushEcommerceEvent('search', { search_term: currentQuery, results_count: filtered.length });
                }
                closeSuggestions();
            }
        });
    }

    const priceSelect = document.getElementById('priceRange');
    if (priceSelect) {
        priceSelect.addEventListener('change', (e) => {
            currentPriceRange = e.target.value || 'all';
            filterProductsAdvanced();
        });
    }

    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value || 'featured';
            filterProductsAdvanced();
        });
    }

    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            currentCategory = 'all';
            currentPriceRange = 'all';
            currentQuery = '';
            currentSort = 'featured';
            if (searchInput) searchInput.value = '';
            if (priceSelect) priceSelect.value = 'all';
            if (sortSelect) sortSelect.value = 'featured';
            categoryButtons.forEach(b => b.classList.remove('active'));
            const allBtn = document.querySelector('.filter-btn[data-category="all"]');
            if (allBtn) allBtn.classList.add('active');
            filterProductsAdvanced();
            closeSuggestions();
        });
    }
}

function setupShortcutFilters() {
    const shortcuts = document.querySelectorAll('[data-category-target]');
    if (!shortcuts.length) return;
    shortcuts.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.getAttribute('data-category-target');
            filterByCategory(target);
        });
    });
}


// ---------------------------
// Autocomplete búsqueda
// ---------------------------
function renderSuggestions(term) {
    const sugg = document.getElementById('searchSuggestions');
    if (!sugg) return;
    if (!term || term.length < 2) {
        sugg.innerHTML = '';
        sugg.style.display = 'none';
        return;
    }
    const t = term.toLowerCase();
    const products = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.filter(p => !isPromoProduct(p) && p.name.toLowerCase().includes(t)) : [];
    const categories = Array.from(new Set((typeof PRODUCTS !== 'undefined') ? PRODUCTS.filter(p => !isPromoProduct(p)).map(p => p.category).filter(Boolean) : []))
        .filter(c => c.toLowerCase().includes(t) && c.toLowerCase() !== 'packs');
    const items = [];
    products.forEach(p => {
        items.push({ type: 'producto', label: p.name, url: p.url || '#', category: p.category });
    });
    categories.forEach(c => {
        items.push({ type: 'categoria', label: `Ver todos los productos de ${c}`, category: c });
    });

    if (!items.length) {
        sugg.innerHTML = '';
        sugg.style.display = 'none';
        return;
    }

    sugg.innerHTML = items.slice(0, 8).map(item => {
        const safeType = escapeHtml(item.type || '');
        const safeUrl = escapeHtml(sanitizeUrl(item.url || ''));
        const safeCategory = escapeHtml(item.category || '');
        const safeLabel = escapeHtml(item.label || '');
        return `<div class="search-suggestion" data-type="${safeType}" data-url="${safeUrl}" data-category="${safeCategory}" data-label="${safeLabel}">
            ${item.type === 'producto' ? '🔎' : '📂'} ${safeLabel}
        </div>`;
    }).join('');
    sugg.style.display = 'block';

    sugg.querySelectorAll('.search-suggestion').forEach(el => {
        el.addEventListener('click', () => {
            const stype = el.getAttribute('data-type');
            const sname = el.getAttribute('data-label');
            const scat = el.getAttribute('data-category');
            const surl = el.getAttribute('data-url');
            const termOrig = document.getElementById('productSearch')?.value || '';
            if (typeof logEvent === 'function') {
                logEvent('search_select', { search_term: termOrig, selected_type: stype, selected_name: sname });
            }
            if (stype === 'producto' && surl) {
                window.location.href = surl;
                return;
            }
            if (stype === 'categoria' && scat) {
                currentCategory = scat;
                const catBtn = document.querySelector(`.filter-btn[data-category="${scat}"]`);
                if (catBtn) {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    catBtn.classList.add('active');
                }
                filterProductsAdvanced();
                closeSuggestions();
            }
        });
    });
}

function closeSuggestions() {
    const sugg = document.getElementById('searchSuggestions');
    if (sugg) {
        sugg.innerHTML = '';
        sugg.style.display = 'none';
    }
}

function setupHeaderSearch() {
    const headerInput = document.getElementById('headerSearch');
    if (!headerInput) return;
    const headerBtn = document.querySelector('.header-search-btn');
    const productInput = document.getElementById('productSearch');
    const productsSection = document.getElementById('productos');

    const syncSearch = () => {
        if (!productInput) return;
        productInput.value = headerInput.value;
        productInput.dispatchEvent(new Event('input', { bubbles: true }));
    };

    headerInput.addEventListener('input', syncSearch);
    headerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            syncSearch();
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
    if (headerBtn) {
        headerBtn.addEventListener('click', () => {
            syncSearch();
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
}
// ---------------------------
// Animaciones
// ---------------------------
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ---------------------------
// Init
// ---------------------------
document.addEventListener('DOMContentLoaded', function() {
    const productsGrid = document.getElementById('productsGrid');
    const runCatalog = () => ensureProductsReady().then(() => {
        if (productsGrid && typeof PRODUCTS !== 'undefined') {
            renderProducts(sortProductsList(PRODUCTS));
            setupFilters();
            setupHeaderSearch();
        }
    });
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 900));
    if (productsGrid) {
        runCatalog().finally(() => {
            setupShortcutFilters();
            loadCart();
        });
    } else {
        idle(() => {
            ensureProductsReady().finally(() => {
                setupShortcutFilters();
                loadCart();
            });
        });
    }

    // Tracking: begin_checkout cuando clic en botón Wompi (fuente única GA4)
    document.addEventListener('click', function(e) {
        const target = e.target && e.target.closest ? e.target.closest('.alt-payment-btn, #wompiCheckoutBtn') : null;
        if (!target) return;
        e.preventDefault();
        const total = getCartTotal();
        if (typeof logEvent === 'function') {
            logEvent('checkout_wompi_click', { source: 'widget', total, items: cart });
        }
        ensureWompiReady()
            .then(() => {
                if (typeof checkoutWompi === 'function') {
                    checkoutWompi();
                } else {
                    console.warn('checkoutWompi no disponible');
                }
            })
            .catch(() => {
                alert('No pudimos cargar el pago. Intenta de nuevo.');
            });
    }, { passive: false });

    // NB-SEO: cerrar autocomplete al hacer clic fuera
    document.addEventListener('click', (e) => {
        const wrapper = document.querySelector('.search-wrapper');
        if (!wrapper) return;
        if (!wrapper.contains(e.target)) {
            closeSuggestions();
        }
    });

    // NB-SEO: Suscripción lead capture (reutilizable)
    const subForm = document.getElementById('subscribeForm');
    if (subForm) {
        subForm.addEventListener('submit', function(e){
            e.preventDefault();
            const name = document.getElementById('subName')?.value.trim();
            const email = document.getElementById('subEmail')?.value.trim();
            const phone = document.getElementById('subPhone')?.value.trim();
            const consent = document.getElementById('subConsent')?.checked;
            const msgEl = document.getElementById('subMessage');
            if (!name || !email || !consent) {
                if (msgEl) msgEl.textContent = 'Por favor completa nombre, email y acepta la política.';
                return;
            }
            if (msgEl) msgEl.textContent = '?Gracias por suscribirte!';
            if (msgEl) msgEl.style.animation = 'messageBounce 0.6s ease';
            setTimeout(() => { if (msgEl) msgEl.style.animation = 'none'; }, 700);
            subForm.reset();
            if (typeof nbPushEcommerceEvent === 'function') {
                nbPushEcommerceEvent('generate_lead', { name, has_email: !!email, has_phone: !!phone });
            }
            if (typeof logEvent === 'function') {
                logEvent('generate_lead', { name, has_email: !!email, has_phone: !!phone });
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', updateCartUI);
document.addEventListener('DOMContentLoaded', () => {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.setAttribute('aria-hidden', 'true');
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartModal && cartModal.classList.contains('show')) {
            toggleCart();
        }
    });
    if (!cartTrapHandlerBound) {
        document.addEventListener('keydown', trapFocusInCart);
        cartTrapHandlerBound = true;
    }
});

window.addToCart = addToCart;
window.buildCartEcomItems = buildCartEcomItems;
window.checkoutWhatsApp = checkoutWhatsApp;
window.clearCart = clearCart;
window.clearCartForce = clearCartForce;
window.closeCartOnOutsideClick = closeCartOnOutsideClick;
window.filterProductsAdvanced = filterProductsAdvanced;
window.getCartItemCount = getCartItemCount;
window.getCartTotal = getCartTotal;
window.getPriceFilter = getPriceFilter;
window.getRecommendedProducts = getRecommendedProducts;
window.isWebpSource = isWebpSource;
window.loadCart = loadCart;
window.removeFromCart = removeFromCart;
window.renderProducts = renderProducts;
window.renderRecommended = renderRecommended;
window.saveCart = saveCart;
window.setupFilters = setupFilters;
window.showCartNotification = showCartNotification;
window.toggleCart = toggleCart;
window.updateCartUI = updateCartUI;
window.updateQuantity = updateQuantity;
})();


