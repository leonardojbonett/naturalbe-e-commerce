# 🔧 Guía: Refactoring y Separación de Archivos

## 🎯 Objetivo
Separar HTML, CSS y JS en archivos modulares para mejor mantenimiento y escalabilidad.

---

## 📁 Nueva Estructura Propuesta

```
word-snap/
├── index.html                 # HTML limpio, solo estructura
├── css/
│   ├── main.css              # Estilos principales
│   ├── modal.css             # Estilos del modal
│   ├── leaderboard.css       # Estilos del ranking
│   └── dark-mode.css         # Tema oscuro
├── js/
│   ├── main.js               # Inicialización
│   ├── game.js               # Lógica principal del juego
│   ├── ui.js                 # Manejo de UI
│   ├── audio.js              # Sistema de sonidos
│   ├── metrics.js            # Métricas y localStorage
│   ├── share.js              # Sistema de compartir
│   └── utils/
│       ├── boardGenerator.js # Generación del tablero
│       ├── wordPlacer.js     # Colocación de palabras
│       └── animations.js     # Animaciones
├── data/
│   └── themes.json           # Temas del juego
└── assets/
    ├── sounds/               # Sonidos (opcional)
    └── images/               # Imágenes (opcional)
```

---

## 🔨 Paso a Paso del Refactoring

### Paso 1: Extraer CSS

**css/main.css**
```css
/* Variables globales */
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #4caf50;
    --danger-color: #f5576c;
    --bg-light: #f8f9fa;
    --text-dark: #333;
    --border-radius: 10px;
    --transition: all 0.3s ease;
}

/* Reset y base */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
    transition: var(--transition);
}

/* Game container */
.game-container {
    background: white;
    border-radius: 20px;
    padding: 30px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

/* ... resto de estilos base ... */
```

**css/dark-mode.css**
```css
body.dark-mode {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

body.dark-mode .game-container {
    background: #0f3460;
    color: #e0e0e0;
}

body.dark-mode h1 {
    color: #00d4ff;
}

/* ... resto de estilos dark mode ... */
```

**css/modal.css**
```css
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0);
    backdrop-filter: blur(0px);
    justify-content: center;
    align-items: center;
    z-index: 1000;
    transition: all 0.3s ease-out;
}

.modal.show {
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(10px);
}

/* ... resto de estilos modal ... */
```

### Paso 2: Modularizar JavaScript

**js/game.js**
```javascript
// Clase principal del juego
export class WordSnapGame {
    constructor(config = {}) {
        this.gridSize = config.gridSize || 10;
        this.timeLimit = config.timeLimit || 60;
        this.difficulty = config.difficulty || 'normal';
        
        this.grid = [];
        this.words = [];
        this.foundWords = [];
        this.foundWordsPositions = {};
        this.selectedCells = [];
        this.score = 0;
        this.timeLeft = this.timeLimit;
        this.isPlaying = false;
        
        this.init();
    }

    async init() {
        await this.loadThemes();
        this.selectDailyTheme();
        this.createGrid();
    }

    // ... métodos del juego ...
}
```

**js/utils/boardGenerator.js**
```javascript
// Generador del tablero
export class BoardGenerator {
    constructor(gridSize) {
        this.gridSize = gridSize;
    }

    createEmptyGrid() {
        return Array(this.gridSize).fill(null).map(() => 
            Array(this.gridSize).fill('')
        );
    }

    fillEmptySpaces(grid) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (grid[i][j] === '') {
                    grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
        
        return grid;
    }
}
```

