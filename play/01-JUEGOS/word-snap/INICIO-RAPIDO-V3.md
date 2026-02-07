# 🚀 Inicio Rápido - Word Snap V3

## ⚡ Empezar en 30 segundos

### 1. Iniciar Servidor

```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js
npx http-server -p 8000

# Opción 3: PHP
php -S localhost:8000
```

### 2. Abrir en Navegador

```
http://localhost:8000/microjuegos/01-JUEGOS/word-snap/word-snap-campaign.html
```

### 3. ¡Jugar!

- Click "🔊 Sonido" para activar audio
- Click "▶️ Jugar Nivel 1"
- Busca "COLOMBIA" (palabra oculta)
- Prueba "🏃 Maratón" para modo contrarreloj

---

## 🎯 Funciones Principales

| Botón | Función |
|-------|---------|
| 🔊 Sonido | Activar/desactivar audio |
| 📚 Niveles | Selector de niveles |
| 🏃 Maratón | Modo contrarreloj |
| 😊 Normal | Dificultad normal |
| 🌙 | Modo oscuro |

---

## 💎 Palabras Ocultas

| Nivel | Palabra Oculta |
|-------|----------------|
| 1 | COLOMBIA |
| 10 | YESTERDAY |
| 14 | ARBITRO |
| 50 | CHATGPT |
| 100 | GRATITUD |

---

## 🏆 Récords

Ver en consola del navegador:

```javascript
// Perfil completo
game.getPlayerProfile()

// Récords de maratón
localStorage.getItem('wsMarathonBestLevels')
localStorage.getItem('wsMarathonBestScore')
```

---

## 📱 Archivos Principales

- `word-snap-campaign.html` - Modo campaña (100 niveles)
- `word-snap-marathon.html` - Modo maratón (contrarreloj)
- `word-snap-campaign.js` - Lógica principal
- `word-snap-marathon.js` - Lógica maratón
- `audio-manager.js` - Sistema de sonido
- `word-snap-levels.js` - Datos de 100 niveles

---

## ✅ Todo Funciona Si...

- ✅ Escuchas sonidos al jugar
- ✅ Ves emoji gigante de fondo
- ✅ Puedes abrir selector de niveles
- ✅ Modo maratón da +20s por nivel
- ✅ Palabra oculta da +100 puntos
- ✅ Stats se guardan entre sesiones

---

## 🐛 Solución de Problemas

**No hay sonido:**
- Click en "🔊 Sonido" para activar
- Interactúa con la página primero (política de navegadores)

**No carga el juego:**
- Verifica que el servidor esté corriendo
- Abre consola del navegador (F12) para ver errores

**LocalStorage lleno:**
```javascript
localStorage.clear() // Resetear todo
```

---

## 📚 Documentación Completa

- `FEATURES-AVANZADAS-V3.md` - Documentación detallada
- `TEST-FEATURES.md` - Guía de pruebas
- `RESUMEN-V3.md` - Resumen ejecutivo

---

**¡Listo para jugar!** 🎮
