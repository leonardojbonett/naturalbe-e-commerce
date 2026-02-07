# 🚀 Deploy Portal NaturalBe Games en Hostinger - Guía Completa V2.5

## 📋 Información del Deploy

**Subdominio:** https://play.naturalbe.com.co  
**Ruta en servidor:** `public_html/play/`  
**Fecha:** 2025-11-27  
**Versión:** V2.5 - Portal + 2 Juegos  

---

## 🎮 Estructura del Portal

El portal ahora tiene una página principal (hub) que muestra todos los juegos disponibles:

```
https://play.naturalbe.com.co/
├── index.html              (Portal/Hub de juegos)
├── word-snap.html          (Word Snap - Juego 1)
├── marathon.html           (Word Snap Maratón)
└── trivia-challenge.html   (Trivia Challenge - Juego 2)
```

---

## 📦 Archivos a Subir a Hostinger

### 🆕 NUEVOS Archivos:
1. **`index.html`** (Portal/Hub) - NUEVO
2. **`word-snap.html`** (antes era index.html) - RENOMBRADO
3. **`trivia-challenge.html`** (actualizado con mejoras)
4. **`trivia-challenge.js`** (actualizado con logros)
5. **`trivia-data.js`** (banco de preguntas)

### 🔄 ACTUALIZADOS:
6. **`marathon.html`** (enlaces actualizados)
7. **`achievements.js`** (logros de Trivia agregados)

### ✅ Sin Cambios (ya deben estar):
- `styles-v2.css`
- `word-snap-campaign.js`
- `word-snap-marathon.js`
- `word-snap-levels.js`
- `xp-manager.js`
- `coins-manager.js`
- `audio-manager.js`
- `ad-manager.js`
- `error-manager.js`
- `performance-optimizer.js`
- Resto de archivos JS

---

## 🚀 Pasos para Subir a Hostinger

### ⚠️ IMPORTANTE: Orden de Subida

**Paso 1: Hacer Backup**
1. Descargar `index.html` actual de Hostinger (por seguridad)
2. Guardarlo como `index-old.html` en tu PC

**Paso 2: Subir Archivos NUEVOS**
1. Ir a Hostinger File Manager
2. Navegar a `public_html/play/`
3. Subir estos archivos NUEVOS:
   - `word-snap.html` (el juego de Word Snap)
   - `trivia-challenge.html`
   - `trivia-challenge.js`
   - `trivia-data.js`

**Paso 3: REEMPLAZAR index.html**
1. **ELIMINAR** el `index.html` actual del servidor
2. **SUBIR** el nuevo `index.html` (portal)
3. Verificar que se subió correctamente

**Paso 4: Actualizar Archivos Existentes**
1. Reemplazar `marathon.html`
2. Reemplazar `achievements.js`

**Paso 5: Verificar**
1. Abrir: https://play.naturalbe.com.co/
2. Debe mostrar el portal con 2 tarjetas de juegos
3. Click en "Word Snap" → debe abrir word-snap.html
4. Click en "Trivia Challenge" → debe abrir trivia-challenge.html

---

## 🎨 Mejoras Implementadas en Trivia Challenge

### UI/UX:
- ✅ Animación de respuesta correcta (pulse verde)
- ✅ Animación de respuesta incorrecta (shake rojo)
- ✅ Parpadeo cuando queda 1 vida
- ✅ Responsive mejorado para móviles
- ✅ Texto adaptativo en preguntas largas
- ✅ Grid de respuestas en columna en móviles pequeños

### Logros:
- ✅ Primer Quiz
- ✅ Cerebro en Llama (racha de 5)
- ✅ Perfeccionista (10/10)
- ✅ Maratón de Trivia (100 preguntas)
- ✅ Logros por categoría (Historiador, Científico, etc.)

### Integración:
- ✅ XP Manager integrado
- ✅ Coins Manager integrado
- ✅ Achievements Manager actualizado
- ✅ Estadísticas guardadas en LocalStorage

---

## 🌐 Navegación del Portal

### Desde el Portal (index.html):
- Click en tarjeta "Word Snap" → `word-snap.html`
- Click en tarjeta "Trivia Challenge" → `trivia-challenge.html`

