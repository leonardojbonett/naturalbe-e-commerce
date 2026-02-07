# 🎮 Guía: Migración a Phaser

## 🎯 ¿Por Qué Phaser?

### Ventajas
- ✅ Animaciones más ricas y fluidas
- ✅ Sistema de escenas profesional
- ✅ Efectos visuales avanzados (partículas, tweens)
- ✅ Control de touch perfecto
- ✅ Physics engine integrado
- ✅ Soporte para sprites y atlas
- ✅ Audio manager robusto
- ✅ Gran comunidad y documentación

### Desventajas
- ❌ Curva de aprendizaje
- ❌ Tamaño del bundle (+500KB)
- ❌ Overkill para juegos simples

### ¿Cuándo Migrar?
- Cuando necesites animaciones complejas
- Si planeas añadir más juegos
- Para efectos visuales avanzados
- Si quieres physics (colisiones, gravedad)

---

## 📦 Setup Inicial

### Instalación

```bash
# Opción 1: NPM
npm install phaser

# Opción 2: CDN (más rápido para probar)
# Añadir en HTML:
<script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.js"></script>
```

### Estructura del Proyecto

```
word-snap-phaser/
├── index.html
├── assets/
│   ├── images/
│   │   ├── bg.png
│   │   ├── cell.png
│   │   └── particles.png
│   ├── audio/
│   │   ├── tick.mp3
│   │   └── success.mp3
│   └── fonts/
│       └── custom-font.ttf
├── src/
│   ├── main.js              # Configuración Phaser
│   ├── scenes/
│   │   ├── BootScene.js     # Carga inicial
│   │   ├── MenuScene.js     # Menú principal
│   │   ├── GameScene.js     # Juego principal
│   │   └── GameOverScene.js # Pantalla final
│   ├── objects/
│   │   ├── LetterCell.js    # Celda de letra
│   │   ├── WordList.js      # Lista de palabras
│   │   └── Timer.js         # Temporizador
│   └── utils/
│       ├── BoardGenerator.js
│       └── WordPlacer.js
└── package.json
```

---

## 🎨 Configuración Básica

### main.js

```javascript
import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import GameOverScene from './scenes/GameOverScene';

const config = {
    type: Phaser.AUTO,
    width: 500,
    height: 800,
    parent: 'game-container',
    backgroundColor: '#667eea',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
```

---

## 🎬 Escenas

### BootScene.js (Carga de Assets)

```javascript
export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Barra de carga
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(100, 370, 300, 50);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(110, 380, 280 * value, 30);
        });

        // Cargar assets
        this.load.image('cell', 'assets/images/cell.png');
        this.load.image('particle', 'assets/images/particle.png');
        this.load.audio('tick', 'assets/audio/tick.mp3');
        this.load.audio('success', 'assets/audio/success.mp3');
        
        // Cargar temas
        this.load.json('themes', 'data/themes.json');
    }

    create() {
        this.scene.start('MenuScene');
    }
}
```

### MenuScene.js (Menú Principal)

```javascript
export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Título con animación
        const title = this.add.text(250, 150, '🔤 Word Snap', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: title,
            scale: { from: 0.8, to: 1.2 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Botones de dificultad
        this.createButton(250, 350, '😌 Fácil', 'easy');
        this.createButton(250, 450, '😊 Normal', 'normal');
        this.createButton(250, 550, '😈 Difícil', 'hard');

        // Métricas
        const metrics = this.loadMetrics();
        this.add.text(250, 700, `🔥 Racha: ${metrics.currentStreak} días`, {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    createButton(x, y, text, difficulty) {
        const button = this.add.rectangle(x, y, 200, 60, 0xffffff, 0.2)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('GameScene', { difficulty });
            })
            .on('pointerover', () => {
                button.setFillStyle(0xffffff, 0.4);
            })
            .on('pointerout', () => {
                button.setFillStyle(0xffffff, 0.2);
            });

        this.add.text(x, y, text, {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    loadMetrics() {
        const stored = localStorage.getItem('wordSnapMetrics');
        return stored ? JSON.parse(stored) : { currentStreak: 0 };
    }
}
```

### GameScene.js (Juego Principal)

