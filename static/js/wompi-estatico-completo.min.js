(() => {
// ============================================
// WOMPI INTEGRATION - SITIO ESTÁTICO
// Para Natural Be (HTML sin backend)
// ============================================

// Configuración de Wompi
const NB_WOMPI = (typeof window !== 'undefined' && window.NB_WOMPI_CONFIG) ? window.NB_WOMPI_CONFIG : {};
const DEFAULT_SUCCESS_REDIRECT = `${window.location.origin}/pago-exitoso.html`;
const DEFAULT_CANCEL_REDIRECT = `${window.location.origin}/pago-cancelado.html`;
const DEFAULT_PENDING_REDIRECT = `${window.location.origin}/pago-pendiente.html`;

function pushWompiTelemetry(event, detail) {
    if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event, ...detail });
    }
}

function sanitizeRedirectUrl(rawUrl, fallbackUrl) {
    const fallback = fallbackUrl || `${window.location.origin}/checkout/resultado`;
    if (!rawUrl || typeof rawUrl !== 'string') {
        return fallback;
    }
    const trimmed = rawUrl.trim();
    if (!trimmed) {
        return fallback;
    }
    if (/^(javascript|data):/i.test(trimmed)) {
        return fallback;
    }
    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch (e) {
        return fallback;
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        return fallback;
    }
    if (!parsed.host) {
        return fallback;
    }
    if (!/^[\w\-.:]+$/.test(parsed.host)) {
        return fallback;
    }
    if (parsed.pathname && /[^\w\-./~%]/.test(parsed.pathname)) {
        return fallback;
    }
    return parsed.toString();
}

const SUCCESS_REDIRECT_URL = sanitizeRedirectUrl(NB_WOMPI.successUrl, DEFAULT_SUCCESS_REDIRECT);
const CANCEL_REDIRECT_URL = sanitizeRedirectUrl(NB_WOMPI.cancelUrl, DEFAULT_CANCEL_REDIRECT);
const PENDING_REDIRECT_URL = sanitizeRedirectUrl(NB_WOMPI.pendingUrl, DEFAULT_PENDING_REDIRECT);

const WOMPI_CONFIG = {
    // MODO PRODUCCIÓN
    publicKey: NB_WOMPI.publicKey || 'pub_prod_rnYo9cubWyL1tG3mp2T3QCRtDYGKul9b',
    currency: NB_WOMPI.currency || 'COP',
    sandboxMode: false,

    // URLs de redirección
    successUrl: SUCCESS_REDIRECT_URL,
    cancelUrl: CANCEL_REDIRECT_URL,

    // Datos de la tienda
    storeName: 'Natural Be',
    storePhone: '+573137212923',
    storeEmail: 'contacto@naturalbe.com.co'
};

const WOMPI_BEGIN_COOLDOWN_MS = 5000;
let lastWompiBeginTs = 0;
let wompiScriptPromise = null;
const WOMPI_WIDGET_SCRIPT_URL = 'https://checkout.wompi.co/widget.js';
const WOMPI_CHECKOUT_PAGE_PATH = '/checkout.html';
const WOMPI_DEBUG = window.NB_DEBUG_WOMPI === true;
const WOMPI_FRIENDLY_ERROR = 'No pudimos procesar el pago en este momento. Intenta de nuevo o finaliza por WhatsApp.';

function wompiDebugLog(...args) {
    if (WOMPI_DEBUG) {
        console.log('[WOMPI]', ...args);
    }
}

function showUserFriendlyError(message) {
    const safeMessage = message || WOMPI_FRIENDLY_ERROR;
    if (typeof window.showToast === 'function') {
        window.showToast(safeMessage, 'error');
        return;
    }
    const cartBody = document.getElementById('cartBody');
    if (cartBody) {
        renderWompiFallback(safeMessage);
    }
}

function setWompiButtonLoading(isLoading, loadingText) {
    const button = document.getElementById('wompiCheckoutBtn');
    if (!button) return;
    if (!button.dataset.originalText) {
        button.dataset.originalText = button.innerHTML;
    }
    if (isLoading) {
        button.disabled = true;
        button.textContent = loadingText || 'Conectando pago...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || '💳 Pagar con Tarjeta / PSE / Nequi';
    }
}

