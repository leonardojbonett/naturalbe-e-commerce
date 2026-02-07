# 🎮 GUÍA: CREAR TU PROPIO MICROJUEGO

## 🚀 INICIO RÁPIDO (30 minutos)

### Paso 1: Copiar Template
```bash
# Copia la carpeta template
cp -r 04-TEMPLATES/game-template 01-JUEGOS/mi-juego
```

### Paso 2: Estructura Básica
```javascript
// mi-juego.js
const game = new GameEngine('gameCanvas', {
    width: 1080,
    height: 1920
});

let gameState = 'playing';

function update(dt) {
    // Tu lógica aquí
}

function render(ctx) {
    game.clear();
    // Tu renderizado aquí
}

game.start(update, render);
```

---

## 🎯 ELEMENTOS ESENCIALES

### 1. Hook Inicial (0-3s)
```javascript
// Texto grande y llamativo
game.drawText('¿PUEDES HACERLO?', game.width/2, 300, 80, '#FF006E');
```

### 2. Mecánica Simple
```javascript
// Una sola acción: tap, swipe, o timing
if (game.mouse.clicked) {
    // Acción del jugador
}
```

### 3. Feedback Inmediato
```javascript
// Partículas al hacer algo bien
particles.emit(x, y, 30, {
    color: '#06FFA5',
    speed: 15
});
```

### 4. Progresión Clara
```javascript
// Nivel visible
game.drawText(`Nivel ${level}`, x, y, 60, '#fff');
```

### 5. Game Over Satisfactorio
```javascript
// Mostrar logro
game.drawText(`¡Llegaste al nivel ${level}!`, x, y, 70, '#FFBE0B');
```

---

## 🎨 PALETA DE COLORES

### Neon Vibrante (Recomendado)
```javascript
const COLORS = {
    primary: '#FF006E',    // Rosa neón
    secondary: '#8338EC',  // Morado
    accent: '#3A86FF',     // Azul
    success: '#06FFA5',    // Verde
    warning: '#FFBE0B'     // Amarillo
};
```

### Pastel Suave
```javascript
const COLORS = {
    primary: '#FFB3BA',
    secondary: '#FFDFBA',
    accent: '#FFFFBA',
    success: '#BAFFC9',
    warning: '#BAE1FF'
};
```

---

## 🎵 AUDIO (Opcional)

```javascript
const audio = new AudioSystem();

// Cargar sonidos
audio.load('click', 'sounds/click.mp3');
audio.load('success', 'sounds/success.mp3');
audio.load('fail', 'sounds/fail.mp3');

// Reproducir
audio.play('click', 0.5);
```

---

## 📱 OPTIMIZACIÓN PARA MÓVIL

### Touch Events
```javascript
// Ya incluido en GameEngine
// Usa game.mouse.clicked para touch y click
```

### Tamaño de Botones
```javascript
// Mínimo 150x150px para touch
const buttonSize = 150;
```

### Performance
```javascript
// Limita partículas
if (particles.particles.length > 100) {
    particles.particles.length = 100;
}
```

---

## 🎬 HACER VIDEO VIRAL

### 1. Grabar Gameplay
- OBS Studio (gratis)
- Resolución: 1080x1920
- 30-60 segundos

### 2. Editar
- CapCut (gratis, móvil)
- DaVinci Resolve (gratis, PC)

### 3. Elementos Virales
```
0-3s:   Hook ("Solo el 2% puede...")
3-25s:  Gameplay adictivo
25-30s: Resultado + CTA
```

### 4. Música
- Epidemic Sound
- Artlist
- TikTok trending sounds

### 5. Texto en Pantalla
```
"¿Puedes llegar al nivel 10?"
"Tu tiempo de reacción: XXms"
"Solo el 2% lo logra"
```

---

## 🔥 IDEAS DE MECÁNICAS

