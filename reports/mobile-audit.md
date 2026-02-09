# Mobile Audit & Overhaul - Natural Be

Fecha: 2026-02-09

## Hallazgos (antes de cambios)
- Viewport sin `viewport-fit=cover` (index.html:91, category.html:22, product.html:24). Recomendado para iOS notch y evitar zoom.
- Grid de productos en mobile forzado a 1 columna con padding extra, lo que hace cards enormes y más scroll (static/css/main.css:5141 en bloque mobile).
- Cards con media 4/3 y `object-fit: contain`, dejando imágenes pequeñas y poca densidad visual en mobile (static/css/main.css:4205).
- Header con grid 3 columnas y gaps grandes; en 360px la barra de búsqueda y acciones se sienten apretadas y propensas a overflow (static/css/main.css:3980).
- No había CTA sticky en PDP, obligando a volver a la zona de compra (product.html + static/css/main.css:4790).
- Falta de reglas globales para evitar overflow horizontal y normalizar imágenes.

## Quick Wins aplicados
- `viewport-fit=cover` agregado (index.html:91, category.html:22, product.html:24).
- Base tipográfica de 16px + line-height 1.55.
- Imágenes normalizadas con `max-width:100%`.
- `overflow-x: hidden` en `html, body`.
- Grid de productos a 2 columnas en mobile con gap consistente.
- Imagen 1:1 en cards y `object-fit: cover` en mobile.

## Cambios estructurales
- Sticky CTA en PDP (mobile) con “Agregar al carrito” + “Comprar por WhatsApp”.
- Contenedor y spacing móvil con tokens (`--nb-container-padding`, `--nb-container-max`).
- Tipografía fluida con `clamp()` para títulos y subtítulos.
- Header compacto en mobile (menos padding, acción-links ocultos, navegación horizontal scroll).

## Checklist Mobile (equivalente Lighthouse)
- CLS: mitigado con aspect-ratio en media de cards y padding bottom en PDP para sticky CTA.
- Accesibilidad: base font 16px, botones mínimos 44px en mobile.
- Performance: sin dependencias nuevas; mejoras solo CSS. Nota: imágenes con placeholder o sin `webp` siguen afectando LCP.

## Captura mental: qué se rompía en 360px
- Cards en 1 columna con imágenes pequeñas y texto apretado.
- Header con demasiados elementos visibles generando compresión visual.
- PDP sin CTA fijo obliga a scroll para comprar.

## Archivos tocados
- index.html
- category.html
- product.html
- static/css/main.css
- static/css/main.min.css

