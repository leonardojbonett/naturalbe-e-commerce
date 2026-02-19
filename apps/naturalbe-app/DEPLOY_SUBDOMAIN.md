# Despliegue en `app.naturalbe.com.co`

## 1) Deploy del frontend

Puedes usar Vercel, Netlify o Cloudflare Pages con esta carpeta como root:

- Root directory: `apps/naturalbe-app`
- Build command: `npm run build`
- Output: `dist`

## 2) DNS del subdominio

En tu proveedor DNS:

- Crea `CNAME` para `app` apuntando al host que te entregue tu plataforma.

Ejemplos:

- Vercel: `cname.vercel-dns.com`
- Netlify: `your-site.netlify.app`
- Cloudflare Pages: `your-project.pages.dev`

## 3) SSL

Activa certificado automatico (Let's Encrypt) en la plataforma.

## 4) Variables de entorno

Configura en la plataforma:

- `VITE_APP_ENV=production`
- `VITE_API_BASE_URL=https://app.naturalbe.com.co`
- `VITE_WA_NUMBER=573137212923`
- `VITE_PRODUCTS_PATH=/productos.json`
- `VITE_CATALOG_ASSETS_BASE_URL=https://naturalbe.com.co`

## 5) Estrategia recomendada

1. Primero subir staging: `app-stg.naturalbe.com.co`.
2. Validar UX mobile + checkout + tracking.
3. Luego publicar en `app.naturalbe.com.co`.

