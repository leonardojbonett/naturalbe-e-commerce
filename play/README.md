# 🎮 MICROJUEGOS VIRALES CON IA

Colección de microjuegos adictivos diseñados para volverse virales en TikTok, Instagram Reels y YouTube Shorts.

---

## 🚀 INICIO RÁPIDO (5 minutos)

### 1. Abre un juego
```
01-JUEGOS/color-match/color-match.html
```

### 2. Abre en tu navegador
- Doble click en el archivo HTML
- O arrastra al navegador

### 3. ¡Juega!
- Funciona en desktop y móvil
- Touch y mouse soportados

---

## 📁 ESTRUCTURA

```
microjuegos/
├── 01-JUEGOS/              # Juegos listos
│   ├── color-match/        # ⭐ Juego de colores
│   └── reflex-test/        # ⭐ Test de reflejos
├── 02-ENGINE/              # Motor de juegos
│   └── game-engine.js      # Core engine
├── 03-ASSETS/              # Recursos
│   ├── sounds/             # Sonidos
│   └── sprites/            # Gráficos
├── 04-TEMPLATES/           # Templates
│   ├── game-template.html  # Template HTML
│   └── game-template.js    # Template JS
└── 05-DOCS/                # Documentación
    ├── CREAR-JUEGO.md      # Cómo crear juegos
    ├── VIRALIZAR.md        # Estrategia viral
    └── MONETIZAR.md        # Monetización
```

---

## 🎮 JUEGOS DISPONIBLES

### 1. Color Match Rush ⭐
**Descripción:** Toca el color correcto antes de que se acabe el tiempo
**Dificultad:** Fácil
**Tiempo de juego:** 30-60s
**Hook viral:** "Solo el 2% llega al nivel 10"

**Características:**
- ✅ Progresión de dificultad
- ✅ Colores vibrantes
- ✅ Feedback inmediato
- ✅ Sistema de partículas
- ✅ Responsive

### 2. Reflex Master ⭐
**Descripción:** Mide tu tiempo de reacción
**Dificultad:** Fácil
**Tiempo de juego:** 30s
**Hook viral:** "Tu tiempo de reacción: XXms"

**Características:**
- ✅ 5 rondas
- ✅ Promedio y mejor tiempo
- ✅ Comparación mundial
- ✅ Animaciones suaves
- ✅ Responsive

---

## 🛠️ CREAR TU PROPIO JUEGO

### Opción 1: Desde Template (Recomendado)
```bash
# 1. Copia el template
cp -r 04-TEMPLATES/game-template 01-JUEGOS/mi-juego

# 2. Renombra archivos
mv game-template.html mi-juego.html
mv game-template.js mi-juego.js

# 3. Edita mi-juego.js
# Implementa tu lógica

# 4. Abre mi-juego.html
# ¡Listo!
```

### Opción 2: Desde Cero
```javascript
// 1. Crea HTML básico
// 2. Incluye game-engine.js
// 3. Crea tu lógica

const game = new GameEngine('gameCanvas');

function update(dt) {
    // Tu lógica
}

function render(ctx) {
    // Tu renderizado
}

game.start(update, render);
```

---

## 📚 DOCUMENTACIÓN

### Para Desarrolladores:
- **CREAR-JUEGO.md** - Tutorial completo para crear juegos
- **game-engine.js** - API del motor de juegos

### Para Marketing:
- **VIRALIZAR.md** - Estrategias para viralizar
- **MONETIZAR.md** - Cómo ganar dinero

### Para Planificación:
- **MICROJUEGOS-VIRALES-PLAN.md** - Plan maestro completo

---

## 🎨 CARACTERÍSTICAS DEL ENGINE

### GameEngine
```javascript
// Inicialización
const game = new GameEngine('canvasId', {
    width: 1080,
    height: 1920,
    fps: 60
});

// Métodos útiles
game.drawText(text, x, y, size, color);
game.drawRect(x, y, w, h, color);
game.drawCircle(x, y, radius, color);
game.drawRoundRect(x, y, w, h, radius, color);
game.isClicked(x, y, w, h);
```