### 1. Timing
```javascript
// Tap en el momento exacto
if (Math.abs(currentTime - perfectTime) < 0.1) {
    score += 1000; // Perfect!
}
```

### 2. Secuencia
```javascript
// Memoriza y repite
const sequence = [1, 2, 3, 1, 4];
if (playerInput === sequence[step]) {
    step++;
}
```

### 3. Reflejos
```javascript
// Reacciona rápido
const reactionTime = Date.now() - startTime;
score = Math.max(0, 1000 - reactionTime);
```

### 4. Precisión
```javascript
// Toca el objetivo
const distance = Utils.distance(clickX, clickY, targetX, targetY);
if (distance < targetRadius) {
    hit = true;
}
```

### 5. Velocidad
```javascript
// Cuántos en X segundos
let taps = 0;
let timeLeft = 10;
// Cuenta taps
```

---

## 📊 MÉTRICAS DE ÉXITO

### Engagement
- **Tiempo promedio:** >30s
- **Tasa de finalización:** >50%
- **Reintentos:** >2

### Viralidad
- **Shares:** >5%
- **Comentarios:** >2%
- **Saves:** >3%

### Monetización
- **CTR ads:** >3%
- **Conversión premium:** >1%

---

## 🐛 DEBUGGING

### Console Logs
```javascript
console.log('Score:', game.score);
console.log('Level:', level);
console.log('Mouse:', game.mouse);
```

### Visual Debug
```javascript
// Mostrar hitboxes
game.drawRect(box.x, box.y, box.width, box.height, 'rgba(255,0,0,0.3)');
```

### Performance
```javascript
// FPS counter
let fps = Math.round(1 / dt);
game.drawText(`FPS: ${fps}`, 50, 50, 20, '#fff', 'left');
```

---

## 🚀 PUBLICAR

### 1. GitHub Pages
```bash
git add .
git commit -m "Add new game"
git push
```

### 2. Netlify
- Drag & drop carpeta
- URL automática

### 3. Itch.io
- Sube HTML5 game
- Gratis + monetización

---

## 💡 TIPS PRO

### 1. Juiciness
```javascript
// Más feedback = más adictivo
- Partículas
- Screen shake
- Sonidos
- Animaciones
```

### 2. Dificultad Progresiva
```javascript
// Empieza fácil, sube gradual
difficulty = 1 + level * 0.1;
```

### 3. Near Misses
```javascript
// "Casi lo logras" = más reintentos
if (distance < targetRadius * 1.2) {
    showText("¡CASI!");
}
```

### 4. Comparación Social
```javascript
// "Mejor que el 78% de jugadores"
percentile = (score / maxScore) * 100;
```

### 5. Variedad
```javascript
// Cambia colores, patrones cada nivel
theme = themes[level % themes.length];
```

---

## 🎯 CHECKLIST PRE-LANZAMIENTO

- [ ] Funciona en móvil
- [ ] Funciona en desktop
- [ ] Instrucciones claras
- [ ] Feedback visual
- [ ] Botón reiniciar
- [ ] Score visible
- [ ] Sin bugs críticos
- [ ] Carga rápido (<3s)
- [ ] Adictivo (>2 reintentos)
- [ ] Hook claro (0-3s)

---

## 🆘 PROBLEMAS COMUNES

### "No funciona en móvil"
```javascript
// Usa touch events (ya incluido en GameEngine)
// Prueba en Chrome DevTools (F12 → Toggle device)
```

### "Muy lento"
```javascript
// Reduce partículas
// Usa menos objetos
// Optimiza loops
```

### "No es adictivo"
```javascript
// Más feedback visual
// Dificultad progresiva
// Reinicio rápido
```

---

## 🎉 ¡LISTO!

**Próxima acción:**
1. Copia el template
2. Implementa tu mecánica
3. Prueba 10 veces
4. Graba video
5. ¡Publica!

**¿Dudas?** Revisa los juegos de ejemplo en `01-JUEGOS/`