**js/utils/wordPlacer.js**
```javascript
// Colocador de palabras
export class WordPlacer {
    constructor(gridSize, difficulty) {
        this.gridSize = gridSize;
        this.difficulty = difficulty;
        this.directions = this.getDirections();
    }

    getDirections() {
        if (this.difficulty === 'easy') {
            return [
                { dx: 0, dy: 1 },   // horizontal
                { dx: 1, dy: 0 }    // vertical
            ];
        } else if (this.difficulty === 'normal') {
            return [
                { dx: 0, dy: 1 },
                { dx: 1, dy: 0 },
                { dx: 1, dy: 1 },
                { dx: 1, dy: -1 }
            ];
        } else {
            return [
                { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
                { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
            ];
        }
    }

    placeWord(grid, word) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;
        const positions = [];
        
        while (!placed && attempts < maxAttempts) {
            const dir = this.directions[Math.floor(Math.random() * this.directions.length)];
            const startX = Math.floor(Math.random() * this.gridSize);
            const startY = Math.floor(Math.random() * this.gridSize);
            
            if (this.canPlaceWord(grid, word, startX, startY, dir)) {
                for (let i = 0; i < word.length; i++) {
                    const x = startX + (dir.dx * i);
                    const y = startY + (dir.dy * i);
                    grid[x][y] = word[i];
                    positions.push({ row: x, col: y });
                }
                placed = true;
            }
            attempts++;
        }
        
        return positions;
    }

    canPlaceWord(grid, word, startX, startY, dir) {
        for (let i = 0; i < word.length; i++) {
            const x = startX + (dir.dx * i);
            const y = startY + (dir.dy * i);
            
            if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
                return false;
            }
            
            if (grid[x][y] !== '' && grid[x][y] !== word[i]) {
                return false;
            }
        }
        return true;
    }
}
```

**js/audio.js**
```javascript
// Sistema de audio
export class AudioManager {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playTick() {
        if (!this.enabled) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.1);
    }

    playSuccess() {
        if (!this.enabled) return;
        
        // Melodía de dos notas
        this.playNote(523.25, 0, 0.3); // C5
        this.playNote(659.25, 0.1, 0.3); // E5
    }

    playNote(frequency, delay, duration) {
        setTimeout(() => {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
            
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
        }, delay * 1000);
    }

    toggle() {
        this.enabled = !this.enabled;
    }
}
```

**js/metrics.js**
```javascript
// Sistema de métricas
export class MetricsManager {
    constructor() {
        this.storageKey = 'wordSnapMetrics';
        this.metrics = this.load();
    }

    load() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            return JSON.parse(stored);
        }
        
        return {
            maxScore: 0,
            daysPlayed: 0,
            currentStreak: 0,
            lastPlayedDate: null,
            totalGames: 0
        };
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.metrics));
    }

    update(score, won) {
        const today = new Date().toISOString().split('T')[0];
        
        // Actualizar récord
        if (score > this.metrics.maxScore) {
            this.metrics.maxScore = score;
        }
        
        // Actualizar días y racha
        if (this.metrics.lastPlayedDate !== today) {
            this.metrics.daysPlayed++;
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (this.metrics.lastPlayedDate === yesterdayStr) {
                this.metrics.currentStreak++;
            } else if (this.metrics.lastPlayedDate === null || this.metrics.lastPlayedDate < yesterdayStr) {
                this.metrics.currentStreak = 1;
            }
            
            this.metrics.lastPlayedDate = today;
        }
        
        this.metrics.totalGames++;
        this.save();
    }

    getMetrics() {
        return { ...this.metrics };
    }
}
```

**js/ui.js**
```javascript
// Manejo de UI
export class UIManager {
    constructor(game) {
        this.game = game;
    }

    updateTimer(timeLeft) {
        const timerEl = document.getElementById('timer');
        timerEl.textContent = timeLeft;
        
        if (timeLeft <= 10 && timeLeft > 0) {
            timerEl.classList.add('warning');
        } else {
            timerEl.classList.remove('warning');
        }
    }

    updateScore(score) {
        document.getElementById('score').textContent = score;
    }

    updateWordsFound(found, total) {
        document.getElementById('wordsFound').textContent = `${found}/${total}`;
    }

    showModal(score, message, metrics) {
        const modal = document.getElementById('gameOverModal');
        
        document.getElementById('finalScore').textContent = score;
        document.getElementById('resultMessage').textContent = message;
        
        // Mostrar métricas
        document.getElementById('maxScore').textContent = metrics.maxScore;
        document.getElementById('daysPlayed').textContent = metrics.daysPlayed;
        document.getElementById('streak').textContent = metrics.currentStreak;
        
        // Animación de entrada
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }

    hideModal() {
        const modal = document.getElementById('gameOverModal');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }

    createParticle(element) {
        const rect = element.getBoundingClientRect();
        const emojis = ['⭐', '✨', '💫', '🌟', '⚡'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = emoji;
        particle.style.left = rect.left + rect.width / 2 + 'px';
        particle.style.top = rect.top + rect.height / 2 + 'px';
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
}
```

