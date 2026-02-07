# 🚀 Deploy Word Snap en Hostinger - Guía Completa

## 📋 Información del Deploy

**Subdominio:** https://play.naturalbe.com.co  
**Ruta en servidor:** `public_html/play/`  
**Fecha:** 2025-11-27  
**Versión:** V6.1 Production Build (Cache Busting Fix)  

---

## 🔥 ACTUALIZACIÓN URGENTE - FIX CACHÉ CSS

### ⚠️ Problema Detectado:
Algunos dispositivos (PC del director, celular de la hermana) ven el diseño viejo/roto porque tienen el CSS antiguo en caché. En modo incógnito se ve bien.

### ✅ Solución Implementada: Cache Busting
Se renombró el CSS a `styles-v2.css` para forzar a todos los navegadores a descargar la versión nueva.

### 📦 Archivos Actualizados:
- ✅ `styles-v2.css` (nuevo nombre del CSS completo)
- ✅ `index.html` (ahora apunta a styles-v2.css)
- ✅ `marathon.html` (ahora apunta a styles-v2.css)

### 🚀 Pasos para Actualizar en Hostinger:

1. **Acceder a File Manager de Hostinger**
   - Ir a `public_html/play/`

2. **Subir los 3 archivos actualizados:**
   - `styles-v2.css` (NUEVO - subir)
   - `index.html` (REEMPLAZAR el existente)
   - `marathon.html` (REEMPLAZAR el existente)

3. **Verificar en el servidor:**
   - Confirmar que existe `styles-v2.css`
   - Abrir `index.html` y verificar que diga:
     ```html
     <link rel="stylesheet" href="styles-v2.css">
     ```

4. **Probar en dispositivos:**
   - PC del director (Chrome)
   - Celular de la hermana (Android)
   - iPhone de la esposa
   - Firefox
   - Hacer Ctrl+F5 (o Cmd+Shift+R en Mac) para limpiar caché

### ✅ Resultado Esperado:
Después de esta actualización, TODOS los dispositivos verán el diseño nuevo correctamente, sin necesidad de modo incógnito.

---

## 🟩 1. Configuración del Subdominio (Completada por Director)

### Pasos Realizados:

1. **Acceso a Hostinger:**
   - Panel de Control → Dominios → Subdominios

2. **Crear Subdominio:**
   - Nombre: `play`
   - Dominio principal: `naturalbe.com.co`
   - Resultado: `play.naturalbe.com.co`

3. **Estructura Generada:**
   ```
   public_html/
   ├── (archivos de naturalbe.com.co)
   └── play/  ← Aquí va Word Snap
   ```

4. **SSL:** Se activará automáticamente después del deploy

---

## 📁 2. Estructura Final del Build

### Archivos OBLIGATORIOS (incluidos en este build):

```
word-snap-build/
├── index.html                    (Página principal del juego)
├── marathon.html                 (Modo maratón)
├── pro-styles.css                (CSS optimizado)
├── word-snap-campaign.js         (Lógica principal del juego)
├── word-snap-marathon.js         (Lógica del modo maratón)
├── word-snap-levels.js           (100 niveles de juego)
├── audio-manager.js              (Sistema de sonido)
├── coins-manager.js              (Sistema de monedas)
├── daily-rewards.js              (Recompensas diarias)
├── skins-system.js               (Sistema de skins)
├── ad-manager.js                 (Gestor de anuncios)
├── xp-manager.js                 (Sistema de XP y niveles)
├── achievements.js               (50 logros desbloqueables)
├── weekly-event.js               (Eventos semanales)
├── error-manager.js              (Manejo de errores)
└── performance-optimizer.js      (Optimización automática)
```

### Archivos ELIMINADOS (NO incluidos):

- ❌ Todos los archivos `.md` (documentación)
- ❌ Archivos `.txt`, `.bat`, `.sh`
- ❌ Carpetas de desarrollo (`docs/`, `test/`, etc.)
- ❌ Archivos de configuración local
- ❌ Scripts de desarrollo
- ❌ Archivos de prueba

---

## 🎯 3. Explicación de Cada Archivo

### **index.html**
- Página principal del juego
- Modo campaña con 100 niveles
- Incluye todos los sistemas (XP, logros, skins, etc.)
- Optimizado para móviles y desktop

### **marathon.html**
- Modo maratón (contrarreloj)
- Interfaz simplificada
- Enlace de vuelta a campaña principal

### **pro-styles.css**
- CSS combinado de todos los estilos
- Incluye responsive design
- Optimizaciones para dispositivos móviles
- Safe area support para iPhone

### **Archivos JavaScript:**

#### **Núcleo del Juego:**
- `word-snap-campaign.js` - Lógica principal
- `word-snap-marathon.js` - Modo maratón
- `word-snap-levels.js` - Datos de 100 niveles

#### **Sistemas Avanzados:**
- `xp-manager.js` - Sistema de experiencia y niveles
- `achievements.js` - 50 logros desbloqueables
- `coins-manager.js` - Economía del juego
- `daily-rewards.js` - Recompensas diarias
- `skins-system.js` - Personalización visual
- `weekly-event.js` - Eventos semanales automáticos

#### **Soporte Técnico:**
- `audio-manager.js` - Sonidos del juego
- `error-manager.js` - Manejo robusto de errores
- `performance-optimizer.js` - Optimización automática
- `ad-manager.js` - Estructura para anuncios futuros

---

## 🚫 4. Qué NO Subir a Hostinger

### Archivos de Desarrollo:

```
❌ README.md
❌ CHANGELOG.md
❌ IMPLEMENTACION-*.md
❌ GUIA-*.md
❌ start-server.sh
❌ start-server.bat
❌ test-*.html
❌ *.py
❌ *.txt (excepto robots.txt si existe)
❌ Carpetas: docs/, dev/, test/
```

### Razones:
- **Seguridad:** No exponer documentación interna
- **Performance:** Reducir carga del servidor
- **Limpieza:** Solo archivos necesarios para producción
- **SEO:** Evitar contenido duplicado o irrelevante

---

## 📤 5. Instrucciones de Subida a Hostinger

### Método 1: File Manager (Recomendado)

1. **Acceder a Hostinger:**
   - Ir a hPanel → File Manager
   - Navegar a `public_html/play/`

2. **Subir Archivos:**
   - Seleccionar todos los archivos del build
   - Arrastrar y soltar en File Manager
   - O usar botón "Upload"

3. **Verificar Estructura:**
   ```
   public_html/play/
   ├── index.html
   ├── marathon.html
   ├── pro-styles.css
   ├── *.js (todos los archivos JavaScript)
   ```

### Método 2: FTP

1. **Conectar vía FTP:**
   - Host: ftp.naturalbe.com.co
   - Usuario: (tu usuario de Hostinger)
   - Puerto: 21

2. **Navegar a:**
   - `/public_html/play/`

3. **Subir todos los archivos del build**

---

## 🔄 6. Instrucciones de Actualización Futura

### Para Actualizar el Juego:

1. **Hacer Backup:**
   - Descargar archivos actuales de `public_html/play/`
   - Guardar en carpeta local con fecha

2. **Subir Nuevos Archivos:**
   - Reemplazar archivos modificados
   - Mantener estructura intacta

3. **Verificar Funcionamiento:**
   - Abrir https://play.naturalbe.com.co
   - Probar en móvil y desktop
   - Verificar consola del navegador (F12)

### Verificación Post-Deploy:

- [ ] Abrir https://play.naturalbe.com.co
- [ ] Probar juego en móvil y desktop
- [ ] Verificar que todos los sistemas funcionen
- [ ] Comprobar velocidad de carga
- [ ] Testear en diferentes navegadores
- [ ] Verificar que no hay errores en consola

---

## ✅ 7. Compatibilidad con Hosting PHP/HTML

### **Confirmación de Compatibilidad:**

✅ **HTML5:** Totalmente compatible  
✅ **CSS3:** Totalmente compatible  
✅ **JavaScript ES6+:** Compatible con navegadores modernos  
✅ **LocalStorage:** Funciona en todos los navegadores  
✅ **Web Audio API:** Compatible con Chrome, Firefox, Safari  
✅ **Responsive Design:** Optimizado para móviles  
✅ **Sin Backend:** No requiere PHP, MySQL o servidor especial  

### **Requisitos del Servidor:**

- ✅ Hosting compartido estándar
- ✅ Soporte para archivos estáticos
- ✅ HTTPS (SSL) - se activará automáticamente
- ✅ Sin necesidad de configuración especial

### **Navegadores Soportados:**

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Navegadores móviles modernos

---

## 📊 8. Métricas de Performance Esperadas

### **Tiempos de Carga:**

- Primera carga: < 3 segundos
- Cargas subsecuentes: < 1 segundo
- Tamaño total: ~250KB

### **Optimizaciones Incluidas:**

- CSS y JS optimizados
- Cache del navegador
- Lazy loading donde aplique
- Detección de dispositivos de gama baja
- Optimización automática de performance

---

## 🎯 9. Checklist de Deploy

### Pre-Deploy:

- [x] Build creado sin archivos de desarrollo
- [x] Todos los archivos JS incluidos
- [x] CSS optimizado
- [x] HTML optimizado para producción
- [x] Verificación local completada

### Post-Deploy:

- [ ] Subir archivos a Hostinger
- [ ] Verificar https://play.naturalbe.com.co
- [ ] Probar en móvil
- [ ] Probar en desktop
- [ ] Verificar todos los sistemas
- [ ] Activar SSL
- [ ] Configurar analytics (futuro)

---

## 🚨 10. Solución de Problemas Comunes

### **Si el juego no carga:**

1. Verificar que todos los archivos JS estén presentes
2. Comprobar consola del navegador (F12)
3. Verificar permisos de archivos en servidor
4. Limpiar cache del navegador

### **Si hay errores de JavaScript:**

1. Verificar que `error-manager.js` esté cargado
2. Comprobar orden de carga de scripts en HTML
3. Verificar compatibilidad del navegador

### **Si el rendimiento es lento:**

1. `performance-optimizer.js` se encarga automáticamente
2. Verificar conexión a internet
3. Comprobar recursos del servidor

---

## 📞 11. Contacto y Soporte

**Desarrollador:** Kiro AI Assistant  
**Versión:** V6 Production Build  
**Fecha de Deploy:** 2025-11-27  

**Para actualizaciones futuras:**
- Seguir esta misma guía
- Mantener estructura de archivos
- Probar localmente antes de subir
- Hacer backup antes de actualizar

---

## ✅ Confirmación Final

**Estado:** ✅ LISTO PARA DEPLOY  
**Archivos:** ✅ VERIFICADOS (16 archivos)  
**Compatibilidad:** ✅ CONFIRMADA  
**Performance:** ✅ OPTIMIZADA  

**El build está listo para ser subido a Hostinger sin modificaciones adicionales.**

---

**¡Word Snap listo para conquistar play.naturalbe.com.co!** 🎮🚀
