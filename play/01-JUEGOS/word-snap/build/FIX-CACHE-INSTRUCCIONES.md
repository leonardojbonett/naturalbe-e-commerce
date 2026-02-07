# 🔧 FIX CACHÉ CSS - Instrucciones para el Director

## 🎯 Problema
El juego se ve bien en modo incógnito, pero en navegadores normales algunos dispositivos ven el diseño viejo/roto.

**Causa:** Los navegadores tienen guardado el CSS antiguo en caché.

**Solución:** Cambiar el nombre del archivo CSS para forzar descarga nueva.

---

## ✅ SOLUCIÓN IMPLEMENTADA

Se cambió el nombre del CSS de `styles.css` a `styles-v2.css`

Los archivos HTML ahora apuntan al nuevo nombre.

---

## 📦 Archivos que Debes Subir a Hostinger

Solo necesitas subir **3 archivos**:

1. **`styles-v2.css`** (NUEVO)
2. **`index.html`** (ACTUALIZADO)
3. **`marathon.html`** (ACTUALIZADO)

---

## 🚀 Pasos en Hostinger (5 minutos)

### Paso 1: Acceder al File Manager
1. Entrar a Hostinger
2. Ir a **File Manager**
3. Navegar a: `public_html/play/`

### Paso 2: Subir styles-v2.css
1. Click en **Upload Files**
2. Seleccionar `styles-v2.css` de tu carpeta build
3. Subir (es un archivo nuevo, no reemplaza nada)

### Paso 3: Reemplazar index.html
1. En `public_html/play/`, buscar `index.html`
2. Click derecho → **Delete** (o renombrar a `index-old.html` por seguridad)
3. Subir el nuevo `index.html` de tu carpeta build

### Paso 4: Reemplazar marathon.html
1. En `public_html/play/`, buscar `marathon.html`
2. Click derecho → **Delete** (o renombrar a `marathon-old.html`)
3. Subir el nuevo `marathon.html` de tu carpeta build

### Paso 5: Verificar
1. Abrir https://play.naturalbe.com.co
2. Presionar **Ctrl+F5** (Windows) o **Cmd+Shift+R** (Mac) para limpiar caché
3. El juego debe verse perfecto

---

## 🧪 Probar en Todos los Dispositivos

Después de subir, probar en:

- ✅ **Tu PC** (Chrome) - Ctrl+F5
- ✅ **Celular de tu hermana** (Android) - Limpiar caché del navegador
- ✅ **iPhone de tu esposa** - Cerrar y abrir Safari
- ✅ **Firefox** - Ctrl+F5

**Importante:** En cada dispositivo, hacer **Ctrl+F5** o limpiar caché del navegador.

---

## 🔍 Cómo Verificar que Funcionó

### Método 1: Inspeccionar en el Navegador
1. Abrir https://play.naturalbe.com.co
2. Click derecho → **Inspeccionar** (F12)
3. Ir a pestaña **Network** o **Red**
4. Recargar la página (F5)
5. Buscar `styles-v2.css` en la lista
6. Debe aparecer con código **200** (verde)

### Método 2: Ver el Código Fuente
1. Abrir https://play.naturalbe.com.co
2. Click derecho → **Ver código fuente**
3. Buscar (Ctrl+F): `stylesheet`
4. Debe decir: `<link rel="stylesheet" href="styles-v2.css">`

---

## ❓ Preguntas Frecuentes

### ¿Por qué no simplemente reemplazar styles.css?
Porque los navegadores ya tienen `styles.css` guardado en caché. Al cambiar el nombre a `styles-v2.css`, los navegadores lo ven como un archivo completamente nuevo y lo descargan.

### ¿Qué pasa con el styles.css viejo?
Puedes dejarlo en el servidor o eliminarlo. Ya no se usa.

### ¿Y si en el futuro necesito actualizar el CSS otra vez?
Cambiar a `styles-v3.css`, `styles-v4.css`, etc. Es la técnica estándar de "cache busting".

### ¿Tengo que subir todos los archivos JS otra vez?
No, solo los 3 archivos mencionados (styles-v2.css, index.html, marathon.html).

---

## ✅ Checklist Final

- [ ] Subí `styles-v2.css` a Hostinger
- [ ] Reemplacé `index.html` en Hostinger
- [ ] Reemplacé `marathon.html` en Hostinger
- [ ] Probé en mi PC con Ctrl+F5
- [ ] Probé en celular de mi hermana
- [ ] Probé en iPhone de mi esposa
- [ ] El juego se ve perfecto en todos los dispositivos

---

## 🎉 Resultado Esperado

Después de estos pasos, **TODOS** los dispositivos verán el diseño nuevo:

- ✅ Fondo degradado morado/azul
- ✅ Contenedor blanco centrado
- ✅ Botones y controles visibles
- ✅ Grid de letras funcionando
- ✅ Sin barras verdes extrañas
- ✅ Sin áreas blancas grandes

---

**¡Listo! El problema de caché está resuelto.** 🚀