**js/main.js**
```javascript
// Punto de entrada principal
import { WordSnapGame } from './game.js';
import { AudioManager } from './audio.js';
import { MetricsManager } from './metrics.js';
import { UIManager } from './ui.js';

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancias
    const audio = new AudioManager();
    const metrics = new MetricsManager();
    const game = new WordSnapGame({
        gridSize: 10,
        timeLimit: 60,
        difficulty: 'normal'
    });
    const ui = new UIManager(game);
    
    // Exponer globalmente para eventos onclick
    window.game = game;
    window.audio = audio;
    window.metrics = metrics;
    window.ui = ui;
    
    console.log('Word Snap inicializado ✅');
});
```

### Paso 3: Actualizar index.html

**index.html (limpio)**
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Word Snap - Sopa de Letras Viral</title>
    
    <!-- CSS -->
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/modal.css">
    <link rel="stylesheet" href="css/dark-mode.css">
    <link rel="stylesheet" href="css/leaderboard.css">
</head>
<body>
    <div class="game-container">
        <!-- Contenido del juego -->
    </div>

    <div class="modal" id="gameOverModal">
        <!-- Contenido del modal -->
    </div>

    <!-- JavaScript (módulos) -->
    <script type="module" src="js/main.js"></script>
</body>
</html>
```

---

## 🔄 Migración Gradual

### Fase 1: Extraer CSS (1 hora)
1. Crear carpeta `css/`
2. Copiar estilos a archivos separados
3. Enlazar en HTML
4. Probar que todo funcione

### Fase 2: Modularizar JS (2-3 horas)
1. Crear carpeta `js/` y `js/utils/`
2. Extraer clases a archivos separados
3. Usar `export`/`import`
4. Actualizar referencias
5. Probar funcionalidad

### Fase 3: Optimizar (1 hora)
1. Minificar CSS/JS para producción
2. Configurar build process
3. Optimizar carga de recursos

---

## 🛠️ Herramientas Recomendadas

### Build Tools
```bash
# Opción 1: Vite (recomendado)
npm create vite@latest word-snap -- --template vanilla
cd word-snap
npm install
npm run dev

# Opción 2: Webpack
npm install webpack webpack-cli --save-dev

# Opción 3: Parcel (más simple)
npm install -g parcel-bundler
parcel index.html
```

### Linting y Formato
```bash
# ESLint para JavaScript
npm install eslint --save-dev
npx eslint --init

# Prettier para formato
npm install prettier --save-dev
```

---

## 📦 package.json Sugerido

```json
{
  "name": "word-snap",
  "version": "1.0.0",
  "description": "Sopa de letras viral con temas diarios",
  "main": "index.html",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint js/**/*.js",
    "format": "prettier --write \"**/*.{js,css,html}\""
  },
  "keywords": ["game", "word-search", "viral"],
  "author": "Tu Nombre",
  "license": "MIT",
  "devDependencies": {
    "vite": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## ✅ Beneficios del Refactoring

### Antes
- ❌ 1 archivo HTML de 800+ líneas
- ❌ Difícil de mantener
- ❌ Difícil de testear
- ❌ No reutilizable

### Después
- ✅ Código modular y organizado
- ✅ Fácil de mantener
- ✅ Fácil de testear
- ✅ Reutilizable
- ✅ Mejor performance (lazy loading)
- ✅ Más profesional

---

## 🚀 Próximos Pasos

1. Crear estructura de carpetas
2. Extraer CSS primero (más fácil)
3. Modularizar JS gradualmente
4. Configurar build tool (Vite)
5. Probar exhaustivamente
6. Deploy a producción

**Tiempo estimado**: 4-6 horas
**Dificultad**: Media
**Beneficio**: Alto
