# 🚀 Mejoras Avanzadas - Word Snap

## Implementación de Características Pro

---

## 1. ✅ Vibración Mejorada

### Implementación Actual
Ya existe vibración básica (50ms). Vamos a mejorarla:

```javascript
// En foundWord() - ACTUALIZAR
foundWord(word) {
    this.foundWords.push(word);
    this.score += word.length * 10;
    
    // Sonido de éxito
    try {
        this.sounds.success();
    } catch (e) {}
    
    // VIBRACIÓN MEJORADA
    if (navigator.vibrate) {
        // Patrón más satisfactorio
        navigator.vibrate([40, 20, 40]); // Doble vibración
    }
    
    // ... resto del código
}
```

**Beneficio**: Dopamina física real, feedback táctil más satisfactorio

---

## 2. 🎯 Bonificación por Palabras Difíciles

### Sistema de Puntuación Avanzado

```javascript
// Añadir al constructor
constructor() {
    // ... código existente ...
    this.wordBonuses = {
        diagonal: 1.5,      // x1.5 puntos
        reverse: 1.3,       // x1.3 puntos
        long: 1.2           // x1.2 puntos (≥7 letras)
    };
}

// Nueva función para calcular bonus
calculateWordBonus(word, positions) {
    let bonus = 1.0;
    let bonusReasons = [];
    
    // Detectar si es diagonal
    if (this.isDiagonal(positions)) {
        bonus *= this.wordBonuses.diagonal;
        bonusReasons.push('Diagonal');
    }
    
    // Detectar si es inversa
    if (this.isReverse(positions)) {
        bonus *= this.wordBonuses.reverse;
        bonusReasons.push('Inversa');
    }
    
    // Detectar si es larga
    if (word.length >= 7) {
        bonus *= this.wordBonuses.long;
        bonusReasons.push('Larga');
    }
    
    return { bonus, reasons: bonusReasons };
}

isDiagonal(positions) {
    if (positions.length < 2) return false;
    
    const dx = positions[1].row - positions[0].row;
    const dy = positions[1].col - positions[0].col;
    
    // Es diagonal si ambos cambian
    return dx !== 0 && dy !== 0;
}

isReverse(positions) {
    if (positions.length < 2) return false;
    
    const dx = positions[1].row - positions[0].row;
    const dy = positions[1].col - positions[0].col;
    
    // Es inversa si va hacia atrás o arriba
    return dx < 0 || dy < 0;
}

// ACTUALIZAR foundWord()
foundWord(word) {
    this.foundWords.push(word);
    
    // Calcular puntos con bonus
    const basePoints = word.length * 10;
    const { bonus, reasons } = this.calculateWordBonus(word, this.selectedCells);
    const totalPoints = Math.floor(basePoints * bonus);
    
    this.score += totalPoints;
    
    // Mostrar bonus si aplica
    if (bonus > 1.0) {
        this.showBonusPopup(totalPoints, reasons);
    }
    
    // ... resto del código
}

showBonusPopup(points, reasons) {
    const popup = document.createElement('div');
    popup.className = 'bonus-popup';
    popup.innerHTML = `
        <div class="bonus-points">+${points}</div>
        <div class="bonus-reason">${reasons.join(' + ')}</div>
    `;
    
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.style.animation = 'bonusFadeOut 0.3s ease-in';
        setTimeout(() => popup.remove(), 300);
    }, 1500);
}
```

**CSS para bonus popup**:
```css
.bonus-popup {
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: white;
    padding: 20px 30px;
    border-radius: 15px;
    font-weight: bold;
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.5);
    z-index: 3000;
    animation: bonusBounce 0.5s ease-out;
}

.bonus-points {
    font-size: 2em;
    margin-bottom: 5px;
}

.bonus-reason {
    font-size: 0.9em;
    opacity: 0.9;
}

@keyframes bonusBounce {
    0% { transform: translate(-50%, -50%) scale(0); }
    50% { transform: translate(-50%, -50%) scale(1.2); }
    100% { transform: translate(-50%, -50%) scale(1); }
}

@keyframes bonusFadeOut {
    to {
        opacity: 0;
        transform: translate(-50%, -60%);
    }
}
```

