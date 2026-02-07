# 🚀 Guía de Features Avanzadas - Word Snap

## 📋 Estado de Implementación

### ✅ Completado
- ✅ **Tarea 1**: Sistema de Misiones Diarias (`word-snap-quests.js`)
- ✅ **Tarea 2**: Sistema de Monedas + Tienda (`coins-manager.js`)

### 📝 Pendiente (Guías Incluidas)
- 📝 **Tarea 3**: Palabras Ocultas Extra
- 📝 **Tarea 4**: Modo Maratón
- 📝 **Tarea 5**: Sonidos + Música
- 📝 **Tarea 6**: Ranking con UID
- 📝 **Tarea 7**: Optimizaciones Profundas

---

## 🎯 TAREA 1: Misiones Diarias ✅

### Archivos Creados
- `word-snap-quests.js` - Sistema completo de misiones

### Integración en HTML

```html
<!-- Añadir antes de </body> -->
<script src="word-snap-quests.js"></script>

<!-- Añadir botón en controles -->
<button class="control-btn" onclick="showQuestsModal()">
    🎯 Misiones
</button>

<!-- Añadir modal de misiones -->
<div class="modal" id="questsModal">
    <div class="modal-content">
        <h2>🎯 Misiones Diarias</h2>
        <div id="questsList"></div>
        <button class="modal-btn primary" onclick="closeQuestsModal()">
            Cerrar
        </button>
    </div>
</div>
```

### Integración en JS

```javascript
// En levelComplete()
levelComplete() {
    // ... código existente ...
    
    // Actualizar misiones
    questManager.updateProgress('complete_level', 1);
    questManager.updateProgress('play_levels', 1);
}

// En foundWord()
foundWord(word) {
    // ... código existente ...
    
    // Actualizar misión de palabras
    questManager.updateProgress('find_words', 1);
}

// Funciones del modal
function showQuestsModal() {
    const modal = document.getElementById('questsModal');
    const list = document.getElementById('questsList');
    
    const quests = questManager.getQuests();
    list.innerHTML = quests.map(q => `
        <div class="quest-item ${q.completed ? 'completed' : ''}">
            <div class="quest-icon">${q.icon}</div>
            <div class="quest-info">
                <div class="quest-title">${q.title}</div>
                <div class="quest-desc">${q.description}</div>
                <div class="quest-progress">
                    ${q.progress} / ${q.target}
                </div>
            </div>
            <div class="quest-reward">
                ${q.reward.coins} 🪙
            </div>
        </div>
    `).join('');
    
    modal.classList.add('show');
}

function closeQuestsModal() {
    document.getElementById('questsModal').classList.remove('show');
}
```

### CSS Necesario

```css
.quest-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 20px;
    border-radius: 15px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    display: flex;
    gap: 15px;
    animation: slideIn 0.3s ease;
    z-index: 10000;
}

.quest-notif-icon {
    font-size: 2em;
}

.quest-notif-title {
    font-weight: bold;
    color: #4CAF50;
}

.quest-notif-reward {
    color: #FFD700;
    font-weight: bold;
}

.quest-item {
    display: flex;
    gap: 15px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 10px;
    margin: 10px 0;
}

.quest-item.completed {
    opacity: 0.6;
    background: #e8f5e9;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
```

---

## 🪙 TAREA 2: Monedas + Tienda ✅

### Archivos Creados
- `coins-manager.js` - Sistema completo de economía

### Integración en HTML

```html
<!-- Añadir antes de </body> -->
<script src="coins-manager.js"></script>

<!-- Añadir display de monedas en header -->
<div class="coins-display">
    🪙 <span id="coinsDisplay">0</span>
</div>

<!-- Añadir botón de tienda -->
<button class="control-btn" onclick="showShop()">
    🛒 Tienda
</button>

<!-- Modal de tienda -->
<div class="modal" id="shopModal">
    <div class="modal-content" style="max-width: 600px;">
        <h2>🛒 Tienda</h2>
        
        <div class="shop-tabs">
            <button class="shop-tab active" onclick="showShopCategory('skins')">
                Skins
            </button>
            <button class="shop-tab" onclick="showShopCategory('particles')">
                Partículas
            </button>
            <button class="shop-tab" onclick="showShopCategory('themes')">
                Temas
            </button>
        </div>
        
        <div id="shopItems"></div>
        
        <button class="modal-btn secondary" onclick="closeShop()">
            Cerrar
        </button>
    </div>
</div>
```

### Integración en JS

