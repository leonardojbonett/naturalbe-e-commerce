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
            console.log('✅ Wompi Widget cargado');
            resolve();
        };
        script.onerror = () => {
            cleanup();
            console.error('❌ Error cargando Wompi Widget');
            pushWompiTelemetry('wompi_widget_load_failed', { reason: 'script_error' });
            reject(new Error('No se pudo cargar Wompi'));
        };

        timeoutId = setTimeout(() => {
            console.error('❌ Timeout cargando Wompi Widget');
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
        console.error('Error inicializando Wompi:', error);
    });
});

// Función para checkout con Wompi
async function checkoutWompi() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }

    trackBeginCheckoutWompi();
    if (typeof nbGa4EcomEvent === 'function') {
        // GA4: add_shipping_info cuando se abre formulario Wompi
        nbGa4EcomEvent('add_shipping_info', cart, getCartTotal(), { method: 'wompi' });
    }
    
    // Mostrar formulario de datos del cliente
    showCustomerFormWompi();
}

// Mostrar formulario de datos del cliente
function showCustomerFormWompi() {
    const modal = document.getElementById('cartModal');
    const cartBody = document.getElementById('cartBody');
    
    const subtotal = getCartTotal();
    
    cartBody.innerHTML = `
        <div style="padding: 2rem;">
            <h2 style="color: #2d8659; margin-bottom: 1.5rem;">Datos para el Pago</h2>
            
            <form id="wompiCustomerForm" onsubmit="processWompiPayment(event)">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
                        Nombre Completo *
                    </label>
                    <input type="text" id="wompiCustomerName" required
                           style="width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
                        Email *
                    </label>
                    <input type="email" id="wompiCustomerEmail" required
                           style="width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
                        Teléfono / WhatsApp *
                    </label>
                    <input type="tel" id="wompiCustomerPhone" required placeholder="3137212923"
                           style="width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
                        Ciudad *
                    </label>
                    <select id="wompiCustomerCity" required onchange="calculateShippingWompi()"
                            style="width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;">
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
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
                        Dirección Completa *
                    </label>
                    <textarea id="wompiCustomerAddress" required rows="2"
                              placeholder="Calle, número, barrio, apartamento..."
                              style="width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; resize: vertical;"></textarea>
                </div>
                
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Subtotal:</span>
                        <span id="wompiSubtotal" style="font-weight: bold;">$${subtotal.toLocaleString('es-CO')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Envío:</span>
                        <span id="wompiShipping" style="font-weight: bold; color: #2d8659;">Selecciona ciudad (envío $15.000)</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 0.5rem; border-top: 2px solid #e0e0e0;">
                        <span style="font-size: 1.2rem; font-weight: bold;">TOTAL:</span>
                        <span id="wompiTotal" style="font-size: 1.5rem; font-weight: bold; color: #2d8659;">$${subtotal.toLocaleString('es-CO')}</span>
                    </div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.9rem; color: #6b7280;">
                        Envío gratis desde $100.000.
                    </p>
                </div>
                
                <button type="submit" 
                        style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; border: none; border-radius: 10px; font-size: 1.1rem; font-weight: bold; cursor: pointer;">
                    💳 Continuar al Pago
                </button>
                
                <button type="button" onclick="updateCartUI()" 
                        style="width: 100%; padding: 0.8rem; background: transparent; color: #666; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 1rem; font-weight: bold; cursor: pointer; margin-top: 0.5rem;">
                    ← Volver al Carrito
                </button>
            </form>
        </div>
    `;
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
            shippingElement.innerHTML = '<span style="color: #4caf50; font-weight: bold;">GRATIS 🎉</span>';
        } else {
            shippingElement.textContent = `$${shippingCost.toLocaleString('es-CO')}`;
        }
        
        const total = subtotal + shippingCost;
        totalElement.textContent = `$${total.toLocaleString('es-CO')}`;
    }
    
    return shippingCost;
}