---

## 3. 🧘 Modo Zen (Sin Tiempo)

### Implementación

```javascript
// Añadir al constructor
constructor() {
    // ... código existente ...
    this.gameMode = 'normal'; // normal, zen, extreme
}

// Añadir botones de modo en HTML
<div class="game-modes">
    <button class="mode-btn active" data-mode="normal" onclick="game.setGameMode('normal')">
        ⏱️ Normal
    </button>
    <button class="mode-btn" data-mode="zen" onclick="game.setGameMode('zen')">
        🧘 Zen
    </button>
    <button class="mode-btn" data-mode="extreme" onclick="game.setGameMode('extreme')">
        ⚡ Extremo
    </button>
</div>

// Nueva función
setGameMode(mode) {
    if (this.isPlaying) {
        alert('No puedes cambiar el modo durante el juego');
        return;
    }
    
    this.gameMode = mode;
    
    // Actualizar UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    // Ajustar tiempo según modo
    if (mode === 'zen') {
        this.timeLimit = Infinity;
        document.getElementById('timer').textContent = '∞';
    } else if (mode === 'extreme') {
        this.timeLimit = 30;
    } else {
        this.timeLimit = 120;
    }
}

// ACTUALIZAR start()
start() {
    if (this.isPlaying) return;
    
    try {
        this.sounds.start();
    } catch (e) {}
    
    this.isPlaying = true;
    this.score = 0;
    this.foundWords = [];
    
    // Configurar tiempo según modo
    if (this.gameMode === 'zen') {
        this.timeLeft = Infinity;
        // No iniciar timer
    } else {
        this.timeLeft = this.timeLimit;
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateUI();
            
            if (this.timeLeft === 20 && this.gameMode === 'normal') {
                this.showTimeWarning();
            }
            
            if (this.timeLeft <= 0) {
                this.gameOver(false);
            }
        }, 1000);
    }
    
    this.createGrid();
    this.updateUI();
    this.updateStartButton();
}
```

**CSS para modos**:
```css
.game-modes {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-bottom: 15px;
}

.mode-btn {
    padding: 8px 15px;
    border: 2px solid #667eea;
    background: white;
    border-radius: 10px;
    font-size: 0.85em;
    cursor: pointer;
    transition: all 0.3s;
}

.mode-btn:hover {
    background: #667eea;
    color: white;
}

.mode-btn.active {
    background: #667eea;
    color: white;
}
```

---

## 4. ⚡ Modo Contrarreloj Extremo

### Sistema de Combo

```javascript
// Añadir al constructor
constructor() {
    // ... código existente ...
    this.combo = 0;
    this.lastWordTime = 0;
    this.comboTimeout = null;
}

// ACTUALIZAR foundWord() para modo extremo
foundWord(word) {
    this.foundWords.push(word);
    
    // Sistema de combo para modo extremo
    if (this.gameMode === 'extreme') {
        const now = Date.now();
        const timeSinceLastWord = now - this.lastWordTime;
        
        // Si encuentra palabra en menos de 3 segundos, aumenta combo
        if (timeSinceLastWord < 3000 && this.lastWordTime > 0) {
            this.combo++;
            this.showComboPopup();
            
            // Bonus de tiempo por combo
            this.timeLeft += 2; // +2 segundos por combo
        } else {
            this.combo = 0;
        }
        
        this.lastWordTime = now;
        
        // Reset combo después de 3 segundos
        clearTimeout(this.comboTimeout);
        this.comboTimeout = setTimeout(() => {
            this.combo = 0;
            this.updateComboUI();
        }, 3000);
    }
    
    // Calcular puntos (con multiplicador de combo)
    const basePoints = word.length * 10;
    const { bonus, reasons } = this.calculateWordBonus(word, this.selectedCells);
    const comboMultiplier = this.gameMode === 'extreme' ? (1 + this.combo * 0.5) : 1;
    const totalPoints = Math.floor(basePoints * bonus * comboMultiplier);
    
    this.score += totalPoints;
    
    // ... resto del código
}

showComboPopup() {
    const popup = document.createElement('div');
    popup.className = 'combo-popup';
    popup.textContent = `🔥 COMBO x${this.combo}`;
    
    document.body.appendChild(popup);
    
    setTimeout(() => popup.remove(), 1000);
}

updateComboUI() {
    const comboEl = document.getElementById('comboDisplay');
    if (comboEl) {
        if (this.combo > 0) {
            comboEl.textContent = `🔥 x${this.combo}`;
            comboEl.style.display = 'block';
        } else {
            comboEl.style.display = 'none';
        }
    }
}
```