### Desde Word Snap:
- Botón "← Volver al Portal" → `index.html`
- Botón "🧠 Trivia" → `trivia-challenge.html`
- Botón "🏃 Maratón" → `marathon.html`

### Desde Trivia Challenge:
- Botón "← Volver al Portal" → `index.html`

### Desde Maratón:
- Botón "← Volver a Campaña" → `word-snap.html`

---

## 📊 Estructura Final en el Servidor

```
public_html/play/
├── index.html                  (Portal - NUEVO)
├── word-snap.html              (Word Snap - RENOMBRADO)
├── marathon.html               (Maratón - ACTUALIZADO)
├── trivia-challenge.html       (Trivia - ACTUALIZADO)
├── styles-v2.css
├── word-snap-campaign.js
├── word-snap-marathon.js
├── word-snap-levels.js
├── trivia-challenge.js         (ACTUALIZADO)
├── trivia-data.js              (NUEVO)
├── xp-manager.js
├── coins-manager.js
├── achievements.js             (ACTUALIZADO)
├── audio-manager.js
├── ad-manager.js
├── error-manager.js
├── performance-optimizer.js
├── daily-rewards.js
├── weekly-event.js
└── skins-system.js
```

---

## ✅ Checklist de Verificación

### Pre-Deploy:
- [x] Portal (index.html) creado
- [x] Word Snap renombrado a word-snap.html
- [x] Trivia Challenge mejorado
- [x] Logros de Trivia agregados
- [x] Enlaces actualizados en todos los archivos
- [x] Responsive mejorado
- [x] Animaciones agregadas

### Post-Deploy:
- [ ] Backup del index.html viejo hecho
- [ ] Archivos subidos a Hostinger
- [ ] Portal accesible en https://play.naturalbe.com.co/
- [ ] Word Snap funciona desde portal
- [ ] Trivia Challenge funciona desde portal
- [ ] Navegación entre juegos funciona
- [ ] Botones "Volver al Portal" funcionan
- [ ] Animaciones de Trivia funcionan
- [ ] Logros se otorgan correctamente

---

## 🎯 URLs Finales

- **Portal:** https://play.naturalbe.com.co/
- **Word Snap:** https://play.naturalbe.com.co/word-snap.html
- **Maratón:** https://play.naturalbe.com.co/marathon.html
- **Trivia:** https://play.naturalbe.com.co/trivia-challenge.html

---

## 🐛 Solución de Problemas

### Si el portal no carga:
1. Verificar que `index.html` se subió correctamente
2. Verificar que `styles-v2.css` existe
3. Limpiar caché del navegador (Ctrl+F5)

### Si Word Snap no funciona:
1. Verificar que `word-snap.html` existe
2. Verificar que `word-snap-campaign.js` existe
3. Comprobar consola del navegador (F12)

### Si Trivia no funciona:
1. Verificar que los 3 archivos de Trivia estén subidos
2. Verificar que `achievements.js` esté actualizado
3. Comprobar consola para errores

### Si los enlaces no funcionan:
1. Verificar que todos los archivos HTML tengan las rutas correctas
2. Verificar que los nombres de archivo coincidan exactamente
3. Limpiar caché del navegador

---

## 🔄 Actualización Futura

### Para Agregar un Nuevo Juego:
1. Crear el archivo HTML del juego (ej: `memory-game.html`)
2. Agregar tarjeta en `index.html` del portal
3. Subir archivos a Hostinger
4. Probar navegación

### Para Actualizar el Portal:
1. Editar `index.html` localmente
2. Probar cambios
3. Subir a Hostinger
4. Limpiar caché

---

## 📞 Soporte

**Desarrollador:** Kiro AI  
**Supervisor:** ChatGPT Director  
**Versión:** 2.5  
**Fecha:** 2025-11-27  
**Estado:** ✅ LISTO PARA DEPLOY

---

## ✅ Confirmación Final

**Estado:** ✅ LISTO PARA PRODUCCIÓN  
**Portal:** ✅ CREADO  
**Juegos:** ✅ 2 JUEGOS FUNCIONANDO  
**Navegación:** ✅ COMPLETA  
**Mejoras:** ✅ IMPLEMENTADAS  

**El portal NaturalBe Games está listo para ser subido a Hostinger.** 🎮🚀