function setFormSubmitLoading(form, isLoading, loadingText) {
    if (!form) return;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    if (!submitBtn.dataset.originalText) {
        submitBtn.dataset.originalText = submitBtn.innerHTML;
    }
    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.textContent = loadingText || 'Procesando...';
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtn.dataset.originalText || 'Continuar al pago';
    }
}

function isWompiCheckoutPage() {
    const path = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
    return path === WOMPI_CHECKOUT_PAGE_PATH || path.endsWith('/checkout.html');
}

function redirectToWompiCheckoutPage() {
    const target = `${window.location.origin}${WOMPI_CHECKOUT_PAGE_PATH}`;
    window.location.href = target;
}

function normalizePhone(value) {
    let digits = String(value || '').replace(/\D+/g, '');
    if (digits.startsWith('57') && digits.length > 10) {
        digits = digits.slice(2);
    }
    return digits;
}

function formatPhoneMask(value) {
    const digits = normalizePhone(value).slice(0, 10);
    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 6);
    const part3 = digits.slice(6, 10);
    if (!part2) return part1;
    if (!part3) return `${part1} ${part2}`;
    return `${part1} ${part2} ${part3}`;
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorId = `${fieldId}Error`;
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.remove();
    }
    if (!field) return;
    field.removeAttribute('aria-invalid');
    if (field.getAttribute('aria-describedby') === errorId) {
        field.removeAttribute('aria-describedby');
    }
}

function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const errorId = `${fieldId}Error`;
    clearFieldError(fieldId);
    const error = document.createElement('p');
    error.id = errorId;
    error.className = 'wompi-error';
    error.setAttribute('role', 'alert');
    error.textContent = message;
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', errorId);
    field.insertAdjacentElement('afterend', error);
}

function clearCustomerFormErrors() {
    [
        'wompiCustomerName',
        'wompiCustomerEmail',
        'wompiCustomerPhone',
        'wompiCustomerCity',
        'wompiCustomerAddress'
    ].forEach(clearFieldError);
}

function applyCustomerFormErrors(fieldErrors) {
    Object.entries(fieldErrors || {}).forEach(([fieldId, message]) => {
        setFieldError(fieldId, message);
    });
}

function getCustomerFormData() {
    return {
        customerName: (document.getElementById('wompiCustomerName') || {}).value || '',
        customerEmail: (document.getElementById('wompiCustomerEmail') || {}).value || '',
        customerPhone: (document.getElementById('wompiCustomerPhone') || {}).value || '',
        customerCity: (document.getElementById('wompiCustomerCity') || {}).value || '',
        customerAddress: (document.getElementById('wompiCustomerAddress') || {}).value || ''
    };
}

function validateCustomerForm(data) {
    const name = String(data.customerName || '').trim();
    const email = String(data.customerEmail || '').trim();
    const phone = normalizePhone(data.customerPhone);
    const city = String(data.customerCity || '').trim();
    const address = String(data.customerAddress || '').trim();
    const fieldErrors = {};

    if (name.length < 3) fieldErrors.wompiCustomerName = 'Ingresa nombre y apellido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.wompiCustomerEmail = 'Ingresa un correo valido.';
    if (phone.length < 10) fieldErrors.wompiCustomerPhone = 'Ingresa un telefono valido de 10 digitos.';
    if (!city) fieldErrors.wompiCustomerCity = 'Selecciona una ciudad de entrega.';
    if (address.length < 8) fieldErrors.wompiCustomerAddress = 'Ingresa una direccion mas completa.';

    return {
        isValid: Object.keys(fieldErrors).length === 0,
        fieldErrors
    };
}

function validateSingleCustomerField(fieldId) {
    const validation = validateCustomerForm(getCustomerFormData());
    const message = validation.fieldErrors[fieldId];
    if (message) {
        setFieldError(fieldId, message);
        return false;
    }
    clearFieldError(fieldId);
    return true;
}