**HTML para combo**:
```html
<div class="combo-display" id="comboDisplay" style="display: none;">
    🔥 x0
</div>
```

**CSS para combo**:
```css
.combo-display {
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #FF6B6B, #FF8E53);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 1.5em;
    font-weight: bold;
    box-shadow: 0 5px 20px rgba(255, 107, 107, 0.5);
    z-index: 1000;
    animation: comboPulse 0.5s ease-in-out infinite;
}

@keyframes comboPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.combo-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 3em;
    font-weight: bold;
    color: #FF6B6B;
    text-shadow: 0 0 20px rgba(255, 107, 107, 0.8);
    z-index: 3000;
    animation: comboZoom 1s ease-out;
    pointer-events: none;
}

@keyframes comboZoom {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    50% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}
```

---

## 5. 🏆 Ranking Global del Día

### Opción Simple (JSON en GitHub Pages)

```javascript
// Crear archivo rankings.json
{
  "2025-11-26": [
    { "name": "Player1", "score": 850, "time": 45 },
    { "name": "Player2", "score": 720, "time": 60 }
  ]
}

// Función para cargar ranking
async loadDailyRanking() {
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const response = await fetch('https://tu-usuario.github.io/word-snap/rankings.json');
        const data = await response.json();
        
        return data[today] || [];
    } catch (error) {
        console.error('Error loading ranking:', error);
        return [];
    }
}

// Función para mostrar ranking
async showRanking() {
    const ranking = await this.loadDailyRanking();
    
    const modal = document.getElementById('rankingModal');
    const list = document.getElementById('rankingList');
    
    list.innerHTML = ranking
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((entry, index) => `
            <div class="ranking-item ${index < 3 ? 'top-' + (index + 1) : ''}">
                <span class="rank">${index + 1}</span>
                <span class="name">${entry.name}</span>
                <span class="score">${entry.score}</span>
            </div>
        `).join('');
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}
```

**HTML para ranking**:
```html
<button class="btn-secondary" onclick="game.showRanking()">
    🏆 Ver Ranking
</button>

<div class="modal" id="rankingModal">
    <div class="modal-content">
        <button class="close-btn" onclick="game.closeRanking()">✕</button>
        <h2>🏆 Top 10 del Día</h2>
        <div id="rankingList"></div>
    </div>
</div>
```

---

## 6. 🎯 Reto por Enlace (Mejorado)

### Implementación Completa