```javascript
import LetterCell from '../objects/LetterCell';
import BoardGenerator from '../utils/BoardGenerator';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.difficulty = data.difficulty || 'normal';
        this.gridSize = this.difficulty === 'easy' ? 8 : 
                       this.difficulty === 'normal' ? 10 : 12;
    }

    create() {
        // Generar tablero
        const generator = new BoardGenerator(this.gridSize);
        const themes = this.cache.json.get('themes');
        const theme = this.selectDailyTheme(themes);
        
        this.words = theme.words;
        this.grid = generator.generate(this.words, this.difficulty);
        
        // Crear celdas
        this.cells = [];
        const cellSize = 40;
        const startX = 50;
        const startY = 150;
        
        for (let row = 0; row < this.gridSize; row++) {
            this.cells[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const x = startX + col * cellSize;
                const y = startY + row * cellSize;
                const letter = this.grid[row][col];
                
                const cell = new LetterCell(this, x, y, letter, row, col);
                this.cells[row][col] = cell;
            }
        }
        
        // UI
        this.createUI();
        
        // Timer
        this.timeLeft = 60;
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
        
        // Input
        this.setupInput();
    }

    createUI() {
        // Timer
        this.timerText = this.add.text(250, 50, '⏱️ 60', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Score
        this.scoreText = this.add.text(400, 50, '⭐ 0', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Words list
        this.wordsList = this.add.text(250, 700, '', {
            fontSize: '18px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        this.updateWordsList();
    }

    setupInput() {
        this.selectedCells = [];
        this.isSelecting = false;

        this.input.on('pointerdown', () => {
            this.isSelecting = true;
            this.selectedCells = [];
        });

        this.input.on('pointerup', () => {
            this.isSelecting = false;
            this.checkWord();
        });
    }

    selectCell(cell) {
        if (!this.isSelecting) return;
        if (this.selectedCells.includes(cell)) return;
        
        this.selectedCells.push(cell);
        cell.select();
        
        // Sonido
        this.sound.play('tick', { volume: 0.1 });
    }

    checkWord() {
        const word = this.selectedCells.map(c => c.letter).join('');
        
        if (this.words.includes(word) && !this.foundWords.includes(word)) {
            this.foundWord(word);
        }
        
        // Limpiar selección
        this.selectedCells.forEach(cell => {
            if (!cell.isFound) {
                cell.deselect();
            }
        });
        this.selectedCells = [];
    }

    foundWord(word) {
        this.foundWords.push(word);
        this.score += word.length * 10;
        
        // Marcar celdas
        this.selectedCells.forEach(cell => {
            cell.markAsFound();
        });
        
        // Efectos
        this.sound.play('success', { volume: 0.3 });
        this.cameras.main.shake(100, 0.005);
        
        // Partículas
        this.selectedCells.forEach(cell => {
            this.createParticles(cell.x, cell.y);
        });
        
        // Actualizar UI
        this.scoreText.setText(`⭐ ${this.score}`);
        this.updateWordsList();
        
        // Verificar victoria
        if (this.foundWords.length === this.words.length) {
            this.gameOver(true);
        }
    }

    createParticles(x, y) {
        const particles = this.add.particles(x, y, 'particle', {
            speed: { min: 50, max: 150 },
            scale: { start: 1, end: 0 },
            lifespan: 1000,
            quantity: 10,
            blendMode: 'ADD'
        });
        
        this.time.delayedCall(1000, () => particles.destroy());
    }

    updateTimer() {
        this.timeLeft--;
        this.timerText.setText(`⏱️ ${this.timeLeft}`);
        
        if (this.timeLeft <= 10) {
            this.timerText.setColor('#ff0000');
            
            // Pulso
            this.tweens.add({
                targets: this.timerText,
                scale: { from: 1, to: 1.2 },
                duration: 500,
                yoyo: true
            });
        }
        
        if (this.timeLeft <= 0) {
            this.gameOver(false);
        }
    }

    updateWordsList() {
        const text = this.words.map(word => {
            return this.foundWords.includes(word) ? 
                `✅ ${word}` : `⬜ ${word}`;
        }).join('  ');
        
        this.wordsList.setText(text);
    }

    gameOver(won) {
        this.timerEvent.remove();
        
        this.scene.start('GameOverScene', {
            score: this.score,
            won: won,
            foundWords: this.foundWords.length,
            totalWords: this.words.length,
            theme: this.currentTheme
        });
    }

    selectDailyTheme(themes) {
        const dayIndex = new Date().getDate();
        return themes.themes[dayIndex % themes.themes.length];
    }
}
```

### objects/LetterCell.js