function setupWompiFormRealtimeValidation() {
    const fields = [
        'wompiCustomerName',
        'wompiCustomerEmail',
        'wompiCustomerPhone',
        'wompiCustomerCity',
        'wompiCustomerAddress'
    ];
    fields.forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        if (!field) return;
        if (fieldId === 'wompiCustomerPhone') {
            field.setAttribute('inputmode', 'numeric');
            field.setAttribute('autocomplete', 'tel-national');
            field.setAttribute('maxlength', '12');
            field.addEventListener('input', () => {
                field.value = formatPhoneMask(field.value);
                if (field.getAttribute('aria-invalid') === 'true') {
                    validateSingleCustomerField(fieldId);
                }
            });
            field.addEventListener('blur', () => {
                field.value = formatPhoneMask(field.value);
                validateSingleCustomerField(fieldId);
            });
            return;
        }
        const evt = field.tagName === 'SELECT' ? 'change' : 'blur';
        field.addEventListener(evt, () => {
            validateSingleCustomerField(fieldId);
        });
        field.addEventListener('input', () => {
            if (field.getAttribute('aria-invalid') === 'true') {
                validateSingleCustomerField(fieldId);
            }
        });
    });
}

function trackBeginCheckoutWompi() {
    const now = Date.now();
    if (now - lastWompiBeginTs < WOMPI_BEGIN_COOLDOWN_MS) {
        return false;
    }
    lastWompiBeginTs = now;

    const total = getCartTotal();

    if (typeof logEvent === 'function') {
        logEvent('begin_checkout_wompi', { total, items: cart });
    }
    if (typeof nbGa4EcomEvent === 'function') {
        // GA4: begin_checkout (Wompi) fuente única
        nbGa4EcomEvent('begin_checkout', cart, total, { method: 'wompi' });
        nbGa4EcomEvent('add_payment_info', cart, total, { method: 'wompi' });
    }

    return true;
}

function loadWompiCheckoutScript() {
    if (wompiScriptPromise) {
        return wompiScriptPromise;
    }
    if (document.getElementById('wompi-widget-script')) {
        wompiScriptPromise = Promise.resolve();
        return wompiScriptPromise;
    }

    wompiScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const timeoutMs = 10000;
        let timeoutId = null;

        script.id = 'wompi-widget-script';
        script.src = WOMPI_WIDGET_SCRIPT_URL;
        script.async = true;

        const cleanup = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };

        script.onload = () => {
            cleanup();
            wompiDebugLog('Widget cargado');
            resolve();
        };
        script.onerror = () => {
            cleanup();
            pushWompiTelemetry('wompi_widget_load_failed', { reason: 'script_error' });
            reject(new Error('No se pudo cargar Wompi'));
        };

        timeoutId = setTimeout(() => {
            pushWompiTelemetry('wompi_widget_load_failed', { reason: 'timeout' });
            reject(new Error('Timeout cargando Wompi'));
        }, timeoutMs);

        document.head.appendChild(script);
    });

    return wompiScriptPromise;
}


// Inicializar Wompi al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    loadWompiCheckoutScript().catch(error => {
        pushWompiTelemetry('wompi_widget_load_failed', { reason: 'init_error', message: String(error && error.message || error) });
    });
});

// Función para checkout con Wompi
async function checkoutWompi() {
    if (cart.length === 0) {
        showUserFriendlyError('Tu carrito esta vacio por ahora. Agrega productos para continuar.');
        return;
    }
    if (!isWompiCheckoutPage()) {
        redirectToWompiCheckoutPage();
        return;
    }
    setWompiButtonLoading(true, 'Conectando pago...');
    try {
        await loadWompiCheckoutScript();
        if (typeof WidgetCheckout === 'undefined') {
            throw new Error('WidgetCheckout no disponible');
        }

        trackBeginCheckoutWompi();
        if (typeof nbGa4EcomEvent === 'function') {
            // GA4: add_shipping_info cuando se abre formulario Wompi
            nbGa4EcomEvent('add_shipping_info', cart, getCartTotal(), { method: 'wompi' });
        }

        // Mostrar formulario de datos del cliente
        showCustomerFormWompi();
    } catch (error) {
        pushWompiTelemetry('wompi_checkout_init_failed', { message: String(error && error.message || error) });
        renderWompiFallback(WOMPI_FRIENDLY_ERROR);
    } finally {
        setWompiButtonLoading(false);
    }
}

