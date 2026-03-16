# Despliegue en `app.naturalbe.com.co`

## 1) Deploy del frontend

Puedes usar Vercel, Netlify o Cloudflare Pages con esta carpeta como root:

- Root directory: `apps/naturalbe-app`
- Build command: `npm run build`
- Output: `dist`

### Hostinger (`public_html`) - opcion directa

1. Ejecuta `npm run build` en `apps/naturalbe-app`.
2. Sube el contenido de `dist/` a la carpeta destino del subdominio/app
   (por ejemplo `public_html/app/` o la raiz del subdominio).
3. Confirma que `.htaccess` se haya subido junto con `index.html`.
   Este repo ya incluye `public/.htaccess`, por lo que Vite lo copia a `dist/`.
4. No reemplaces archivos de la raiz principal de `public_html` si alli vive la web desktop/mobile.

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

## 5) Variables del `order-api` (seguridad)

Si usas `server/order-api.mjs`, define:

- `ORDER_ALLOWED_ORIGINS=https://app.naturalbe.com.co,https://naturalbe.com.co`
- `ORDER_TRUST_PROXY=false` si expones Node directo.
- `ORDER_TRUST_PROXY=true` solo si el API esta detras de proxy confiable (Nginx/Cloudflare/ALB) y ese proxy controla `x-forwarded-for`.

Referencia local: `.env.order-api.example`.

## 6) Estrategia recomendada

1. Primero subir staging: `app-stg.naturalbe.com.co`.
2. Validar UX mobile + checkout + tracking.
3. Luego publicar en `app.naturalbe.com.co`.

## 7) Proxy reverso (Nginx / Apache) para `ORDER_TRUST_PROXY=true`

Usa `ORDER_TRUST_PROXY=true` solo si tu proxy inyecta y controla `X-Forwarded-For`.

### Nginx (ejemplo)

```nginx
server {
    listen 443 ssl http2;
    server_name app.naturalbe.com.co;

    # SSL config...

    location /api/ {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}
```

### Apache (VirtualHost + mod_proxy)

```apache
<VirtualHost *:443>
    ServerName app.naturalbe.com.co

    # SSL config...

    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:8787/api/
    ProxyPassReverse /api/ http://127.0.0.1:8787/api/

    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Host "%{HTTP_HOST}s"
    RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"
</VirtualHost>
```

### Checklist minima en produccion

1. `ORDER_ALLOWED_ORIGINS=https://app.naturalbe.com.co,https://naturalbe.com.co`
2. `ORDER_TRUST_PROXY=true` (solo si usas proxy reverso confiable)
3. API escuchando en loopback (`127.0.0.1`) o red privada, no expuesta directamente a internet.
4. Verificar que `OPTIONS /api/orders` y `POST /api/orders` respondan con CORS correcto.

