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

## Despliegue subdominio

Ver `DEPLOY_SUBDOMAIN.md`.