function renderWompiFallback(message) {
    const text = message || 'No pudimos abrir el pago. Intenta de nuevo o contáctanos por WhatsApp.';
    const cartBody = document.getElementById('cartBody');
    if (!cartBody) {
        alert(text);
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
                alert('Escríbenos al WhatsApp: +57 313 721 2923');
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
    
    // Obtener datos del formulario
    const customerName = document.getElementById('wompiCustomerName').value;
    const customerEmail = document.getElementById('wompiCustomerEmail').value;
    const customerPhone = document.getElementById('wompiCustomerPhone').value;
    const customerCity = document.getElementById('wompiCustomerCity').value;
    const customerAddress = document.getElementById('wompiCustomerAddress').value;
    
    // Calcular total
    const subtotal = getCartTotal();
    const shippingCost = calculateShippingWompi();
    const total = subtotal + shippingCost;
    const amountInCents = Math.round(Number(total || 0) * 100);

    // Generar referencia única
    const reference = 'NB-' + Date.now() + '-' + customerPhone.slice(-4);

    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
        console.error('Wompi Widget Error: amountInCents inválido', { amountInCents, total });
        alert('Hubo un error al procesar el pago. Por favor intenta de nuevo.');
        return;
    }
    if (!reference) {
        console.error('Wompi Widget Error: reference inválida');
        alert('Hubo un error al procesar el pago. Por favor intenta de nuevo.');
        return;
    }
    if (!SUCCESS_REDIRECT_URL || !CANCEL_REDIRECT_URL) {
        console.error('Wompi Widget Error: redirectUrl inválida', { SUCCESS_REDIRECT_URL, CANCEL_REDIRECT_URL });
        alert('Hubo un error al procesar el pago. Por favor intenta de nuevo.');
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
    
    // Guardar datos del cliente para Google Customer Reviews
    const customerData = {
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        city: customerCity
    };
    try {
        sessionStorage.setItem('wompi_customer_data', JSON.stringify(customerData));
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
                    alert('Tu pago fue rechazado. Por favor intenta con otro método de pago.');
                    const declineUrl = new URL(buildRedirectUrl(CANCEL_REDIRECT_URL, reference));
                    declineUrl.searchParams.set('retry', '1');
                    window.location.href = declineUrl.toString();
                } else if (result.transaction.status === 'PENDING') {
                    // Pago pendiente
                    if (typeof logEvent === 'function') {
                        logEvent('checkout_wompi_pending', { total, reference, items: cart });
                    }
                    alert('Tu pago está pendiente de confirmación. Te notificaremos cuando se complete.');
                    const pendingUrl = new URL(buildRedirectUrl(PENDING_REDIRECT_URL, reference));
                    pendingUrl.searchParams.set('retry', '1');
                    window.location.href = pendingUrl.toString();
                }
            } else {
                // Usuario cerró el widget
                console.log('Widget cerrado por el usuario');
                const cancelUrl = new URL(buildRedirectUrl(CANCEL_REDIRECT_URL, reference));
                cancelUrl.searchParams.set('retry', '1');
                window.location.href = cancelUrl.toString();
            }
        });
        
    } catch (error) {
        console.error('Wompi Widget Error:', error);
        pushWompiTelemetry('wompi_widget_open_failed', { message: String(error && error.message || error) });
        renderWompiFallback('No pudimos abrir el pago. Puedes reintentar o contactarnos por WhatsApp.');
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

console.log('✅ Wompi Integration cargada - Modo:', WOMPI_CONFIG.sandboxMode ? 'PRUEBA' : 'PRODUCCIÓN');

window.addWompiButtonToCart = addWompiButtonToCart;
window.calculateShippingWompi = calculateShippingWompi;
window.checkoutWompi = checkoutWompi;
window.loadWompiScript = loadWompiCheckoutScript;
window.processWompiPayment = processWompiPayment;
window.showCustomerFormWompi = showCustomerFormWompi;
window.trackBeginCheckoutWompi = trackBeginCheckoutWompi;
window.sanitizeRedirectUrl = sanitizeRedirectUrl;

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
        console.log('Wompi sanitizeRedirectUrl self-check OK');
    }
}

if (window.NB_WOMPI_DEBUG === true) {
    runWompiRedirectUrlSelfCheck();
}
})();