// Mostrar formulario de datos del cliente
function showCustomerFormWompi() {
    const cartBody = document.getElementById('cartBody');
    
    const subtotal = getCartTotal();
    
    cartBody.innerHTML = `
        <div class="wompi-form-wrap">
            <h2 class="wompi-title">Datos para el pago</h2>
            <p class="wompi-subtitle">Completa este formulario para abrir la pasarela segura de Wompi.</p>
            
            <form id="wompiCustomerForm" onsubmit="processWompiPayment(event)">
                <div class="wompi-field">
                    <label class="wompi-label">
                        Nombre Completo *
                    </label>
                    <input type="text" id="wompiCustomerName" required
                           class="wompi-input" autocomplete="name">
                </div>
                
                <div class="wompi-field">
                    <label class="wompi-label">
                        Email *
                    </label>
                    <input type="email" id="wompiCustomerEmail" required
                           class="wompi-input" autocomplete="email">
                </div>
                
                <div class="wompi-field">
                    <label class="wompi-label">
                        Teléfono / WhatsApp *
                    </label>
                    <input type="tel" id="wompiCustomerPhone" required placeholder="3137212923"
                           class="wompi-input" autocomplete="tel">
                </div>
                
                <div class="wompi-field">
                    <label class="wompi-label">
                        Ciudad *
                    </label>
                    <select id="wompiCustomerCity" required onchange="calculateShippingWompi()"
                            class="wompi-select">
                        <option value="">Selecciona tu ciudad</option>
                        <option value="Barranquilla">Barranquilla</option>
                        <option value="Bogotá">Bogotá</option>
                        <option value="Medellín">Medellín</option>
                        <option value="Cali">Cali</option>
                        <option value="Cartagena">Cartagena</option>
                        <option value="Santa Marta">Santa Marta</option>
                        <option value="Bucaramanga">Bucaramanga</option>
                        <option value="Otra">Otra ciudad</option>
                    </select>
                </div>
                
                <div class="wompi-field">
                    <label class="wompi-label">
                        Dirección Completa *
                    </label>
                    <textarea id="wompiCustomerAddress" required rows="2"
                              placeholder="Calle, número, barrio, apartamento..."
                              class="wompi-textarea" autocomplete="street-address"></textarea>
                </div>
                
                <div class="wompi-summary-box">
                    <div class="wompi-summary-row">
                        <span>Subtotal:</span>
                        <span id="wompiSubtotal" style="font-weight: bold;">$${subtotal.toLocaleString('es-CO')}</span>
                    </div>
                    <div class="wompi-summary-row">
                        <span>Envío:</span>
                        <span id="wompiShipping" style="font-weight: bold; color: #2d8659;">Selecciona ciudad (envío desde $15.000)</span>
                    </div>
                    <div class="wompi-summary-row total">
                        <span>TOTAL:</span>
                        <span id="wompiTotal" style="font-size: 1.5rem; font-weight: bold; color: #2d8659;">$${subtotal.toLocaleString('es-CO')}</span>
                    </div>
                    <p class="wompi-muted">
                        Envío gratis desde $100.000 y pago protegido por Wompi.
                    </p>
                </div>
                
                <div class="wompi-actions">
                    <button type="submit" class="wompi-primary-btn">
                        Continuar al pago
                    </button>
                    
                    <button type="button" onclick="goBackFromWompiCheckout()" class="wompi-secondary-btn">
                        Volver al catálogo
                    </button>
                </div>
            </form>
        </div>
    `;
    setupWompiFormRealtimeValidation();
}

