# Natural Be - Tienda estatica (Marketplace)

Proyecto HTML/CSS/JS sin backend. Home, PLP y PDP se renderizan con data local en `static/data/productos.json`.

## Estructura basica
- `index.html` (home)
- `category.html` (PLP + resultados de busqueda)
- `product.html` (PDP)
- `checkout.html` (checkout dedicado para Wompi, fuera del modal)
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

## Deploy limpio (Hostinger)
- Elimina archivos JS obsoletos en `/public_html/static/js/` antes de subir (ej: `product.bundle.min.js`, `bundle.min.js`, `inline/product.bundle.min.js`).
- Borra el cache del Service Worker: en Chrome DevTools > Application > Service Workers > Unregister, y limpia `Cache Storage`.
- Vuelve a subir todo el contenido del repo para evitar residuos de despliegues previos.
  - Script: `powershell -File scripts/clean-hostinger.ps1 -RootPath C:\path\to\public_html`
  - Dry run: `powershell -File scripts/clean-hostinger.ps1 -RootPath C:\path\to\public_html -DryRun`
 - Predeploy checks: `powershell -File scripts/predeploy.ps1`

## Smoke test rapido
- Validar que no haya `https://` sueltos (sin comillas) que rompan el bundle:
  - `powershell -File scripts/smoke-product.ps1`
- Validar rutas absolutas en HTML/JS (evita assets rotos en subcarpetas):
  - `powershell -File scripts/check-static-paths.ps1`
- Validar prerrequisitos de schema Product (PDP):
  - `node scripts/validate-product-schema.js`
- Validar implementación JSON-LD en plantilla PDP:
  - `node scripts/validate-pdp-jsonld-template.js`
- Validar todo el bloque SEO schema (catálogo + plantilla PDP):
  - `node scripts/validate-seo-schema.js`
- Validar canonical de URLs de producto en sitemap (sin `.html`):
  - `node scripts/validate-sitemap-product-canonical.js`
- Validar `lastmod` de sitemap (sin fechas futuras):
  - `node scripts/validate-sitemap-lastmod.js`
- Validar copy SEO de productos (detecta faltantes y frases semanticas incorrectas como "uso topico" en suplementos orales):
  - `node scripts/validate-product-seo-copy.js`
- Mejorar copy SEO de productos en lote (titulos largos + descripciones genericas):
  - `node scripts/improve-product-seo-copy.js`
  - A/B (comercial + tecnica): `node scripts/improve-product-seo-copy.js --mode both --apply commercial`
  - Solo tecnica activa: `node scripts/improve-product-seo-copy.js --mode single --apply technical`
- Auditoria Lighthouse con mediana (3 corridas por URL):
  - `powershell -ExecutionPolicy Bypass -File scripts/lighthouse-median.ps1 -Runs 3 -Label prod`
  - Salida: `reports/lh-summary-prod.json` y `reports/lh-summary-prod.md`
  - Variante local (levanta server y audita `index/category/product`): `powershell -ExecutionPolicy Bypass -File scripts/lighthouse-local-median.ps1 -Runs 3 -Label local`
  - Comparar resumen contra baseline histórico del repo: `node scripts/lighthouse-compare.js reports/lh-summary-prod.json`

## Sitemap y paginas de producto
- Genera paginas estaticas: `npm run products:pages` (salida en `producto/`).
- Regenera sitemap con productos: `node scripts/generate-sitemap.js`.
- Regenera sitemap de imagenes para Google Images/Discover: `node scripts/generate-image-sitemap.js`.

## Notas
- Si el fetch falla, se usa un catalogo fallback desde `products-data.js` y se muestra aviso con reintento.
- Para desactivar el mini-cart drawer: define `window.NB_MINI_CART_ENABLED = false` antes de cargar `static/js/cart.js`.

## Checklist SEO URLs limpias
- Abrir `/producto/<slug>` y confirmar que carga el producto correcto.
- Abrir `/producto/<slug>.html` y confirmar `301` a `/producto/<slug>`.
- Abrir `/product.html?slug=<slug>` y confirmar que termina en `/producto/<slug>` (server o `location.replace`).
- Abrir `/product.html?id=<id>` y confirmar que termina en `/producto/<slug>` por redirección JS.
- Abrir `/category.html?q=omega` y confirmar `301` a `/categoria/omega`.
- Verificar que no haya loops de redirección ni `404` en rutas legacy.