```javascript
// En levelComplete()
levelComplete() {
    // ... código existente ...
    
    // Dar monedas según score
    const coinsEarned = Math.floor(this.score / 20);
    coinsManager.addCoins(coinsEarned, 'Nivel completado');
}

// Funciones de tienda
function showShop() {
    const modal = document.getElementById('shopModal');
    showShopCategory('skins');
    modal.classList.add('show');
}

function closeShop() {
    document.getElementById('shopModal').classList.remove('show');
}

function showShopCategory(category) {
    const items = coinsManager.getShopItems()[category];
    const container = document.getElementById('shopItems');
    
    container.innerHTML = items.map(item => `
        <div class="shop-item ${item.owned ? 'owned' : ''}">
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-preview" style="${item.color ? 'background:' + item.color : item.gradient ? 'background:' + item.gradient : ''}">
                ${item.emoji || ''}
            </div>
            <div class="shop-item-price">
                ${item.price} 🪙
            </div>
            ${item.owned ? 
                `<button class="shop-btn" onclick="coinsManager.equipItem('${category}', '${item.id}')">
                    Equipar
                </button>` :
                `<button class="shop-btn" onclick="buyShopItem('${category}', '${item.id}', ${item.price})">
                    Comprar
                </button>`
            }
        </div>
    `).join('');
}

function buyShopItem(category, itemId, price) {
    if (coinsManager.buyItem(category, itemId, price)) {
        showShopCategory(category);
        alert('¡Comprado!');
    } else {
        alert('No tienes suficientes monedas');
    }
}
```

### CSS Necesario

```css
.coins-display {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #FFD700;
    color: #333;
    padding: 10px 20px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 1.2em;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
}

.shop-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.shop-tab {
    flex: 1;
    padding: 10px;
    border: 2px solid #667eea;
    background: white;
    border-radius: 10px;
    cursor: pointer;
}

.shop-tab.active {
    background: #667eea;
    color: white;
}

.shop-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 10px;
    margin: 10px 0;
}

.shop-item-preview {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5em;
}

.shop-btn {
    padding: 8px 15px;
    border: none;
    border-radius: 8px;
    background: #4CAF50;
    color: white;
    cursor: pointer;
}

.coins-notification {
    position: fixed;
    top: 80px;
    right: 20px;
    background: #FFD700;
    color: #333;
    padding: 15px 25px;
    border-radius: 15px;
    font-weight: bold;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
    z-index: 10000;
}
```

---

## 🔍 TAREA 3: Palabras Ocultas Extra

### Código para Implementar

```javascript
// En word-snap-campaign.js

// Añadir al constructor
this.hiddenWord = null;
this.hiddenWordsFound = parseInt(localStorage.getItem('wsHiddenWordsFound') || '0', 10);

// Modificar loadLevel()
loadLevel(levelNumber) {
    // ... código existente ...
    
    // Añadir palabra oculta
    const extraWords = ['BONUS', 'SECRETO', 'EXTRA', 'OCULTO', 'PREMIO'];
    this.hiddenWord = extraWords[levelNumber % extraWords.length];
    this.words.push(this.hiddenWord);
}

// Modificar renderWordsList()
renderWordsList() {
    const listElement = document.getElementById('wordsList');
    listElement.innerHTML = '';
    
    this.words.forEach(word => {
        // No mostrar palabra oculta
        if (word === this.hiddenWord) return;
        
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.textContent = word;
        
        if (this.foundWords.includes(word)) {
            wordItem.classList.add('found');
        }
        
        listElement.appendChild(wordItem);
    });
}

// Modificar foundWord()
foundWord(word) {
    // ... código existente ...
    
    // Verificar si es palabra oculta
    if (word === this.hiddenWord) {
        this.onHiddenWordFound();
    }
}

onHiddenWordFound() {
    // Animación especial
    this.createSpecialEffect();
    
    // Monedas extra
    coinsManager.addCoins(100, '¡Palabra Oculta!');
    
    // Badge temporal
    this.showDetectiveBadge();
    
    // Guardar estadística
    this.hiddenWordsFound++;
    localStorage.setItem('wsHiddenWordsFound', String(this.hiddenWordsFound));
}

createSpecialEffect() {
    // Efecto de explosión dorada
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.textContent = '💎';
            particle.style.cssText = `
                position: fixed;
                left: 50%;
                top: 50%;
                font-size: 2em;
                pointer-events: none;
                z-index: 10000;
                animation: explode${i} 1s ease-out forwards;
            `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }, i * 50);
    }
}

showDetectiveBadge() {
    const badge = document.createElement('div');
    badge.className = 'detective-badge';
    badge.textContent = '🕵️ ¡Detective!';
    document.body.appendChild(badge);
    
    setTimeout(() => {
        badge.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => badge.remove(), 500);
    }, 3000);
}
```

### CSS

```css
.detective-badge {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: white;
    padding: 30px 50px;
    border-radius: 20px;
    font-size: 2em;
    font-weight: bold;
    box-shadow: 0 10px 40px rgba(255, 215, 0, 0.5);
    z-index: 10000;
    animation: badgeBounce 0.5s ease;
}

@keyframes badgeBounce {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.2); }
}
```

