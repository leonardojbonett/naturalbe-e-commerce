# 🚀 Inicio Rápido - Word Snap V4 PRO

## ⚡ Empezar en 60 segundos

### 1. Verificar Archivos

Asegúrate de tener todos estos archivos en la carpeta `word-snap/`:

```
✅ word-snap-campaign.html
✅ word-snap-campaign.js
✅ word-snap-levels.js
✅ audio-manager.js
✅ coins-manager.js
✅ daily-rewards.js          ← NUEVO V4
✅ skins-system.js           ← NUEVO V4
✅ ad-manager.js             ← NUEVO V4
✅ pro-styles.css            ← NUEVO V4
```

### 2. Iniciar Servidor

```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js
npx http-server -p 8000

# Opción 3: PHP
php -S localhost:8000
```

### 3. Abrir en Navegador

```
http://localhost:8000/word-snap-campaign.html
```

### 4. ¡Probar las Nuevas Features!

---

## 🎮 Nuevas Features V4

### 🎁 Recompensas Diarias
**Botón:** 🎁 Diario

**Qué hace:**
- Cofre diario con racha de 5 días
- Día 1: 50 monedas
- Día 2: 75 monedas
- Día 3: 100 monedas
- Día 4: 150 monedas
- Día 5: 300 monedas
- Reset automático a medianoche

**Cómo probar:**
1. Click en "🎁 Diario"
2. Reclamar recompensa
3. Ver animación de cofre
4. Monedas se suman automáticamente

---

### 🛒 Tienda de Skins
**Botón:** 🛒 Tienda

**Qué hace:**
- 6 skins de tiles (Neón, Pixel, Fútbol, Espacio, Egipto)
- 6 efectos de partículas (Fuego, Corazones, Rayos, etc.)
- Compra con monedas ganadas
- Equipar y ver cambios en tiempo real

**Cómo probar:**
1. Jugar algunos niveles para ganar monedas
2. Click en "🛒 Tienda"
3. Comprar un skin (ej: Neón por 500🪙)
4. Equipar el skin
5. Ver el cambio visual en el grid

---

### 🔥 Modo Experto / 👑 Modo Maestro
**Botones:** 🔥 Experto, 👑 Maestro

**Qué hace:**
- Experto: Grid 12×12, 75 segundos
- Maestro: Grid 14×14, 60 segundos
- Más difícil, más desafiante

**Cómo probar:**
1. Click en "🔥 Experto"
2. Observar grid más grande
3. Jugar un nivel
4. Probar "👑 Maestro" para máximo desafío

---

### 💰 Sistema de Monedas
**Display:** 💰 (arriba de controles)

**Cómo ganar monedas:**
- Completar nivel: +50 🪙
- Palabra oculta: +100 🪙
- Recompensa diaria: +50-300 🪙
- Ver anuncio (simulado): +50 🪙

**Cómo gastar monedas:**
- Comprar skins en tienda
- Desbloquear efectos especiales

---

## 🎯 Flujo de Juego Recomendado

### Primera Sesión:
```
1. Abrir juego
2. Reclamar recompensa diaria (50🪙)
3. Jugar nivel 1 (ganar 50🪙)
4. Buscar palabra oculta "COLOMBIA" (+100🪙)
5. Total: 200🪙
6. Ir a tienda
7. Comprar skin "Neón" (cuesta 500🪙... necesitas más!)
8. Seguir jugando para ganar más monedas
```

### Después de 5 niveles:
```
Monedas acumuladas: ~400🪙
→ Comprar efecto "Fuego" (300🪙)
→ Equipar y ver partículas 🔥
```

### Después de 10 niveles:
```
Monedas acumuladas: ~700🪙
→ Comprar skin "Neón" (500🪙)
→ Equipar y ver grid con glow verde
```

---

## 🧪 Testing Rápido

### Test 1: Recompensas Diarias
```
1. Click "🎁 Diario"
2. ¿Se abre modal? ✅
3. ¿Muestra día 1? ✅
4. Click "Reclamar"
5. ¿Animación de cofre? ✅
6. ¿Monedas sumadas? ✅
```

