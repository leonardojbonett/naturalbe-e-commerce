# Natural Be - Tienda estatica (Marketplace)

Proyecto HTML/CSS/JS sin backend. Home, PLP y PDP se renderizan con data local en `static/data/productos.json`.

## Estructura basica
- `index.html` (home)
- `category.html` (PLP + resultados de busqueda)
- `product.html` (PDP)
- `static/css/main.css` (design system y componentes)
- `static/js/products-data.js` (normaliza productos + fallback)
- `static/js/cart.js` (carrito + Wompi/WhatsApp)

## Agregar/editar productos
1) Edita `static/data/productos.json` (UTF-8) y agrega productos con:
   - `id`, `slug`, `nombre`, `marca`, `categoria`, `precio`, `imagen_principal`, `tags`, `rating_value`, `rating_count`.
   - Opcional SEO: `lastmod` (formato `YYYY-MM-DD`) para sitemap.
2) Imagenes locales recomendadas en `/assets/products/<slug>.webp` (fallback si no hay URL).
3) Usa slugs en kebab-case y categorias consistentes (ej: vitaminas, minerales, omega, colageno).

## Categorias/objetivos/tags
- Categorias y objetivos se editan en `category.html` (selects y mapa `objectiveMap`).
- Tags se definen por producto en `productos.json`.

## CSS tokens
- Variables en `static/css/main.css` (buscar `:root` con `--space-*`, `--radius-*`, `--shadow-*`, `--text-*`).

## Busqueda
- El buscador envia a `category.html?q=...` (no hay `search.html`).

## Versionado y rutas
- Version del catalogo: se define en `static/js/marketplace.js` (`DATA_VERSION`). Incrementa ese valor cuando cambies `productos.json`.
- Base path: se detecta automaticamente y se guarda en `window.NB_BASE_PATH` para soportar subcarpetas (ej: `/tienda/`).

## Local y Hostinger
- Abre `index.html` con Live Server (o `scripts/serve.ps1`) para permitir fetch del JSON y evitar errores de `file://`.
- En Hostinger sube: `index.html`, `category.html`, `product.html`, `static/`, `assets/products/`, `robots.txt`, `sitemap.xml`.

## Sitemap y paginas de producto
- Genera paginas estaticas: `npm run products:pages` (salida en `producto/`).
- Regenera sitemap con productos: `npm run sitemap`.

## Notas
- Si el fetch falla, se usa un catalogo fallback desde `products-data.js` y se muestra aviso con reintento.
- Para desactivar el mini-cart drawer: define `window.NB_MINI_CART_ENABLED = false` antes de cargar `static/js/cart.js`.