// Calcular costo de envío
function calculateShippingWompi() {
    const city = document.getElementById('wompiCustomerCity').value;
    const subtotal = getCartTotal();
    let shippingCost = 0;
    
    if (city === 'Barranquilla') {
        shippingCost = 0; // Gratis en Barranquilla
    } else if (city && city !== '') {
        shippingCost = subtotal >= 100000 ? 0 : 15000; // Gratis si compra +$100K
    }
    
    const shippingElement = document.getElementById('wompiShipping');
    const totalElement = document.getElementById('wompiTotal');
    
    if (shippingElement && totalElement) {
        if (shippingCost === 0) {
            shippingElement.innerHTML = '<span style="color: #4caf50; font-weight: bold;">Gratis</span>';
        } else {
            shippingElement.textContent = `$${shippingCost.toLocaleString('es-CO')}`;
        }
        
        const total = subtotal + shippingCost;
        totalElement.textContent = `$${total.toLocaleString('es-CO')}`;
    }
    
    return shippingCost;
}

function goBackFromWompiCheckout() {
    if (isWompiCheckoutPage()) {
        window.location.href = '/categoria/suplementos';
        return;
    }
    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
}

function renderWompiFallback(message) {
    const text = message || 'No pudimos abrir el pago. Intenta de nuevo o contáctanos por WhatsApp.';
    const cartBody = document.getElementById('cartBody');
    if (!cartBody) {
        showUserFriendlyError(text);
        return;
    }
    cartBody.innerHTML = `
        <div style="padding:2rem;text-align:center;">
            <h3 style="color:#b91c1c;margin-bottom:0.75rem;">No pudimos abrir el pago</h3>
            <p style="color:#4b5563;margin-bottom:1.5rem;">${text}</p>
            <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;">
                <button type="button" id="wompiRetryBtn"
                        style="padding:0.8rem 1.2rem;background:#111827;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                    Reintentar
                </button>
                <button type="button" id="wompiWhatsAppBtn"
                        style="padding:0.8rem 1.2rem;background:#16a34a;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                    Contactar por WhatsApp
                </button>
            </div>
        </div>
    `;
    const retryBtn = document.getElementById('wompiRetryBtn');
    const waBtn = document.getElementById('wompiWhatsAppBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            loadWompiCheckoutScript()
                .then(() => showCustomerFormWompi())
                .catch(() => renderWompiFallback(text));
        });
    }
    if (waBtn) {
        waBtn.addEventListener('click', () => {
            if (typeof checkoutWhatsApp === 'function') {
                checkoutWhatsApp();
            } else {
                window.open('https://wa.me/573137212923', '_blank', 'noopener');
            }
        });
    }
}

function buildRedirectUrl(baseUrl, reference) {
    const safeBase = sanitizeRedirectUrl(baseUrl, `${window.location.origin}/checkout/resultado`);
    const url = new URL(safeBase);
    if (reference) {
        url.searchParams.set('ref', reference);
    }
    return url.toString();
}