### Test 2: Tienda
```
1. Click "🛒 Tienda"
2. ¿Se muestran 6 skins? ✅
3. ¿Se muestran 6 partículas? ✅
4. ¿Precios visibles? ✅
5. Comprar algo
6. ¿Monedas descontadas? ✅
7. Equipar
8. ¿Cambio visual? ✅
```

### Test 3: Modo Experto
```
1. Click "🔥 Experto"
2. ¿Grid 12×12? ✅
3. ¿Tiempo 75s? ✅
4. ¿Responsive en móvil? ✅
```

### Test 4: Modo Maestro
```
1. Click "👑 Maestro"
2. ¿Grid 14×14? ✅
3. ¿Tiempo 60s? ✅
4. ¿Fuente más pequeña? ✅
```

---

## 🐛 Solución de Problemas

### No se ven las monedas
**Solución:** Recargar página (Ctrl+F5)

### Tienda no abre
**Solución:** Verificar que `skins-system.js` esté cargado

### Recompensa diaria no funciona
**Solución:** Verificar que `daily-rewards.js` esté cargado

### Skins no se aplican
**Solución:** 
```javascript
// En consola:
skinsSystem.applySkin();
```

### Reset completo
```javascript
// En consola:
localStorage.clear();
location.reload();
```

---

## 📊 Comandos de Consola Útiles

```javascript
// Ver monedas actuales
coinsManager.getCoins()

// Añadir monedas (testing)
coinsManager.addCoins(1000, 'Testing')

// Ver perfil completo
game.getPlayerProfile()

// Ver estado de recompensa diaria
dailyRewards.getStatus()

// Forzar reclamar recompensa (testing)
dailyRewards.claimReward()

// Ver skins equipados
console.log({
    tile: skinsSystem.currentTileSkin,
    particle: skinsSystem.currentParticleSkin
})

// Desbloquear todos los skins (testing)
skinsSystem.ownedTileSkins = ['default', 'neon', 'pixel', 'futbol', 'espacio', 'egipto'];
skinsSystem.ownedParticleSkins = ['default', 'fire', 'hearts', 'lightning', 'sparkles', 'coins'];
skinsSystem.saveData();
```

---

## 🎨 Skins Disponibles

### Tiles:
| Skin | Precio | Descripción |
|------|--------|-------------|
| Clásico | Gratis | Blanco/gris estándar |
| Neón | 500🪙 | Negro con glow verde |
| Pixel Art | 750🪙 | Estilo retro pixelado |
| Fútbol | 600🪙 | Verde césped con ⚽ |
| Espacio | 800🪙 | Negro con estrellas |
| Egipto | 900🪙 | Dorado con jeroglíficos |

### Partículas:
| Efecto | Precio | Emoji |
|--------|--------|-------|
| Estrellas | Gratis | ⭐ |
| Fuego | 300🪙 | 🔥 |
| Corazones | 400🪙 | 💖 |
| Rayos | 500🪙 | ⚡ |
| Brillos | 350🪙 | ✨ |
| Monedas | 450🪙 | 🪙 |

---

## 🏆 Logros Sugeridos

### Principiante:
- ✅ Completar nivel 1
- ✅ Reclamar primera recompensa diaria
- ✅ Ganar 100 monedas

### Intermedio:
- ✅ Completar 10 niveles
- ✅ Comprar primer skin
- ✅ Racha de 3 días

### Avanzado:
- ✅ Completar 50 niveles
- ✅ Comprar todos los skins
- ✅ Racha de 5 días
- ✅ Modo Experto completado

### Maestro:
- ✅ Completar 100 niveles
- ✅ Modo Maestro completado
- ✅ 10,000 monedas acumuladas

---

## 📱 Responsive

Todas las features funcionan en:
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Móvil (375x667)

---

## 🎉 ¡Listo!

Ahora tienes Word Snap V4 PRO completamente funcional con:
- 🎁 Recompensas diarias
- 🛒 Tienda de skins
- 🔥 Modo Experto
- 👑 Modo Maestro
- 💰 Sistema de monedas
- 📺 Estructura de ads

**¡A jugar!** 🎮