---

## 🏃 TAREA 4: Modo Maratón

### Código para Implementar

```javascript
// Crear word-snap-marathon.js

class MarathonMode {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.levelsCompleted = 0;
        this.totalScore = 0;
        this.timeBonus = 30;
        this.record = parseInt(localStorage.getItem('wsMarathonLevels') || '0', 10);
        this.recordScore = parseInt(localStorage.getItem('wsMarathonScore') || '0', 10);
    }

    start() {
        this.isActive = true;
        this.levelsCompleted = 0;
        this.totalScore = 0;
        this.game.currentLevel = 1;
        this.game.loadLevel(1);
        this.game.start();
        
        this.showMarathonBanner();
    }

    onLevelComplete(score) {
        if (!this.isActive) return;
        
        this.levelsCompleted++;
        this.totalScore += score;
        
        // Añadir tiempo bonus
        this.game.timeLeft += this.timeBonus;
        
        // Avanzar al siguiente nivel
        this.game.currentLevel++;
        this.game.loadLevel(this.game.currentLevel);
        this.game.createGrid();
        this.game.foundWords = [];
        this.game.score = this.totalScore;
        
        this.showLevelTransition();
    }

    onGameOver() {
        this.isActive = false;
        
        // Guardar récord
        if (this.levelsCompleted > this.record) {
            this.record = this.levelsCompleted;
            localStorage.setItem('wsMarathonLevels', String(this.record));
        }
        
        if (this.totalScore > this.recordScore) {
            this.recordScore = this.totalScore;
            localStorage.setItem('wsMarathonScore', String(this.recordScore));
        }
        
        this.showMarathonResults();
    }

    showMarathonBanner() {
        const banner = document.createElement('div');
        banner.className = 'marathon-banner';
        banner.innerHTML = `
            <div>🏃 Modo Maratón</div>
            <div>Niveles: <span id="marathonLevels">0</span></div>
        `;
        document.body.appendChild(banner);
    }

    showLevelTransition() {
        const transition = document.createElement('div');
        transition.className = 'level-transition';
        transition.innerHTML = `
            <div class="transition-text">Nivel ${this.levelsCompleted} Completado!</div>
            <div class="transition-bonus">+${this.timeBonus}s ⏱️</div>
        `;
        document.body.appendChild(transition);
        
        setTimeout(() => transition.remove(), 2000);
    }

    showMarathonResults() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🏃 Maratón Terminado</h2>
                <div class="marathon-stats">
                    <div class="stat-big">
                        <div class="stat-value">${this.levelsCompleted}</div>
                        <div class="stat-label">Niveles Completados</div>
                    </div>
                    <div class="stat-big">
                        <div class="stat-value">${this.totalScore}</div>
                        <div class="stat-label">Puntuación Total</div>
                    </div>
                </div>
                <div class="marathon-records">
                    <div>🏆 Récord Niveles: ${this.record}</div>
                    <div>⭐ Récord Puntos: ${this.recordScore}</div>
                </div>
                <button class="modal-btn primary" onclick="location.reload()">
                    Volver al Menú
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }
}
```

---

## 🔊 TAREA 5: Sonidos + Música

### Código para Implementar

```javascript
// Crear audio-manager.js

class AudioManager {
    constructor() {
        this.enabled = localStorage.getItem('audioEnabled') !== 'false';
        this.sounds = {};
        this.music = null;
        this.init();
    }

    init() {
        // Crear contexto de audio
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Cargar sonidos
        this.loadSounds();
    }

    loadSounds() {
        // Sonidos simples con Web Audio API
        this.sounds = {
            click: () => this.playTone(800, 0.1, 0.05),
            found: () => this.playTone(523.25, 0.3, 0.2),
            complete: () => this.playMelody([523.25, 659.25, 783.99], 0.2),
            error: () => this.playTone(200, 0.2, 0.1)
        };
    }

    playTone(frequency, duration, volume = 0.3) {
        if (!this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playMelody(notes, duration) {
        notes.forEach((note, i) => {
            setTimeout(() => {
                this.playTone(note, duration, 0.2);
            }, i * duration * 1000);
        });
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('audioEnabled', String(this.enabled));
        return this.enabled;
    }

    isEnabled() {
        return this.enabled;
    }
}

window.audioManager = new AudioManager();
```

### Integración

```javascript
// En selectCell()
selectCell(cell) {
    // ... código existente ...
    audioManager.play('click');
}

// En foundWord()
foundWord(word) {
    // ... código existente ...
    audioManager.play('found');
}

// En levelComplete()
levelComplete() {
    // ... código existente ...
    audioManager.play('complete');
}
```

---

## 🆔 TAREA 6: Ranking con UID

