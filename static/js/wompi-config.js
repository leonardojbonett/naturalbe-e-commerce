// Configuracion centralizada de Wompi (uso en entorno estatico)
window.NB_WOMPI_CONFIG = {
    publicKey: 'pub_prod_rnYo9cubWyL1tG3mp2T3QCRtDYGKul9b',
    currency: 'COP',
    successUrl: `${window.location.origin}/pago-exitoso.html`,
    cancelUrl: `${window.location.origin}/pago-cancelado.html`
};

window.dispatchEvent(new Event('wompi_ready'));
