# Natural Be App (subdominio)

Proyecto nuevo y aislado para la app en `app.naturalbe.com.co`, sin tocar la web actual.

## Stack

- React + TypeScript + Vite
- React Router
- Zod para validacion de variables de entorno
- Vitest + Testing Library
- ESLint

## Requisitos

- Node.js 20+ (ya tienes Node 24)
- npm 10+

## Inicio rapido

```bash
cd apps/naturalbe-app
cp .env.example .env
npm install
npm run dev
```

App local: `http://localhost:5174`

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run test
npm run order-api:dev
npm run metrics:summary
npm run metrics:check
npm run metrics:baseline
npm run sitemap:app
```

## Estructura base

```txt
apps/naturalbe-app/
  public/
  src/
    app/
    components/
    core/
    features/
    pages/
    styles/
    test/
```

## Catalogo MVP

- Ruta principal de catalogo: `/`
- Ruta carrito: `/carrito`
- Ruta checkout: `/checkout`
- Ruta detalle de producto: `/producto/:slug`
- Endpoint configurable: `VITE_PRODUCTS_PATH` (default: `/productos.json`)
- Endpoint de ordenes: `VITE_ORDER_API_PATH` (default: `/api/orders`)
- Endpoint de metricas de UX: `VITE_METRICS_PATH` (default: `/api/metrics`)
- Release tag para metricas: `VITE_APP_RELEASE` (default: `dev-local`)
- Origen canonical para SEO tecnico: `VITE_SITE_ORIGIN` (default: `https://naturalbe.com.co`)
- Base de assets del catalogo: `VITE_CATALOG_ASSETS_BASE_URL` (default: `https://naturalbe.com.co`)
- Control de fallback local: `VITE_ALLOW_MOCK_CATALOG_FALLBACK` (default: `true` en dev, `false` en production).
- El checkout confirma la orden en backend, recalcula subtotal/envio/total y solo despues arma el mensaje de WhatsApp.

## API de Ordenes (local)

Para probar el checkout con validacion server-side:

```bash
npm run order-api:dev
```

Variables opcionales del API:

- `ORDER_API_PORT` (default `8787`)
- `ORDER_CATALOG_PATH` (default `public/productos.json`)
- `ORDER_LOG_PATH` (default `.tmp/orders/orders.jsonl`)
- `ORDER_METRICS_LOG_PATH` (default `.tmp/orders/metrics.jsonl`)
- `ORDER_ALLOWED_ORIGINS` (default: `http://localhost:5174,http://127.0.0.1:5174,https://app.naturalbe.com.co,https://naturalbe.com.co`)
- `ORDER_TRUST_PROXY` (default `false`; usar `true` solo detras de proxy confiable para leer `x-forwarded-for`)
- `GET /api/metrics/summary` para consultar agregados (`metric`, `release`, `from`, `to`, `groupBy=day`)

Plantilla recomendada para entorno del API: `.env.order-api.example`.

## Dashboard local de metricas

Genera resumen estadistico (`avg/p50/p95/p99`) desde el log JSONL:

```bash
npm run metrics:summary
npm run metrics:check
npm run metrics:baseline
```

Opcionalmente puedes pasar rutas custom:

```bash
node scripts/metrics-summary.mjs .tmp/orders/metrics.jsonl .tmp/orders/metrics-summary.md
```

`metrics:summary` tambien genera:
- `.tmp/orders/metrics-summary.html`
- `.tmp/orders/metrics-summary.json`

Chequeo de regresion (falla con exit code 1 si p95 supera umbral):

```bash
npm run metrics:check
```

`metrics:check` tambien compara p95 contra baseline (si existe) en `.tmp/orders/metrics-baseline.json`.
Puedes controlar la tolerancia con `THRESHOLD_P95_DELTA_PCT` (default: `20`).

En CI (`.github/workflows/naturalbe-app-ci.yml`) hay dos compuertas:
- PR/no-main: corre `lint`, `typecheck`, `test`, `build` y `metrics:check` si existe `metrics.jsonl`.
- Push a `main`: gate estricto, `metrics.jsonl` es obligatorio y `metrics:check` puede bloquear el deploy por regresion.

## SEO tecnico app

- `canonical`, `og:*`, `twitter:*`, `robots` y `hreflang` se actualizan dinamicamente por ruta.
- `robots` usa `noindex,nofollow` fuera de `production`.
- `ProductPage` agrega JSON-LD (`Product` y `BreadcrumbList`) y preload/preconnect de imagen principal.
- Sitemap de rutas SPA y productos:

```bash
npm run sitemap:app
```

Genera `public/sitemap-app.xml`.

## Integracion Instagram Graph API

Objetivo: mostrar publicaciones recientes de Instagram en el catalogo sin exponer tokens en frontend.

### 1) Requisitos en Meta

- Cuenta de Instagram Business o Creator.
- Cuenta conectada a una pagina de Facebook.
- App en Meta for Developers con permisos:
  - `instagram_basic`
  - `pages_show_list`
  - `instagram_manage_insights` (opcional, para analitica futura)

### 2) Variables para sincronizar el feed

Antes de ejecutar el script, define en tu terminal:

```bash
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_IG_USER_ID=...
INSTAGRAM_USERNAME=naturalbe__
INSTAGRAM_ITEMS_LIMIT=8
INSTAGRAM_PROFILE_URL=https://www.instagram.com/naturalbe__/
INSTAGRAM_GRAPH_VERSION=v22.0
```

### 3) Generar JSON local para la app

```bash
npm run instagram:sync
```

Esto actualiza `public/instagram-feed.json`, que luego se sirve en `VITE_INSTAGRAM_FEED_PATH` (default: `/instagram-feed.json`).

### 4) Dónde se muestra en la UI

- Componente: `src/features/social/components/InstagramFeed.tsx`
- Página: `src/pages/CatalogPage.tsx`

Si el JSON no existe, está vacío o falla, el bloque de Instagram no se renderiza (fallback silencioso).

## Despliegue subdominio

Ver `DEPLOY_SUBDOMAIN.md`.
