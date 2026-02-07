// Word Snap - Sistema de Campaña con 100 Niveles
class WordSnapCampaign {
    constructor() {
        this.gridSize = 10;
        this.baseTimeLimit = 120;
        this.timeLimit = this.baseTimeLimit;
        this.grid = [];
        this.words = [];
        this.foundWords = [];
        this.selectedCells = [];
        this.score = 0;
        this.timer = null;
        this.timeLeft = this.timeLimit;
        this.isPlaying = false;
        this.difficulty = 'normal';
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        
        // Sistema de niveles
        this.currentLevel = parseInt(localStorage.getItem('wordSnapLevel')) || 1;
        this.maxLevelUnlocked = parseInt(localStorage.getItem('wordSnapMaxLevel')) || 1;
        this.levelData = null;
        
        // Sistema de retos
        this.challengeMode = false;
        this.challengeSeed = null;
        
        // Pool de partículas para mejor performance
        this.particlePool = [];
        this.initParticlePool();
        
        // Sistema de palabra oculta
        this.hiddenWord = null;
        this.hiddenWordFound = false;
        
        // Sistema de perfil de jugador
        this.initPlayerProfile();
        
        this.checkChallengeMode();
        this.init();
    }

    initParticlePool() {
        // Crear 30 partículas reutilizables
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.display = 'none';
            document.body.appendChild(particle);
            this.particlePool.push({
                element: particle,
                inUse: false
            });
        }
    }

    getParticleFromPool() {
        const available = this.particlePool.find(p => !p.inUse);
        if (available) {
            available.inUse = true;
            return available;
        }
        return null;
    }

    releaseParticle(particle) {
        particle.inUse = false;
        particle.element.style.display = 'none';
    }

    checkChallengeMode() {
        const params = new URLSearchParams(window.location.search);
        const challengeLevel = parseInt(params.get('challengeLevel') || '', 10);
        const challengeSeed = params.get('challengeSeed');
        
        if (challengeLevel && challengeSeed) {
            this.challengeMode = true;
            this.currentLevel = challengeLevel;
            this.challengeSeed = challengeSeed;
            
            // Mostrar banner de reto
            this.showChallengeBanner();
        }
    }

    showChallengeBanner() {
        const banner = document.createElement('div');
        banner.className = 'challenge-banner';
        banner.innerHTML = `
            <div class="challenge-text">🔥 Te han retado en el nivel ${this.currentLevel}</div>
            <div class="challenge-score">¡Consigue más puntos que tu amigo!</div>
        `;
        
        document.body.insertBefore(banner, document.body.firstChild);
    }

    init() {
        this.loadLevel(this.currentLevel);
        this.createGrid();
        this.updateUI();
        this.applyDarkMode();
        this.applyTheme();
        this.initLevelSelector();
        this.initSoundButton();
    }

    initPlayerProfile() {
        let playerId = localStorage.getItem('wsPlayerID');
        if (!playerId && window.crypto?.randomUUID) {
            playerId = crypto.randomUUID();
            localStorage.setItem('wsPlayerID', playerId);
        }
        this.playerId = playerId;
    }

    initSoundButton() {
        const soundBtn = document.getElementById('soundBtn');
        if (!soundBtn) return;
        
        if (window.audioManager && !audioManager.enabled) {
            soundBtn.textContent = '🔇 Sonido';
        }
        soundBtn.addEventListener('click', () => {
            const enabled = audioManager.toggle();
            soundBtn.textContent = enabled ? '🔊 Sonido' : '🔇 Sonido';
        });
    }

    loadLevel(levelNumber) {
        // Asegurar que el nivel esté en rango
        if (levelNumber < 1) levelNumber = 1;
        if (levelNumber > GAME_LEVELS.totalLevels) levelNumber = GAME_LEVELS.totalLevels;
        
        this.currentLevel = levelNumber;
        this.levelData = GAME_LEVELS.levels.find(l => l.nivel === levelNumber);
        
        if (!this.levelData) {
            console.error('Nivel no encontrado:', levelNumber);
            this.levelData = GAME_LEVELS.levels[0];
        }
        
        this.words = this.levelData.palabras;
        this.hiddenWord = this.levelData.palabraOculta || null;
        this.hiddenWordFound = false;
        
        // 🔹 NUEVO: ajustar grid y tiempo según nivel y palabras
        this.configureGridForCurrentLevel();
        
        this.updateLevelUI();
    }
    
    configureGridForCurrentLevel() {
        // Todas las palabras que se van a colocar (incluida la oculta)
        const allWords = [...this.words];
        if (this.hiddenWord) {
            allWords.push(this.hiddenWord);
        }
        
        const longestWordLength = allWords.reduce(
            (max, w) => Math.max(max, w.length),
            0
        );
        
        // Tamaño base según rango de niveles (Opción B)
        let baseSize;
        if (this.currentLevel <= 20) {
            baseSize = 10;
        } else if (this.currentLevel <= 50) {
            baseSize = 12;
        } else if (this.currentLevel <= 80) {
            baseSize = 14;
        } else {
            baseSize = 16;
        }
        
        // Asegurar que la palabra más larga quepa con margen
        this.gridSize = Math.min(
            16,
            Math.max(baseSize, longestWordLength + 2)
        );
        
        // Tiempo base según tamaño de grid
        if (this.gridSize <= 10) {
            this.baseTimeLimit = 120;      // 2:00
        } else if (this.gridSize <= 12) {
            this.baseTimeLimit = 150;      // 2:30
        } else if (this.gridSize <= 14) {
            this.baseTimeLimit = 180;      // 3:00
        } else {
            this.baseTimeLimit = 210;      // 3:30
        }
        
        // Modificador por dificultad (sin tocar el grid)
        let diffBonus = 0;
        switch (this.difficulty) {
            case 'easy':
                diffBonus = 30;
                break;
            case 'hard':
                diffBonus = -30;
                break;
            case 'expert':
                diffBonus = -45;
                break;
            case 'master':
                diffBonus = -60;
                break;
            // normal = 0
        }
        
        this.timeLimit = Math.max(60, this.baseTimeLimit + diffBonus);
        this.timeLeft = this.timeLimit;
        
        this.applyGridSizeToUI();
    }
    
    applyGridSizeToUI() {
        const gridEl = document.getElementById('letterGrid');
        if (!gridEl) return;
        
        gridEl.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        
        // Ajustar tamaño de letra
        if (this.gridSize >= 14) {
            gridEl.style.fontSize = '0.75em';
        } else if (this.gridSize >= 12) {
            gridEl.style.fontSize = '0.85em';
        } else {
            gridEl.style.fontSize = '1em';
        }
    }

    updateLevelUI() {
        const badge = document.getElementById('levelBadge');
        const info = document.getElementById('levelInfo');
        const progress = document.getElementById('progressFill');
        const startBtn = document.getElementById('startBtn');
        
        badge.textContent = `${this.levelData.icono} Nivel ${this.currentLevel} – ${this.levelData.tema}`;
        badge.style.background = this.levelData.color;
        
        info.textContent = `Nivel ${this.currentLevel} de ${GAME_LEVELS.totalLevels} • ${this.levelData.categoria}`;
        
        const progressPercent = (this.currentLevel / GAME_LEVELS.totalLevels) * 100;
        progress.style.width = `${progressPercent}%`;
        
        startBtn.textContent = `▶️ Jugar Nivel ${this.currentLevel}`;
    }

    applyTheme() {
        const categoria = this.levelData.categoria;
        const theme = CATEGORY_THEMES[categoria];
        const patternEl = document.getElementById('themePattern');
        const badge = document.getElementById('levelBadge');
        
        // Fondo según categoría
        if (theme) {
            document.body.style.background = theme.background;
        }
        
        // TAREA 1: Icono gigante PRO con glow dinámico
        if (patternEl) {
            patternEl.textContent = this.levelData.icono; // SIEMPRE usar icono del nivel
            patternEl.style.opacity = '0.06';
            patternEl.style.fontSize = '180px';
            patternEl.style.filter = 'drop-shadow(0 0 15px rgba(255,255,255,0.18))';
        }
        
        // TAREA 1: Glow dinámico en badge según color del nivel
        if (badge) {
            badge.style.boxShadow = `0 0 20px ${this.levelData.color}`;
        }
        
        // Iniciar animación de iconos rotativos
        this.startPatternAnimation();
    }

    startPatternAnimation() {
        const categoria = this.levelData.categoria;
        const theme = CATEGORY_THEMES[categoria];
        const patternEl = document.getElementById('themePattern');
        
        if (!theme || !patternEl || !theme.emoji) return;
        
        // Limpiar intervalo anterior si existe
        if (this.patternInterval) {
            clearInterval(this.patternInterval);
        }
        
        // Obtener emojis de la categoría
        const emojis = theme.emoji.match(/./gu) || []; // Usar match para emojis multi-byte
        if (emojis.length <= 1) return;
        
        let index = 0;
        
        // Rotar emoji cada 3 segundos
        this.patternInterval = setInterval(() => {
            index = (index + 1) % emojis.length;
            patternEl.textContent = emojis[index];
            
            // Pequeña animación de cambio
            patternEl.style.animation = 'none';
            void patternEl.offsetWidth; // Forzar reflow
            patternEl.style.animation = 'patternPulse 0.5s ease';
        }, 3000);
    }

    stopPatternAnimation() {
        if (this.patternInterval) {
            clearInterval(this.patternInterval);
            this.patternInterval = null;
        }
    }

    createGrid() {
        this.grid = Array(this.gridSize).fill(null).map(() => 
            Array(this.gridSize).fill('')
        );
        
        this.words.forEach(word => {
            this.placeWord(word);
        });
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === '') {
                    this.grid[i][j] = this.getRandomLetter();
                }
            }
        }
        
        this.renderGrid();
        this.renderWordsList();
    }

    placeWord(word) {
        let directions = [];
        
        if (this.difficulty === 'easy') {
            directions = [
                { dx: 0, dy: 1 },
                { dx: 1, dy: 0 }
            ];
        } else if (this.difficulty === 'normal') {
            directions = [
                { dx: 0, dy: 1 },
                { dx: 1, dy: 0 },
                { dx: 1, dy: 1 },
                { dx: 1, dy: -1 }
            ];
        } else {
            directions = [
                { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
                { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
            ];
        }
        
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const startX = Math.floor(Math.random() * this.gridSize);
            const startY = Math.floor(Math.random() * this.gridSize);
            
            if (this.canPlaceWord(word, startX, startY, dir)) {
                for (let i = 0; i < word.length; i++) {
                    const x = startX + (dir.dx * i);
                    const y = startY + (dir.dy * i);
                    this.grid[x][y] = word[i];
                }
                placed = true;
            }
            attempts++;
        }
    }

    canPlaceWord(word, startX, startY, dir) {
        for (let i = 0; i < word.length; i++) {
            const x = startX + (dir.dx * i);
            const y = startY + (dir.dy * i);
            
            if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
                return false;
            }
            
            if (this.grid[x][y] !== '' && this.grid[x][y] !== word[i]) {
                return false;
            }
        }
        return true;
    }

    getRandomLetter() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return letters[Math.floor(Math.random() * letters.length)];
    }

    renderGrid() {
        const gridElement = document.getElementById('letterGrid');
        gridElement.innerHTML = '';
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'letter-cell';
                cell.textContent = this.grid[i][j];
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                cell.addEventListener('mousedown', (e) => this.startSelection(e));
                cell.addEventListener('mouseenter', (e) => this.continueSelection(e));
                cell.addEventListener('mouseup', () => this.endSelection());
                
                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.startSelection(e);
                });
                cell.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (element && element.classList.contains('letter-cell')) {
                        this.continueSelection({target: element});
                    }
                });
                cell.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.endSelection();
                });
                
                gridElement.appendChild(cell);
            }
        }
    }

    renderWordsList() {
        const listElement = document.getElementById('wordsList');
        listElement.innerHTML = '';
        
        this.words.forEach(word => {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';
            wordItem.textContent = word;
            
            if (this.foundWords.includes(word)) {
                wordItem.classList.add('found');
            }
            
            listElement.appendChild(wordItem);
        });
    }

    startSelection(e) {
        if (!this.isPlaying) return;
        
        this.selectedCells = [];
        const cell = e.target.closest('.letter-cell');
        if (cell) this.selectCell(cell);
    }

    continueSelection(e) {
        if (!this.isPlaying || this.selectedCells.length === 0) return;
        
        const cell = e.target.closest('.letter-cell');
        if (!cell) return;
        
        this.selectCell(cell);
    }

    selectCell(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const key = `${row}-${col}`;
        
        if (!this.selectedCells.find(c => c.key === key)) {
            this.selectedCells.push({ row, col, key, element: cell });
            cell.classList.add('selected');
            this.updateCurrentWord();
            
            // Sonido de click (TAREA 3)
            window.audioManager?.play('click');
        }
    }

    updateCurrentWord() {
        const word = this.selectedCells.map(c => 
            this.grid[c.row][c.col]
        ).join('');
        
        document.getElementById('currentWord').textContent = word || '...';
    }

    endSelection() {
        if (!this.isPlaying || this.selectedCells.length === 0) return;
        
        const selectedWord = this.selectedCells.map(c => 
            this.grid[c.row][c.col]
        ).join('');
        
        // Comprobar palabra normal
        if (this.words.includes(selectedWord) && !this.foundWords.includes(selectedWord)) {
            this.foundWord(selectedWord);
        }
        // Comprobar palabra oculta (TAREA 1)
        else if (this.hiddenWord && selectedWord === this.hiddenWord && !this.hiddenWordFound) {
            this.hiddenWordFound = true;
            this.handleHiddenWordFound();
        }
        
        this.clearSelection();
    }

    foundWord(word) {
        this.foundWords.push(word);
        this.score += word.length * 10;
        
        this.selectedCells.forEach((cell, index) => {
            setTimeout(() => {
                cell.element.classList.add('found');
                this.createParticle(cell.element);
            }, index * 50);
        });
        
        // Sonido de palabra encontrada (TAREA 3)
        window.audioManager?.play('word');
        
        this.updateUI();
        this.renderWordsList();
        
        if (this.foundWords.length === this.words.length) {
            setTimeout(() => this.levelComplete(), 1000);
        }
    }

    handleHiddenWordFound() {
        // Recompensa de monedas (TAREA 1)
        if (window.coinsManager) {
            window.coinsManager.addCoins(100, "Palabra secreta encontrada");
        }
        
        // Bonus de puntos
        this.score += 100;
        
        // Animación especial
        const badge = document.createElement('div');
        badge.className = 'hidden-word-badge';
        badge.innerHTML = '💎 ¡Palabra secreta! +100 puntos';
        document.body.appendChild(badge);
        
        setTimeout(() => badge.remove(), 2000);
        
        // Sonido especial (TAREA 3)
        window.audioManager?.play('hiddenWord');
        
        // Guardar estadística global
        const totalHidden = parseInt(localStorage.getItem('wsHiddenWordsFound') || '0', 10);
        localStorage.setItem('wsHiddenWordsFound', String(totalHidden + 1));
        
        // Efecto visual en las celdas seleccionadas
        this.selectedCells.forEach((cell, index) => {
            setTimeout(() => {
                cell.element.classList.add('found');
                cell.element.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
                this.createParticle(cell.element);
            }, index * 50);
        });
        
        this.updateUI();
    }

    createParticle(element) {
        const rect = element.getBoundingClientRect();
        const emojis = ['⭐', '✨', '💫', '🌟', '⚡'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        // Usar pool de partículas
        const particleObj = this.getParticleFromPool();
        
        if (particleObj) {
            const particle = particleObj.element;
            particle.textContent = emoji;
            particle.style.display = 'block';
            particle.style.left = rect.left + rect.width / 2 + 'px';
            particle.style.top = rect.top + rect.height / 2 + 'px';
            particle.style.animation = 'none';
            
            // Forzar reflow para reiniciar animación
            void particle.offsetWidth;
            particle.style.animation = 'particleFloat 1s ease-out forwards';
            
            setTimeout(() => {
                this.releaseParticle(particleObj);
            }, 1000);
        }
    }

    clearSelection() {
        this.selectedCells.forEach(cell => {
            if (!cell.element.classList.contains('found')) {
                cell.element.classList.remove('selected');
            }
        });
        this.selectedCells = [];
        document.getElementById('currentWord').textContent = '...';
    }

    toggleStart() {
        if (this.isPlaying) {
            this.restart();
        } else {
            this.start();
        }
    }

    start() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.timeLeft = this.timeLimit;
        this.score = 0;
        this.foundWords = [];
        
        this.createGrid();
        this.updateUI();
        
        const startBtn = document.getElementById('startBtn');
        startBtn.textContent = '🔄 Reiniciar';
        startBtn.classList.add('playing');
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateUI();
            
            if (this.timeLeft <= 20) {
                document.getElementById('timer').classList.add('warning');
                // Sonido de advertencia (TAREA 3)
                if (this.timeLeft === 20) {
                    window.audioManager?.play('timeWarning');
                }
            }
            
            if (this.timeLeft <= 0) {
                this.gameOver(false);
            }
        }, 1000);
    }

    updateUI() {
        document.getElementById('timer').textContent = this.timeLeft;
        document.getElementById('wordsFound').textContent = 
            `${this.foundWords.length}/${this.words.length}`;
        document.getElementById('score').textContent = this.score;
    }

    levelComplete() {
        this.isPlaying = false;
        clearInterval(this.timer);
        
        // Sonido de nivel completado (TAREA 3)
        window.audioManager?.play('levelComplete');
        
        // Actualizar nivel máximo
        if (this.currentLevel >= this.maxLevelUnlocked) {
            this.maxLevelUnlocked = this.currentLevel + 1;
            localStorage.setItem('wordSnapMaxLevel', this.maxLevelUnlocked);
        }
        
        // Actualizar métricas de progreso (TAREA 4)
        this.updateMetaProgress({
            score: this.score,
            wordsFound: this.foundWords.length,
            wordsTotal: this.words.length,
            timeUsed: this.timeLimit - this.timeLeft
        });
        
        this.showModal(true);
        this.createConfetti();
    }

    updateMetaProgress(stats) {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const lastDay = localStorage.getItem('wordSnapLastDay');
        
        // Días jugados
        const daysPlayed = parseInt(localStorage.getItem('wordSnapDaysPlayed') || '0', 10);
        if (lastDay !== today) {
            localStorage.setItem('wordSnapDaysPlayed', String(daysPlayed + 1));
            localStorage.setItem('wordSnapLastDay', today);
        }
        
        // Racha
        if (lastDay) {
            const diff = Math.floor((new Date(today) - new Date(lastDay)) / (1000 * 60 * 60 * 24));
            let streak = parseInt(localStorage.getItem('wordSnapStreak') || '0', 10);
            
            if (diff === 1) {
                // Día consecutivo
                streak++;
            } else if (diff > 1) {
                // Saltó días, reset
                streak = 1;
            } else if (diff === 0) {
                // Mismo día
                streak = streak || 1;
            }
            
            localStorage.setItem('wordSnapStreak', String(streak));
        } else {
            localStorage.setItem('wordSnapStreak', '1');
        }
        
        // Récord de puntuación
        const maxScore = parseInt(localStorage.getItem('wordSnapMaxScore') || '0', 10);
        if (stats.score > maxScore) {
            localStorage.setItem('wordSnapMaxScore', String(stats.score));
        }
        
        // Stats globales (TAREA 4)
        const totalWords = parseInt(localStorage.getItem('wsTotalWordsFound') || '0', 10);
        localStorage.setItem('wsTotalWordsFound', String(totalWords + stats.wordsFound));
        
        const totalLevels = parseInt(localStorage.getItem('wsTotalLevelsCompleted') || '0', 10);
        localStorage.setItem('wsTotalLevelsCompleted', String(totalLevels + 1));
        
        const totalTime = parseInt(localStorage.getItem('wsTotalTimePlayed') || '0', 10);
        localStorage.setItem('wsTotalTimePlayed', String(totalTime + stats.timeUsed));
    }

    getPlayerProfile() {
        return {
            id: this.playerId,
            maxLevel: this.maxLevelUnlocked,
            maxScore: parseInt(localStorage.getItem('wordSnapMaxScore') || '0', 10),
            daysPlayed: parseInt(localStorage.getItem('wordSnapDaysPlayed') || '0', 10),
            streak: parseInt(localStorage.getItem('wordSnapStreak') || '0', 10),
            totalWords: parseInt(localStorage.getItem('wsTotalWordsFound') || '0', 10),
            totalLevels: parseInt(localStorage.getItem('wsTotalLevelsCompleted') || '0', 10),
            totalTime: parseInt(localStorage.getItem('wsTotalTimePlayed') || '0', 10),
            hiddenWordsFound: parseInt(localStorage.getItem('wsHiddenWordsFound') || '0', 10)
        };
    }

    gameOver(won) {
        this.isPlaying = false;
        clearInterval(this.timer);
        this.showModal(won);
    }

    showModal(won) {
        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('modalTitle');
        const badge = document.getElementById('completeBadge');
        const finalScore = document.getElementById('finalScore');
        const message = document.getElementById('resultMessage');
        const nextBtn = document.getElementById('nextLevelBtn');
        
        if (won) {
            title.textContent = '🎉 ¡Nivel Completado!';
            badge.textContent = `✅ Nivel ${this.currentLevel} superado`;
            badge.style.display = 'inline-block';
            message.textContent = `¡Increíble! Encontraste todas las palabras en ${this.timeLimit - this.timeLeft}s`;
            
            if (this.currentLevel < GAME_LEVELS.totalLevels) {
                nextBtn.style.display = 'block';
                nextBtn.textContent = `➡️ Nivel ${this.currentLevel + 1}`;
            } else {
                nextBtn.style.display = 'none';
            }
        } else {
            title.textContent = '⏰ Tiempo Agotado';
            badge.style.display = 'none';
            message.textContent = `Encontraste ${this.foundWords.length}/${this.words.length} palabras`;
            nextBtn.style.display = 'none';
        }
        
        finalScore.textContent = this.score;
        
        document.getElementById('wordsFoundMetric').textContent = 
            `${this.foundWords.length}/${this.words.length}`;
        document.getElementById('timeUsedMetric').textContent = 
            `${this.timeLimit - this.timeLeft}s`;
        
        // Mostrar métricas actualizadas
        const daysPlayed = parseInt(localStorage.getItem('wordSnapDaysPlayed') || '0', 10);
        const streak = parseInt(localStorage.getItem('wordSnapStreak') || '0', 10);
        const maxScore = parseInt(localStorage.getItem('wordSnapMaxScore') || '0', 10);
        
        document.getElementById('maxLevelMetric').textContent = this.maxLevelUnlocked;
        
        // Actualizar si existen estos elementos
        const streakEl = document.getElementById('streakMetric');
        const daysEl = document.getElementById('daysPlayedMetric');
        const maxScoreEl = document.getElementById('maxScoreMetric');
        
        if (streakEl) streakEl.textContent = `${streak} 🔥`;
        if (daysEl) daysEl.textContent = daysPlayed;
        if (maxScoreEl) maxScoreEl.textContent = maxScore;
        
        modal.classList.add('show');
    }

    nextLevel() {
        const modal = document.getElementById('gameOverModal');
        modal.classList.remove('show');
        
        this.stopPatternAnimation(); // Limpiar animación anterior
        
        this.currentLevel++;
        localStorage.setItem('wordSnapLevel', this.currentLevel);
        
        this.loadLevel(this.currentLevel);
        this.createGrid();
        this.updateUI();
        this.applyTheme(); // Aplicar nuevo tema con animación
        
        const startBtn = document.getElementById('startBtn');
        startBtn.textContent = `▶️ Jugar Nivel ${this.currentLevel}`;
        startBtn.classList.remove('playing');
    }

    restart() {
        const modal = document.getElementById('gameOverModal');
        modal.classList.remove('show');
        
        this.isPlaying = false;
        clearInterval(this.timer);
        this.stopPatternAnimation();
        
        document.getElementById('timer').classList.remove('warning');
        
        const startBtn = document.getElementById('startBtn');
        startBtn.textContent = `▶️ Jugar Nivel ${this.currentLevel}`;
        startBtn.classList.remove('playing');
        
        this.createGrid();
        this.updateUI();
        this.applyTheme(); // Reiniciar animación de pattern
    }

    setDifficulty(level, ev) {
        if (this.isPlaying) {
            alert('No puedes cambiar la dificultad durante el juego');
            return;
        }
        
        this.difficulty = level;
        
        // Recalcular tiempo y grid SOLO en función del nivel + dificultad
        // (el tamaño del grid depende ahora del nivel y de las palabras)
        this.configureGridForCurrentLevel();
        
        // Actualizar botones activos
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (ev && ev.currentTarget) {
            ev.currentTarget.classList.add('active');
        }
        
        this.updateUI();
        this.createGrid();
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode);
        this.applyDarkMode();
    }

    applyDarkMode() {
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    createConfetti() {
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
                       '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', 
                       '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                document.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), 3000);
            }, i * 30);
        }
    }

    // === SISTEMA DE COMPARTIR Y RETOS ===
    
    shareScore() {
        const levelConfig = this.levelData;
        const grid = this.generateShareGrid();
        
        const text = [
            `🔤 Word Snap – Nivel ${levelConfig.nivel}`,
            `${levelConfig.icono} ${levelConfig.tema}`,
            ``,
            `⭐ Puntuación: ${this.score}`,
            `📝 Palabras: ${this.foundWords.length}/${this.words.length}`,
            `⏱️ Tiempo: ${this.timeLimit - this.timeLeft}s`,
            `😊 Dificultad: ${this.difficulty}`,
            ``,
            grid,
            ``,
            `🎮 Juega aquí:`,
            window.location.origin + window.location.pathname
        ].join('\n');
        
        if (navigator.share) {
            navigator.share({
                title: 'Word Snap',
                text: text
            }).catch(() => {
                this.copyToClipboard(text);
            });
        } else {
            this.copyToClipboard(text);
        }
    }

    challengeFriend() {
        const levelConfig = this.levelData;
        const seed = this.challengeSeed || Math.floor(Math.random() * 1e9);
        
        const url = new URL(window.location.href);
        url.searchParams.set('challengeLevel', String(this.currentLevel));
        url.searchParams.set('challengeSeed', String(seed));
        
        const text = [
            `🎯 ¡Te reto en Word Snap!`,
            ``,
            `${levelConfig.icono} Nivel ${this.currentLevel}: ${levelConfig.tema}`,
            `⭐ Mi puntuación: ${this.score} puntos`,
            `📝 Palabras: ${this.foundWords.length}/${this.words.length}`,
            ``,
            `¿Puedes superarme? 🔥`,
            ``,
            url.toString()
        ].join('\n');
        
        if (navigator.share) {
            navigator.share({
                title: 'Desafío Word Snap',
                text: text,
                url: url.toString()
            }).catch(() => {
                this.copyToClipboard(text);
            });
        } else {
            this.copyToClipboard(text);
        }
    }

    generateShareGrid() {
        const rows = Math.ceil(this.words.length / 5);
        let grid = '';
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < 5; col++) {
                const index = row * 5 + col;
                if (index < this.words.length) {
                    grid += this.foundWords.includes(this.words[index]) ? '🟩' : '⬛';
                }
            }
            grid += '\n';
        }
        
        return grid.trim();
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('✅ Copiado al portapapeles');
        }).catch(() => {
            alert('Texto copiado:\n\n' + text);
        });
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 10000;
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // === SELECTOR DE NIVELES (TAREA 5) ===
    
    initLevelSelector() {
        const btn = document.getElementById('levelSelectBtn');
        const modal = document.getElementById('levelSelectorModal');
        const closeBtn = document.getElementById('closeLevelSelect');
        
        if (!btn || !modal) return;
        
        btn.addEventListener('click', () => {
            this.renderLevelCards();
            modal.classList.add('show');
        });
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.classList.remove('show'));
        }
    }

    renderLevelCards() {
        const grid = document.getElementById('levelSelectorGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        GAME_LEVELS.levels.forEach(level => {
            const card = document.createElement('div');
            const unlocked = level.nivel <= this.maxLevelUnlocked;
            card.className = 'level-card ' + (unlocked ? 'unlocked' : 'locked');
            
            if (level.nivel === this.currentLevel) {
                card.classList.add('current');
            }
            
            card.style.background = unlocked ? level.color : '#f5f5f5';
            card.dataset.category = level.categoria;
            
            card.innerHTML = `
                <div class="level-icon">${unlocked ? level.icono : '🔒'}</div>
                <div class="level-number">${level.nivel}</div>
            `;
            
            if (unlocked) {
                card.addEventListener('click', () => {
                    this.loadLevel(level.nivel);
                    this.createGrid();
                    this.updateUI();
                    document.getElementById('levelSelectorModal').classList.remove('show');
                });
            }
            
            grid.appendChild(card);
        });
        
        // Actualizar stats
        const completed = this.maxLevelUnlocked - 1;
        const completedEl = document.getElementById('levelsCompleted');
        const totalEl = document.getElementById('totalLevels');
        
        if (completedEl) completedEl.textContent = completed;
        if (totalEl) totalEl.textContent = GAME_LEVELS.totalLevels;
    }
    
    showLevelSelector() {
        const modal = document.getElementById('levelSelectorModal');
        const grid = document.getElementById('levelSelectorGrid');
        
        // Actualizar estadísticas
        const completed = this.maxLevelUnlocked - 1;
        document.getElementById('levelsCompleted').textContent = completed;
        document.getElementById('totalLevels').textContent = GAME_LEVELS.totalLevels;
        
        // Generar grid de niveles
        grid.innerHTML = '';
        
        GAME_LEVELS.levels.forEach(level => {
            const card = document.createElement('div');
            card.className = 'level-card';
            
            const isLocked = level.nivel > this.maxLevelUnlocked;
            const isCurrent = level.nivel === this.currentLevel;
            const isCompleted = level.nivel < this.maxLevelUnlocked;
            
            if (isLocked) {
                card.classList.add('locked');
            }
            if (isCurrent) {
                card.classList.add('current');
            }
            if (isCompleted) {
                card.classList.add('completed');
            }
            
            card.dataset.level = level.nivel;
            card.dataset.category = level.categoria;
            
            card.innerHTML = `
                <div class="level-icon">${isLocked ? '🔒' : level.icono}</div>
                <div class="level-number">${level.nivel}</div>
                <div class="level-category-badge">${level.categoria.split(' ')[0]}</div>
            `;
            
            if (!isLocked) {
                card.onclick = () => this.selectLevel(level.nivel);
                card.title = `${level.icono} ${level.tema}`;
            } else {
                card.title = 'Nivel bloqueado';
            }
            
            grid.appendChild(card);
        });
        
        modal.classList.add('show');
    }

    closeLevelSelector() {
        const modal = document.getElementById('levelSelectorModal');
        modal.classList.remove('show');
    }

    selectLevel(levelNumber) {
        if (levelNumber > this.maxLevelUnlocked) {
            alert('Este nivel aún está bloqueado. Completa los niveles anteriores primero.');
            return;
        }
        
        this.closeLevelSelector();
        
        this.stopPatternAnimation(); // Limpiar animación anterior
        
        // Cargar el nivel seleccionado
        this.currentLevel = levelNumber;
        localStorage.setItem('wordSnapLevel', this.currentLevel);
        
        this.loadLevel(this.currentLevel);
        this.createGrid();
        this.updateUI();
        this.applyTheme(); // Aplicar nuevo tema con animación
        
        const startBtn = document.getElementById('startBtn');
        startBtn.textContent = `▶️ Jugar Nivel ${this.currentLevel}`;
        startBtn.classList.remove('playing');
    }

    filterLevels(category, ev) {
        const cards = document.querySelectorAll('.level-card');
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        // Actualizar botones activos
        filterBtns.forEach(btn => btn.classList.remove('active'));
        
        if (ev && ev.currentTarget) {
            ev.currentTarget.classList.add('active');
        }
        
        // Filtrar niveles
        cards.forEach(card => {
            if (category === 'all') {
                card.style.display = 'flex';
            } else {
                if (card.dataset.category === category) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    }
}

// Inicializar juego
const game = new WordSnapCampaign();