// Procesar pago con Wompi
async function processWompiPayment(event) {
    event.preventDefault();
    const form = event.target;
    setFormSubmitLoading(form, true, 'Abriendo pasarela...');
    
    // Obtener datos del formulario
    const {
        customerName,
        customerEmail,
        customerPhone,
        customerCity,
        customerAddress
    } = getCustomerFormData();

    clearCustomerFormErrors();
    const validationResult = validateCustomerForm({
        customerName,
        customerEmail,
        customerPhone,
        customerCity,
        customerAddress
    });
    if (!validationResult.isValid) {
        applyCustomerFormErrors(validationResult.fieldErrors);
        const firstFieldId = Object.keys(validationResult.fieldErrors)[0];
        const firstField = firstFieldId ? document.getElementById(firstFieldId) : null;
        if (firstField && typeof firstField.focus === 'function') {
            firstField.focus();
        }
        setFormSubmitLoading(form, false);
        return;
    }
    
    // Calcular total
    const subtotal = getCartTotal();
    const shippingCost = calculateShippingWompi();
    const total = subtotal + shippingCost;
    const amountInCents = Math.round(Number(total || 0) * 100);

    // Generar referencia única
    const reference = 'NB-' + Date.now() + '-' + normalizePhone(customerPhone).slice(-4);

    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
        pushWompiTelemetry('wompi_invalid_amount', { amountInCents, total });
        setFormSubmitLoading(form, false);
        renderWompiFallback('No pudimos calcular el total de tu pedido. Intenta de nuevo.');
        return;
    }
    if (!reference) {
        pushWompiTelemetry('wompi_invalid_reference', {});
        setFormSubmitLoading(form, false);
        renderWompiFallback('No pudimos generar la referencia de pago. Intenta de nuevo.');
        return;
    }
    if (!SUCCESS_REDIRECT_URL || !CANCEL_REDIRECT_URL) {
        pushWompiTelemetry('wompi_invalid_redirect', { success: SUCCESS_REDIRECT_URL, cancel: CANCEL_REDIRECT_URL });
        setFormSubmitLoading(form, false);
        renderWompiFallback(WOMPI_FRIENDLY_ERROR);
        return;
    }
    
    // Guardar solo referencia de orden (sin PII) en sessionStorage
    const lastOrderPayload = {
        reference: reference,
        total: total,
        currency: WOMPI_CONFIG.currency,
        date: new Date().toISOString()
    };
    try {
        sessionStorage.setItem('nb_last_order', JSON.stringify(lastOrderPayload));
    } catch (e) { /* ignore */ }
    
    try {
        // Verificar que Wompi esté cargado
        if (typeof WidgetCheckout === 'undefined') {
            await loadWompiCheckoutScript();
        }
        if (typeof WidgetCheckout === 'undefined') {
            throw new Error('WidgetCheckout no disponible');
        }
        
        // Configurar Wompi Widget
        const checkout = new WidgetCheckout({
            currency: WOMPI_CONFIG.currency,
            amountInCents: amountInCents, // Wompi usa centavos
            reference: reference,
            publicKey: WOMPI_CONFIG.publicKey,
            redirectUrl: buildRedirectUrl(SUCCESS_REDIRECT_URL, reference),
            customerData: {
                email: customerEmail,
                fullName: customerName,
                phoneNumber: customerPhone,
                phoneNumberPrefix: '+57'
            },
            shippingAddress: {
                addressLine1: customerAddress,
                city: customerCity,
                phoneNumber: customerPhone,
                region: 'Colombia',
                country: 'CO'
            }
        });
        
        // Abrir widget de Wompi
        checkout.open(function(result) {
            if (result.transaction) {
                if (result.transaction.status === 'APPROVED') {
                    // Pago aprobado
                    if (typeof logEvent === 'function') {
                        logEvent('checkout_wompi_approved', { total, reference, items: cart });
                    }
                    if (typeof nbGa4EcomEvent === 'function') {
                        const ecommerceItems = (typeof buildCartEcomItems === 'function') ? buildCartEcomItems(cart) : cart;
                        // GA4: purchase (Wompi) con transaction_id
                        nbGa4EcomEvent('purchase', ecommerceItems, total, {
                            transaction_id: reference,
                            currency: WOMPI_CONFIG.currency,
                            payment_method: 'wompi'
                        });
                        try { sessionStorage.setItem('nb_purchase_ref', String(reference)); } catch (e) { /* ignore */ }
                    }

                    if (typeof clearCartForce === 'function') {
                        clearCartForce();
                    } else {
                        clearCart();
                    }
                    window.location.href = buildRedirectUrl(SUCCESS_REDIRECT_URL, reference);
                } else if (result.transaction.status === 'DECLINED') {
                    // Pago rechazado
                    if (typeof logEvent === 'function') {
                        logEvent('checkout_wompi_declined', { total, reference, items: cart });
                    }
                    const declineUrl = new URL(buildRedirectUrl(CANCEL_REDIRECT_URL, reference));
                    declineUrl.searchParams.set('retry', '1');
                    window.location.href = declineUrl.toString();
                } else if (result.transaction.status === 'PENDING') {
                    // Pago pendiente
                    if (typeof logEvent === 'function') {
                        logEvent('checkout_wompi_pending', { total, reference, items: cart });
                    }
                    const pendingUrl = new URL(buildRedirectUrl(PENDING_REDIRECT_URL, reference));
                    pendingUrl.searchParams.set('retry', '1');
                    window.location.href = pendingUrl.toString();
                }
            } else {
                // Usuario cerró el widget
                pushWompiTelemetry('wompi_widget_closed', { reference });
                const cancelUrl = new URL(buildRedirectUrl(CANCEL_REDIRECT_URL, reference));
                cancelUrl.searchParams.set('retry', '1');
                window.location.href = cancelUrl.toString();
            }
        });
        
    } catch (error) {
        pushWompiTelemetry('wompi_widget_open_failed', { message: String(error && error.message || error) });
        renderWompiFallback('No pudimos abrir el pago. Puedes reintentar o contactarnos por WhatsApp.');
    } finally {
        setFormSubmitLoading(form, false);
    }
}

