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
- Base de assets del catalogo: `VITE_CATALOG_ASSETS_BASE_URL` (default: `https://naturalbe.com.co`)
- Si el endpoint falla o aun no existe, la app usa un fallback local para continuar pruebas de UX.

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
