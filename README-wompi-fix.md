# Fix Wompi Widget + Redirects

## Causa raíz
- El archivo `static/js/wompi-estatico-completo.min.js` tenía el `script.src` truncado (`'https:`), lo que rompía la carga del widget.
- La validación de `redirectUrl` era débil y podía aceptar URLs incompletas o inválidas.

## Qué se corrigió
- Carga robusta del script con `loadWompiCheckoutScript()` (URL oficial completa, dedupe, timeout y telemetría opcional).
- Normalización segura de `redirectUrl` con `sanitizeRedirectUrl()`.
- Fallback UI para reintento y WhatsApp si el widget falla.
- Self-check de `sanitizeRedirectUrl` activable con `window.NB_WOMPI_DEBUG = true`.

## Cómo probar (local)
1. Abrir el sitio y agregar productos al carrito.
2. Click en “Pagar con Tarjeta / PSE / Nequi”.
3. Verificar que el widget de Wompi cargue y muestre el checkout.

## Escenarios de prueba
1. **Script carga OK**: widget abre y permite pagar.
2. **Script falla**: simular bloqueo de `https://checkout.wompi.co/widget.js` y confirmar fallback con botones.
3. **Redirect inválido**: configurar `window.NB_WOMPI_CONFIG.successUrl = "javascript:alert(1)"` y confirmar que se reemplaza por fallback seguro.
4. **Redirect válido**: usar `https://naturalbe.com.co/pago-exitoso.html` y confirmar que se respeta.
5. **Pending**: forzar estado pendiente (si el PSP lo permite) y confirmar redirect a `pago-pendiente.html`.

## Nota de minificación
El archivo `static/js/wompi-estatico-completo.min.js` fue reemplazado con la versión fuente para garantizar el fix.  
Si quieres minificar, puedes usar cualquier minificador (ej. Terser) y reemplazar el `.min.js` con el output.