## Generador de catalogo PDF (Natural Be)

Generador A4 profesional con portada, indice real por categorias, secciones, grilla de tarjetas y flujo robusto de imagenes reales por producto.

### Arquitectura de archivos
- `build_catalog.py`: script principal CLI (orquestacion de carga, filtros y render PDF).
- `data_loader.py`: lectura de `JSON/CSV`, defaults, validaciones y ordenado.
- `fetch_images.py`: resolucion y descarga de imagen real desde `product_url` con fallbacks (OG, JSON-LD, Twitter, selectores, preload), concurrencia, retries y reporte de faltantes.
- `image_cache.py`: ajuste de imagen para tarjeta en modo *contain* (sin deformar) usando imagen local cacheada.
- `qr_utils.py`: QR por producto y etiqueta de URL corta.
- `pdf_layout.py`: layout del PDF (portada, indice, secciones, grilla, header/footer).
- `build_catalog_web.py`: genera catalogo web estatico (`/catalogo/index.html`) para clientes.
- `products.sample.json`: datos de ejemplo para prueba rapida.
- `report_missing_images.csv`: reporte de SKUs sin imagen valida (se genera en ejecucion).
- `report_image_quality.csv`: auditoria de calidad (resolucion/peso/aspect ratio) para revisar fotos.
- `report_image_resolution.csv`: trazabilidad de resolucion (`override_local`, `local_image`, `local_fuzzy`, `ok`, etc.).
- `image_overrides.sample.json`: plantilla para forzar imagen exacta por SKU/slug/url.

### Requisitos
- Python `3.10+`
- Dependencias:

```bash
pip install reportlab pillow requests beautifulsoup4 tqdm
```

### Formato de entrada (`products.json`)
Ejemplo de estructura:

```json
[
  {
    "sku": "SKU-001",
    "name": "Vitamina C 1000 mg",
    "brand": "Marca X",
    "category": "Vitamina C",
    "price_cop": 45900,
    "sale_price_cop": 39900,
    "availability": "in_stock",
    "short_benefits": ["Apoya defensas", "Antioxidante"],
    "presentation": "100 capsulas",
    "image_url": "https://.../image.jpg",
    "product_url": "https://naturalbe.com.co/..."
  }
]
```

Campos criticos: `name`, `price_cop` (o `price`) y `product_url`.
Si faltan, se registran *warnings* y el producto se omite sin detener la ejecucion.

Defaults automáticos cuando faltan campos no criticos:
- `brand`: `Natural Be`
- `category`: `General`
- `availability`: `unknown`
- `presentation`: `Presentacion no especificada`
- `short_benefits`: beneficios genericos

### Uso basico

```bash
python build_catalog.py --input products.json --output catalogo.pdf --columns 3 --currency COP --download-images --cache cache_images
```

### Catalogo web (online)

```bash
python build_catalog_web.py --input productos_enriquecido.json --output catalogo/index.html --title "Catalogo Natural Be" --subtitle "Vitaminas y suplementos" --brand "Natural Be"
```