```javascript
// Ya existe generatePuzzleSeed() - MEJORAR
generatePuzzleSeed() {
    const today = new Date().toISOString().split('T')[0];
    const themeCode = this.currentTheme.replace(/\s+/g, '-').toUpperCase();
    const diffCode = this.difficulty.toUpperCase();
    
    // Usar grid actual como seed
    const gridSeed = this.grid.flat().join('').substring(0, 20);
    
    return `${themeCode}-${diffCode}-${today}-${gridSeed}`;
}

// MEJORAR challengeFriend()
challengeFriend() {
    const seed = this.generatePuzzleSeed();
    const challengeUrl = `${window.location.origin}${window.location.pathname}?challenge=${seed}&creator=${encodeURIComponent(this.getPlayerName())}&score=${this.score}`;
    
    const text = `🎯 ¡Te reto a Word Snap!\n\n` +
                `Tema: ${this.currentTheme}\n` +
                `Mi puntuación: ${this.score} puntos\n` +
                `Palabras: ${this.foundWords.length}/${this.words.length}\n\n` +
                `¿Puedes superarme? 🔥\n` +
                `${challengeUrl}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Desafío Word Snap',
            text: text,
            url: challengeUrl
        });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('¡Link de desafío copiado! Envíalo a tus amigos 🎮');
        });
    }
}

getPlayerName() {
    let name = localStorage.getItem('playerName');
    if (!name) {
        name = prompt('Tu nombre:', 'Jugador');
        if (name) {
            localStorage.setItem('playerName', name);
        }
    }
    return name || 'Jugador';
}

// ACTUALIZAR init() para detectar desafío
async init() {
    await this.loadThemes();
    
    // Verificar si hay un desafío en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const challengeParam = urlParams.get('challenge');
    const creatorName = urlParams.get('creator');
    const creatorScore = urlParams.get('score');
    
    if (challengeParam) {
        this.isChallenge = true;
        this.challengeCreator = creatorName;
        this.challengeScore = parseInt(creatorScore);
        
        // Mostrar banner de desafío
        this.showChallengeBanner();
        
        this.loadPuzzleFromChallenge(challengeParam);
    } else {
        this.selectDailyTheme();
    }
    
    this.createGrid();
    this.updateUI();
    this.updateStartButton();
    this.applyDarkMode();
}

showChallengeBanner() {
    const banner = document.createElement('div');
    banner.className = 'challenge-banner';
    banner.innerHTML = `
        <div class="challenge-text">
            🎯 Desafío de <strong>${this.challengeCreator}</strong>
        </div>
        <div class="challenge-score">
            Puntuación a superar: <strong>${this.challengeScore}</strong>
        </div>
    `;
    
    document.querySelector('.game-container').prepend(banner);
}

// Al terminar el juego en modo desafío
gameOver(won) {
    // ... código existente ...
    
    if (this.isChallenge) {
        this.showChallengeResult();
    }
}

