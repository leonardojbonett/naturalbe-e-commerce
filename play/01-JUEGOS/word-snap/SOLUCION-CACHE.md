# 🔧 Solución al Problema de Caché y Fetch

## 🎯 Problemas Identificados

### 1. Caché del navegador
Las palabras siempre aparecen iguales porque el navegador está usando **caché** del archivo `themes.json`.

### 2. Error de NetworkError (CORS)
Si abres el archivo directamente (`file://`), el navegador bloquea las peticiones `fetch()` por seguridad.

## ✅ Soluciones Disponibles

### Solución A: Usar Servidor Local (RECOMENDADO)

#### Opción más fácil:
1. Haz doble clic en `start-server.bat` (Windows)
2. Abre http://localhost:8000/word-snap.html
3. ¡Listo!

Ver `INICIAR-SERVIDOR.md` para más opciones.

### Solución B: Versión Standalone (Sin servidor)

1. Abre `word-snap-standalone.html` directamente
2. Funciona sin servidor (temas embebidos)
3. Ideal para pruebas rápidas

## 🔧 Cambios Técnicos Aplicados

### 1. Cache-busting en el código
He modificado `word-snap.js` para forzar la recarga del JSON:

```javascript
// ANTES (con caché)
const response = await fetch('themes.json');

// AHORA (sin caché)
const timestamp = new Date().getTime();
const response = await fetch(`themes.json?v=${timestamp}`, {
    cache: 'no-store'
});
```

### 2. Logs de depuración
Añadí logs en consola para verificar qué tema se carga:
```javascript
console.log('🎯 Tema seleccionado:', this.currentTheme);
console.log('📝 Palabras:', this.words);
```

## 🧪 Cómo Probar

### Opción 1: Usar el test de caché
1. Abre: `test-cache.html`
2. Verifica que carga el tema correcto
3. Si no funciona, haz clic en "Limpiar Caché"

### Opción 2: Limpiar caché manualmente

#### Chrome/Edge:
1. Presiona `Ctrl + Shift + Delete` (Windows) o `Cmd + Shift + Delete` (Mac)
2. Selecciona "Imágenes y archivos en caché"
3. Haz clic en "Borrar datos"

#### Firefox:
1. Presiona `Ctrl + Shift + Delete`
2. Marca "Caché"
3. Haz clic en "Limpiar ahora"

#### Safari:
1. Menú Safari > Preferencias > Avanzado
2. Marca "Mostrar menú Desarrollo"
3. Menú Desarrollo > Vaciar cachés

### Opción 3: Recarga forzada
- **Windows**: `Ctrl + F5` o `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

## 🔍 Verificar en Consola

Abre la consola del navegador (F12) y busca:
```
🎯 Tema seleccionado: Memes TikTok
📝 Palabras: ["SKIBIDI", "RIZZ", "GYATT", "OHIO", "CAPCUT"]
```

Si ves esto, el caché está limpio y funciona correctamente.

## 📅 Temas por Fecha

El juego ahora carga temas según la fecha:

- **2025-11-26**: 🎭 Memes TikTok
- **2025-11-27**: 📺 Series Netflix
- **2025-11-28**: 🎵 Reggaeton
- **2025-11-29**: ⭐ Celebridades
- **2025-11-30**: 🎮 Gaming
- **2025-12-01**: 📱 TikTok Trends
- **2025-12-02**: ⚽ Futbol

Si no hay tema para la fecha actual, usa temas de respaldo rotativos.

## 🚀 Para Producción

### Añadir headers en el servidor
Si subes a un servidor, configura headers para evitar caché:

#### Apache (.htaccess):
```apache
<FilesMatch "\.(json)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</FilesMatch>
```

#### Nginx:
```nginx
location ~* \.json$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires 0;
}
```

#### Node.js/Express:
```javascript
app.get('/themes.json', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile('themes.json');
});
```

## 🎮 Integrar Niveles de Campaña

Para usar los 100 niveles creados en `campaign-levels.json`:

```javascript
// En word-snap.js, añadir:
async loadCampaignLevels() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`campaign-levels.json?v=${timestamp}`, {
            cache: 'no-store'
        });
        const data = await response.json();
        this.campaignLevels = data.campaignLevels;
    } catch (error) {
        console.warn('No se pudieron cargar niveles de campaña');
    }
}
```

## ✨ Resultado Esperado

Después de aplicar estas soluciones:
- ✅ Cada día tendrá palabras diferentes
- ✅ No se repetirán las mismas letras
- ✅ Los temas cambiarán automáticamente
- ✅ El caché no interferirá

## 🆘 Si Sigue Sin Funcionar

1. Abre la consola (F12)
2. Ve a la pestaña "Network" (Red)
3. Recarga la página
4. Busca `themes.json`
5. Verifica que el Status sea `200` (no `304 Not Modified`)
6. Revisa la respuesta para confirmar que tiene los datos correctos

Si ves `304 Not Modified`, el navegador sigue usando caché. Prueba en modo incógnito.