// Agregar botón de Wompi al carrito (modificar updateCartUI)
// Esta función debe ser llamada después de que se actualice el carrito
function addWompiButtonToCart() {
    const cartFooter = document.getElementById('cartFooter');
    
    if (cartFooter && cart.length > 0) {
        if (document.querySelector('.alt-payment-btn')) {
            return;
        }
        // Verificar si ya existe el botón
        if (!document.getElementById('wompiCheckoutBtn')) {
            const wompiButton = document.createElement('button');
            wompiButton.id = 'wompiCheckoutBtn';
            wompiButton.className = 'cart-checkout-btn';
            wompiButton.style.marginTop = '0.5rem';
            wompiButton.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
            wompiButton.innerHTML = '💳 Pagar con Tarjeta / PSE / Nequi';
            wompiButton.onclick = checkoutWompi;
            
            // Insertar después del botón de WhatsApp
            const whatsappBtn = cartFooter.querySelector('.cart-checkout-btn');
            if (whatsappBtn) {
                whatsappBtn.parentNode.insertBefore(wompiButton, whatsappBtn.nextSibling);
            } else {
                cartFooter.insertBefore(wompiButton, cartFooter.firstChild);
            }
        }
    }
}

// Modificar la función updateCartUI original para incluir el botón de Wompi
// Agregar esta línea al final de tu función updateCartUI existente:
// addWompiButtonToCart();

wompiDebugLog('Integration cargada - Modo:', WOMPI_CONFIG.sandboxMode ? 'PRUEBA' : 'PRODUCCION');

window.addWompiButtonToCart = addWompiButtonToCart;
window.calculateShippingWompi = calculateShippingWompi;
window.checkoutWompi = checkoutWompi;
window.loadWompiScript = loadWompiCheckoutScript;
window.processWompiPayment = processWompiPayment;
window.renderWompiFallback = renderWompiFallback;
window.showCustomerFormWompi = showCustomerFormWompi;
window.trackBeginCheckoutWompi = trackBeginCheckoutWompi;
window.sanitizeRedirectUrl = sanitizeRedirectUrl;
window.goBackFromWompiCheckout = goBackFromWompiCheckout;

function runWompiRedirectUrlSelfCheck() {
    const origin = window.location.origin;
    const fallback = `${origin}/checkout/resultado`;
    const cases = [
        ['https://naturalbe.com.co/pago-exitoso.html', true],
        ['http://naturalbe.com.co/pago-exitoso.html', true],
        ['javascript:alert(1)', false],
        ['data:text/html;base64,abc', false],
        ['//naturalbe.com.co/pago-exitoso.html', false],
        ['notaurl', false]
    ];
    const results = cases.map(([value, expected]) => {
        const out = sanitizeRedirectUrl(value, fallback);
        const ok = expected ? out === value : out === fallback;
        return { value, ok, out };
    });
    const failures = results.filter(r => !r.ok);
    if (failures.length) {
        console.warn('Wompi sanitizeRedirectUrl self-check falló:', failures);
    } else {
        wompiDebugLog('sanitizeRedirectUrl self-check OK');
    }
}

if (window.NB_WOMPI_DEBUG === true) {
    runWompiRedirectUrlSelfCheck();
}
})();