### ParticleSystem
```javascript
const particles = new ParticleSystem();

// Emitir partículas
particles.emit(x, y, count, {
    color: '#FF006E',
    speed: 15,
    life: 0.8,
    size: 5
});

// Update y render
particles.update(dt);
particles.render(ctx);
```

### Utils
```javascript
Utils.randomInt(min, max);
Utils.randomColor();
Utils.lerp(start, end, t);
Utils.distance(x1, y1, x2, y2);
```

---

## 📱 COMPATIBILIDAD

### Navegadores:
- ✅ Chrome/Edge (Recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

### Dispositivos:
- ✅ Desktop (Windows, Mac, Linux)
- ✅ Móvil (iOS, Android)
- ✅ Tablet

### Input:
- ✅ Mouse
- ✅ Touch
- ✅ Teclado (próximamente)

---

## 🚀 PUBLICAR TU JUEGO

### Opción 1: GitHub Pages (Gratis)
```bash
# 1. Sube a GitHub
git add .
git commit -m "Add game"
git push

# 2. Activa GitHub Pages
# Settings → Pages → Source: main

# 3. Tu juego estará en:
# https://tuusuario.github.io/repo/juego.html
```

### Opción 2: Netlify (Gratis)
```bash
# 1. Arrastra carpeta a netlify.com
# 2. ¡Listo! URL automática
```

### Opción 3: Itch.io (Gratis + Monetización)
```bash
# 1. Crea cuenta en itch.io
# 2. Sube como HTML5 game
# 3. Configura precio (opcional)
```

---

## 💰 MONETIZACIÓN

### 1. Ads en el Juego
- Google AdSense
- Banner + Interstitial
- $50-500/mes

### 2. Versión Premium
- Sin ads
- Skins exclusivos
- $100-1000/mes

### 3. Vender Código
- CodeCanyon, Gumroad
- $20-100 por juego
- $500-5000/mes

### 4. Sponsorships
- Branded games
- $500-5000 por proyecto

**Ver MONETIZAR.md para detalles completos**

---

## 🔥 VIRALIZAR

### Fórmula de Video (30s):
```
0-3s:   Hook ("Solo el 2% puede...")
3-25s:  Gameplay adictivo
25-30s: Resultado + CTA
```

### Plataformas:
- TikTok (mejor para viralidad)
- Instagram Reels (mejor para engagement)
- YouTube Shorts (mejor para monetización)

### Hashtags:
```
#gaming #mobilegame #challenge #viral
#fyp #foryou #addictive
```

**Ver VIRALIZAR.md para estrategia completa**

---

## 🎯 ROADMAP

### ✅ Completado:
- [x] Motor de juegos base
- [x] Sistema de partículas
- [x] 2 juegos de ejemplo
- [x] Templates
- [x] Documentación completa

### 🚧 En Progreso:
- [ ] 3 juegos más
- [ ] Sistema de audio
- [ ] Leaderboards
- [ ] Integración con IA

### 📋 Próximamente:
- [ ] 10 juegos totales
- [ ] Editor visual
- [ ] Multiplayer
- [ ] NFT integration

---

## 🤝 CONTRIBUIR

¿Creaste un juego cool? ¡Compártelo!

1. Fork el proyecto
2. Crea tu juego en `01-JUEGOS/`
3. Documenta en README
4. Pull request

---

## 📞 CONTACTO

- **WhatsApp:** +57 313 721 2923
- **Instagram:** @naturalbe.ts
- **TikTok:** @vidalnatural.naturalbe

---

## 📄 LICENCIA

MIT License - Usa libremente para proyectos personales y comerciales

---

## 🎉 ¡EMPIEZA AHORA!

**3 pasos para tu primer juego:**

1. **Abre:** `04-TEMPLATES/game-template.js`
2. **Edita:** Implementa tu mecánica
3. **Juega:** Abre el HTML en tu navegador

**¿Dudas?** Lee `05-DOCS/CREAR-JUEGO.md`

**¡Vamos a crear algo viral! 🚀**