### Parametros CLI
- `--input`: ruta del archivo `.json` o `.csv` de productos.
- `--output`: ruta del PDF de salida (default: `catalogo.pdf`).
- `--columns`: `2` o `3` columnas en grilla (default: `2`).
- `--currency`: moneda de salida (default: `COP`).
- `--include-categories`: incluir categorias (coma separadas).
- `--exclude-categories`: excluir categorias (coma separadas).
- `--sale-only`: incluir solo productos en oferta.
- `--download-images`: habilita resolucion/descarga de imagenes reales desde `product_url`.
- `--cache`: directorio de cache de imagenes/HTML (default: `cache_images`).
- `--workers`: hilos concurrentes para imagenes (default: `10`).
- `--report-missing`: CSV de imagenes faltantes (default: `report_missing_images.csv`).
- `--report-quality`: CSV de calidad de imagenes (default: `report_image_quality.csv`).
- `--report-resolution`: CSV de trazabilidad de resolucion (default: `report_image_resolution.csv`).
- `--image-overrides`: JSON con overrides de imagen por `SKU`, `slug` o `product_url`.
- `--quality-min-width`: ancho minimo para auditoria (default: `500`).
- `--quality-min-height`: alto minimo para auditoria (default: `500`).
- `--quality-min-kb`: peso minimo en KB para auditoria (default: `20`).
- `--quality-max-aspect-ratio`: aspect ratio maximo permitido (default: `2.8`).
- `--logo-path`: ruta local a logo para portada.
- `--title`: titulo de portada (default: `Catalogo Natural Be`).
- `--subtitle`: subtitulo de portada (default: `Vitaminas y suplementos`).
- `--brand`: marca para header/footer (default: `Natural Be`).
- `--no-qr`: desactiva QR de tarjetas.

### Ejemplos

Solo ofertas:

```bash
python build_catalog.py --input products.json --output catalogo_ofertas.pdf --sale-only --download-images
```

Solo categorias especificas:

```bash
python build_catalog.py --input products.json --include-categories "Vitaminas,Omega" --output catalogo_vit_omega.pdf --download-images
```

Tres columnas y sin QR:

```bash
python build_catalog.py --input products.json --columns 3 --no-qr --output catalogo_3col.pdf --download-images
```

### Prueba rapida

```bash
python build_catalog.py --input products.sample.json --output catalogo.sample.pdf --columns 2 --currency COP --download-images
```

### Solo resolver/descargar imagenes (sin generar PDF)

```bash
python fetch_images.py --input products.json --cache cache_images --workers 10 --report report_missing_images.csv --report-quality report_image_quality.csv
```

### Perfil estricto recomendado (impresion/catalogo premium)

```bash
python build_catalog.py --input productos_enriquecido.json --output catalogo.naturalbe.real.pdf --columns 3 --currency COP --download-images --cache cache_images --workers 10 --report-missing report_missing_images.csv --report-quality report_image_quality.csv --quality-min-width 900 --quality-min-height 900 --quality-min-kb 40 --quality-max-aspect-ratio 2.2
```

### Forzar imagen exacta (overrides)

1. Copia `image_overrides.sample.json` a `image_overrides.json`.
2. Agrega pares `clave -> imagen` donde clave puede ser `SKU`, `slug` o `product_url`.
3. Ejecuta:

```bash
python build_catalog.py --input productos_enriquecido.json --output catalogo.naturalbe.real.pdf --columns 3 --currency COP --download-images --cache cache_images --image-overrides image_overrides.json --report-missing report_missing_images.csv --report-quality report_image_quality.csv --report-resolution report_image_resolution.csv
```

### Notas de calidad del layout
- PDF en A4 con margenes de 20 mm.
- Portada + indice por categorias con paginacion real.
- Ordenado: categoria alfabetica; dentro de categoria: disponibilidad primero (`in_stock`) y luego nombre.
- Imagenes reales: prioriza `og:image`, `JSON-LD Product.image`, `twitter:image`, selectores de imagen principal y preload de imagen.
- Descarga robusta: headers anti-hotlink (`User-Agent`, `Referer`, `Accept`), 3 reintentos con backoff, concurrencia configurable (10 por defecto).
- Filtro de placeholders: descarta URLs con `placeholder/no-image/default/spacer` y archivos menores a 10KB.
- WEBP se normaliza a JPG para compatibilidad con ReportLab.
- Las imagenes se embeben desde disco (cache local), no hotlink en el PDF.
- Prioridad de imagen: primero `image_url/imagen_principal` del feed; scraping de `product_url` solo como fallback.
- Auditoria de calidad: marca `review` cuando detecta baja resolucion, archivo pequeño o aspect ratio extremo.
- Si cambias reglas de extraccion, usa un cache nuevo (`--cache cache_images_v2`) para evitar reutilizar resultados previos.
- Header/Footer con marca, pagina y disclaimer: `Suplemento dietario. No es un medicamento.`
- Truncado de textos largos para evitar desbordes.