### Código para Implementar

```javascript
// Generar UID único
function generatePlayerUID() {
    let uid = localStorage.getItem('wsPlayerID');
    
    if (!uid) {
        uid = crypto.randomUUID ? crypto.randomUUID() : 
              'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                  const r = Math.random() * 16 | 0;
                  const v = c === 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
              });
        
        localStorage.setItem('wsPlayerID', uid);
    }
    
    return uid;
}

// Exportar estadísticas
function exportPlayerStats() {
    const uid = generatePlayerUID();
    const stats = {
        uid: uid,
        maxLevel: parseInt(localStorage.getItem('wordSnapMaxLevel') || '1', 10),
        maxScore: parseInt(localStorage.getItem('wordSnapMaxScore') || '0', 10),
        daysPlayed: parseInt(localStorage.getItem('wordSnapDaysPlayed') || '0', 10),
        streak: parseInt(localStorage.getItem('wordSnapStreak') || '0', 10),
        totalTime: calculateTotalTime(),
        hiddenWords: parseInt(localStorage.getItem('wsHiddenWordsFound') || '0', 10)
    };
    
    return stats;
}

// Generar QR para compartir
function generateChallengeQR() {
    const stats = exportPlayerStats();
    const url = `${window.location.origin}${window.location.pathname}?challenge=${stats.uid}`;
    
    // Usar API de QR (ejemplo con qrcode.js o servicio externo)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    
    return qrUrl;
}

// Mostrar modal de compartir
function showShareModal() {
    const stats = exportPlayerStats();
    const qrUrl = generateChallengeQR();
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>📊 Mis Estadísticas</h2>
            <div class="stats-export">
                <div>🏆 Nivel Máximo: ${stats.maxLevel}</div>
                <div>⭐ Score Máximo: ${stats.maxScore}</div>
                <div>📅 Días Jugados: ${stats.daysPlayed}</div>
                <div>🔥 Racha: ${stats.streak}</div>
                <div>🕵️ Palabras Ocultas: ${stats.hiddenWords}</div>
            </div>
            <div class="qr-container">
                <img src="${qrUrl}" alt="QR Code">
                <p>Escanea para retarme</p>
            </div>
            <button class="modal-btn primary" onclick="this.closest('.modal').remove()">
                Cerrar
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}
```

---

## ⚡ TAREA 7: Optimizaciones Profundas

### Optimizaciones CSS

```css
/* Añadir will-change a elementos animados */
.letter-cell {
    will-change: transform;
}

.letter-cell.selected,
.letter-cell.found {
    will-change: transform, background;
}

.particle {
    will-change: transform, opacity;
}

/* Usar transform en vez de top/left para animaciones */
@keyframes particleFloat {
    0% {
        opacity: 1;
        transform: translate(0, 0) scale(1);
    }
    100% {
        opacity: 0;
        transform: translate(0, -100px) scale(0.5);
    }
}
```

### Memoization del Grid

```javascript
// Cachear cálculos de grid
const gridCache = new Map();

function getGridKey(word, gridSize, difficulty) {
    return `${word}-${gridSize}-${difficulty}`;
}

function canPlaceWordCached(word, startX, startY, dir) {
    const key = getGridKey(word, this.gridSize, this.difficulty);
    
    if (gridCache.has(key)) {
        return gridCache.get(key);
    }
    
    const result = this.canPlaceWord(word, startX, startY, dir);
    gridCache.set(key, result);
    
    return result;
}
```

### Lazy Loading de Imágenes

```javascript
// Cargar imágenes solo cuando sean necesarias
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}
```

---

## 📦 Resumen de Archivos

### Creados ✅
1. `word-snap-quests.js` - Sistema de misiones
2. `coins-manager.js` - Sistema de economía

### Por Crear 📝
3. `word-snap-marathon.js` - Modo maratón
4. `audio-manager.js` - Sistema de audio
5. `player-stats.js` - Estadísticas y UID

---

## 🚀 Próximos Pasos

1. **Integrar Misiones y Monedas** (Ya están listos)
2. **Añadir Palabras Ocultas** (Código incluido arriba)
3. **Implementar Modo Maratón** (Código incluido arriba)
4. **Añadir Sonidos** (Código incluido arriba)
5. **Sistema de Ranking** (Código incluido arriba)
6. **Aplicar Optimizaciones** (Código incluido arriba)

---

## ✨ Resultado Final

Con todas estas features implementadas tendrás:

✅ Sistema de misiones diarias con recompensas  
✅ Economía de monedas + tienda de skins  
✅ Palabras ocultas para descubrir  
✅ Modo maratón infinito  
✅ Sonidos y feedback auditivo  
✅ Sistema de ranking con UID  
✅ Optimizaciones de performance  

**¡Un juego móvil profesional completo!** 🎮