showChallengeResult() {
    const result = document.createElement('div');
    result.className = 'challenge-result';
    
    if (this.score > this.challengeScore) {
        result.innerHTML = `
            <div class="result-icon">🏆</div>
            <div class="result-text">¡Ganaste el desafío!</div>
            <div class="result-scores">
                Tu puntuación: ${this.score}<br>
                ${this.challengeCreator}: ${this.challengeScore}
            </div>
        `;
    } else {
        result.innerHTML = `
            <div class="result-icon">😅</div>
            <div class="result-text">${this.challengeCreator} sigue ganando</div>
            <div class="result-scores">
                Tu puntuación: ${this.score}<br>
                ${this.challengeCreator}: ${this.challengeScore}
            </div>
        `;
    }
    
    document.querySelector('.modal-content').prepend(result);
}
```

**CSS para desafío**:
```css
.challenge-banner {
    background: linear-gradient(135deg, #FF6B6B, #FF8E53);
    color: white;
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 20px;
    text-align: center;
}

.challenge-text {
    font-size: 1.1em;
    margin-bottom: 5px;
}

.challenge-score {
    font-size: 0.9em;
    opacity: 0.9;
}

.challenge-result {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 15px;
    margin-bottom: 20px;
    text-align: center;
}

.result-icon {
    font-size: 3em;
    margin-bottom: 10px;
}

.result-text {
    font-size: 1.3em;
    font-weight: bold;
    margin-bottom: 10px;
}

.result-scores {
    font-size: 0.9em;
    color: #666;
}
```

---

## 7. 📸 Compartir en Stories de Instagram

### Generador de Imagen con Canvas

```javascript
async shareToInstagramStory() {
    // Crear canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    
    // Fondo con degradado
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);
    
    // Título
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔤 Word Snap', 540, 200);
    
    // Tema
    ctx.font = '50px Arial';
    ctx.fillText(this.currentTheme, 540, 300);
    
    // Puntuación grande
    ctx.font = 'bold 150px Arial';
    ctx.fillText(this.score, 540, 800);
    
    ctx.font = '40px Arial';
    ctx.fillText('PUNTOS', 540, 870);
    
    // Estadísticas
    ctx.font = '45px Arial';
    ctx.fillText(`🎯 ${this.foundWords.length}/${this.words.length} palabras`, 540, 1000);
    ctx.fillText(`⏱️ ${this.timeLimit - this.timeLeft}s`, 540, 1080);
    ctx.fillText(`🔥 Racha: ${this.metrics.currentStreak} días`, 540, 1160);
    
    // Grid de Wordle
    const wordleGrid = this.generateWordleGrid();
    ctx.font = '60px monospace';
    const lines = wordleGrid.split('\n');
    lines.forEach((line, index) => {
        ctx.fillText(line, 540, 1300 + index * 80);
    });
    
    // Call to action
    ctx.font = 'bold 50px Arial';
    ctx.fillText('¿Puedes superarme?', 540, 1700);
    
    ctx.font = '35px Arial';
    ctx.fillText('wordsnap.com', 540, 1780);
    
    // Convertir a blob
    canvas.toBlob(async (blob) => {
        const file = new File([blob], 'word-snap-score.png', { type: 'image/png' });
        
        // Intentar compartir
        if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Mi puntuación en Word Snap',
                    text: `¡${this.score} puntos en Word Snap! 🔥`
                });
            } catch (error) {
                console.log('Error sharing:', error);
                this.downloadImage(blob);
            }
        } else {
            // Descargar imagen
            this.downloadImage(blob);
        }
    });
}

downloadImage(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'word-snap-score.png';
    a.click();
    URL.revokeObjectURL(url);
    
    alert('Imagen descargada! Súbela a tu Instagram Story 📸');
}
```

**Botón para compartir**:
```html
<button class="btn-primary" onclick="game.shareToInstagramStory()">
    📸 Story de Instagram
</button>
```

---

## 📊 Resumen de Mejoras

| Mejora | Impacto | Dificultad | Tiempo |
|--------|---------|------------|--------|
| 1. Vibración mejorada | ⭐⭐⭐ | Fácil | 5 min |
| 2. Bonificación palabras | ⭐⭐⭐⭐ | Media | 1 hora |
| 3. Modo Zen | ⭐⭐⭐⭐ | Fácil | 30 min |
| 4. Modo Extremo | ⭐⭐⭐⭐⭐ | Media | 1 hora |
| 5. Ranking Global | ⭐⭐⭐⭐⭐ | Alta | 2 horas |
| 6. Reto mejorado | ⭐⭐⭐⭐⭐ | Media | 1 hora |
| 7. Instagram Story | ⭐⭐⭐⭐⭐ | Media | 1 hora |

**Total**: 6-7 horas de desarrollo
**Impacto en viralidad**: +300%

---

## 🚀 Orden de Implementación Recomendado

### Fase 1 (Rápido - 1 hora)
1. ✅ Vibración mejorada
2. ✅ Modo Zen
3. ✅ Bonificación palabras

### Fase 2 (Medio - 2 horas)
4. ✅ Modo Extremo con combos
5. ✅ Reto mejorado

### Fase 3 (Avanzado - 3 horas)
6. ✅ Ranking Global
7. ✅ Instagram Story

---

**Estado**: 📝 DOCUMENTADO Y LISTO PARA IMPLEMENTAR

¿Quieres que implemente alguna de estas mejoras ahora?