```javascript
export default class LetterCell extends Phaser.GameObjects.Container {
    constructor(scene, x, y, letter, row, col) {
        super(scene, x, y);
        
        this.letter = letter;
        this.row = row;
        this.col = col;
        this.isFound = false;
        
        // Fondo
        this.bg = scene.add.rectangle(0, 0, 35, 35, 0xffffff)
            .setStrokeStyle(2, 0xe0e0e0);
        
        // Letra
        this.text = scene.add.text(0, 0, letter, {
            fontSize: '20px',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.add([this.bg, this.text]);
        
        // Interactividad
        this.setSize(35, 35);
        this.setInteractive();
        
        this.on('pointerover', () => {
            if (scene.isSelecting) {
                scene.selectCell(this);
            }
        });
        
        scene.add.existing(this);
    }

    select() {
        this.bg.setFillStyle(0x667eea);
        this.text.setColor('#ffffff');
        
        // Animación
        this.scene.tweens.add({
            targets: this,
            scale: { from: 1, to: 1.1 },
            duration: 100
        });
    }

    deselect() {
        this.bg.setFillStyle(0xffffff);
        this.text.setColor('#333333');
        this.setScale(1);
    }

    markAsFound() {
        this.isFound = true;
        this.bg.setFillStyle(0x4caf50);
        this.text.setColor('#ffffff');
        
        // Animación de celebración
        this.scene.tweens.add({
            targets: this,
            scale: { from: 1, to: 1.3 },
            angle: { from: 0, to: 360 },
            duration: 400,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    }
}
```

---

## 🎨 Efectos Avanzados con Phaser

### Partículas Personalizadas

```javascript
// Crear emisor de partículas
const particles = this.add.particles(x, y, 'particle', {
    speed: { min: 100, max: 200 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 1000,
    gravityY: 200,
    quantity: 20,
    blendMode: 'ADD',
    emitting: false
});

// Explotar
particles.explode();
```

### Tweens (Animaciones)

```javascript
// Bounce effect
this.tweens.add({
    targets: object,
    y: '-=50',
    duration: 500,
    ease: 'Bounce.easeOut',
    yoyo: true
});

// Fade in/out
this.tweens.add({
    targets: object,
    alpha: { from: 0, to: 1 },
    duration: 1000,
    ease: 'Power2'
});

// Secuencia
this.tweens.chain({
    targets: object,
    tweens: [
        { scale: 1.2, duration: 200 },
        { scale: 1, duration: 200 },
        { alpha: 0, duration: 300 }
    ]
});
```

### Cámara Effects

```javascript
// Shake
this.cameras.main.shake(200, 0.01);

// Flash
this.cameras.main.flash(500, 255, 255, 255);

// Fade
this.cameras.main.fadeOut(1000);

// Zoom
this.cameras.main.zoomTo(1.5, 1000);
```

---

## 📊 Comparación: Vanilla JS vs Phaser

| Característica | Vanilla JS | Phaser |
|---------------|------------|--------|
| **Tamaño** | ~50KB | ~550KB |
| **Animaciones** | CSS básicas | Tweens avanzados |
| **Partículas** | Manual | Sistema integrado |
| **Escenas** | Manual | Built-in |
| **Audio** | Web Audio API | Audio Manager |
| **Touch** | Events básicos | Gestures avanzados |
| **Performance** | Buena | Excelente |
| **Curva aprendizaje** | Baja | Media |

---

## 🚀 Cuándo Usar Cada Uno

### Usar Vanilla JS Si:
- ✅ Juego simple
- ✅ Quieres bundle pequeño
- ✅ No necesitas animaciones complejas
- ✅ Prototipo rápido

### Usar Phaser Si:
- ✅ Múltiples juegos/escenas
- ✅ Animaciones complejas
- ✅ Efectos visuales avanzados
- ✅ Physics necesario
- ✅ Proyecto a largo plazo

---

## 📚 Recursos

- **Documentación**: https://photonstorm.github.io/phaser3-docs/
- **Ejemplos**: https://phaser.io/examples
- **Tutoriales**: https://phaser.io/tutorials
- **Discord**: https://discord.gg/phaser

---

## ✅ Conclusión

**Para Word Snap actual**: Vanilla JS es suficiente
**Para escalar a plataforma de juegos**: Migrar a Phaser

**Tiempo de migración**: 1-2 semanas
**Beneficio**: Animaciones profesionales + escalabilidad
