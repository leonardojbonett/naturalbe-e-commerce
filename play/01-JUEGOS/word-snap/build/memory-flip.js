// Memory Flip - Lógica del Juego V2
// Adaptado al nuevo HTML con modal de resultados

class MemoryGame {
    constructor() {
        this.difficulty = 'EASY';
        this.cards = [];
        this.flippedCards = [];
        this.moves = 0;
        this.matches = 0;
        this.totalPairs = 0;
        this.timer = null;
        this.seconds = 0;
        this.timeLimit = null;
        this.isProcessing = false;
        this.xpEarned = 0;
        this.coinsEarned = 0;
        this.perfectGame = true;
        this.lastMatchTime = null;

        // Soporte para sets definidos en memory-data.js
        this.availableSets = typeof CARD_SETS !== 'undefined' ? Object.keys(CARD_SETS) : [];
        this.currentSetKey = this.availableSets.includes('NATURE')
            ? 'NATURE'
            : (this.availableSets[0] || null);

        this.init();
    }

    init() {
        // Inicializar sistemas globales
        if (typeof xpManager !== 'undefined') {
            xpManager.updateUI();
        }
        if (typeof coinsManager !== 'undefined') {
            coinsManager.updateCoinsDisplay();
        }

        // Arrancamos directamente el juego (no hay pantallas start/game/results)
        this.startGame();
    }

    // --- Utilidades internas ---

    getDifficultyConfig() {
        return DIFFICULTY_LEVELS[this.difficulty];
    }

    getCurrentSetKey() {
        if (!this.currentSetKey && this.availableSets.length > 0) {
            this.currentSetKey = this.availableSets[0];
        }
        return this.currentSetKey;
    }

    // --- Dificultad y sets ---

    setDifficulty(levelSlug, ev) {
        // levelSlug viene en minúsculas desde el HTML ('easy', 'medium', 'hard')
        const key = levelSlug.toUpperCase();
        if (!DIFFICULTY_LEVELS[key]) return;

        this.difficulty = key;

        // Actualizar estilos de botones de dificultad
        const btnIds = ['easyBtn', 'mediumBtn', 'hardBtn'];
        btnIds.forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            if (id === `${levelSlug}Btn`) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Reiniciar partida con nueva dificultad
        this.restart();
    }

    previousSet() {
        if (!this.availableSets.length) return;
        const current = this.getCurrentSetKey();
        const idx = this.availableSets.indexOf(current);
        const newIdx = (idx - 1 + this.availableSets.length) % this.availableSets.length;
        this.currentSetKey = this.availableSets[newIdx];
        this.updateSetTagUI();
        this.restart();
    }

    nextSet() {
        if (!this.availableSets.length) return;
        const current = this.getCurrentSetKey();
        const idx = this.availableSets.indexOf(current);
        const newIdx = (idx + 1) % this.availableSets.length;
        this.currentSetKey = this.availableSets[newIdx];
        this.updateSetTagUI();
        this.restart();
    }

    updateSetTagUI() {
        const key = this.getCurrentSetKey();
        if (!key || typeof CARD_SETS === 'undefined') return;
        const set = CARD_SETS[key];
        if (!set) return;

        const emoji = set.icons && set.icons.length ? set.icons[0] : '🎴';

        const setTag = document.getElementById('setTag');
        if (setTag) {
            setTag.innerHTML = `<span>${emoji}</span> ${set.name}`;
        }

        const pattern = document.getElementById('themePattern');
        if (pattern) {
            pattern.textContent = emoji;
        }
    }

    // --- Ciclo del juego ---

    startGame() {
        // Resetear estado
        this.stopTimer();
        this.moves = 0;
        this.matches = 0;
        this.seconds = 0;
        this.flippedCards = [];
        this.isProcessing = false;
        this.xpEarned = 0;
        this.coinsEarned = 0;
        this.perfectGame = true;
        this.lastMatchTime = null;

        const config = this.getDifficultyConfig();
        if (!config) return;

        this.totalPairs = config.pairs;
        this.timeLimit = config.timeLimit;

        // Generar cartas usando el set actual (o aleatorio si algo falla)
        let setKey = this.getCurrentSetKey();
        if (!setKey) {
            if (typeof getRandomSet === 'function') {
                setKey = getRandomSet();
            }
        }
        this.currentSetKey = setKey;

        if (typeof getRandomCards === 'function') {
            this.cards = getRandomCards(this.difficulty, setKey);
        } else {
            this.cards = [];
        }

        // Configurar grid
        const grid = document.getElementById('cardsGrid');
        if (grid) {
            grid.className = `cards-grid ${this.difficulty.toLowerCase()}`;
        }

        // Renderizar cartas
        this.renderCards();

        // Stats iniciales
        this.updateStats();
        this.updateTimer(); // 0:00 en pantalla

        // Iniciar timer
        this.startTimer();

        // Ocultar modal de resultados si estaba visible
        const modal = document.getElementById('memoryResultsModal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Audio de inicio
        if (typeof audioManager !== 'undefined') {
            audioManager.play('start');
        }

        // Actualizar UI de set
        this.updateSetTagUI();
    }

    renderCards() {
        const grid = document.getElementById('cardsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.id = index;

            // 🔹 NUEVO: estructura con .card-inner para que funcione el flip 3D
            cardElement.innerHTML = `
                <div class="card-inner">
                    <div class="card-face card-front">❓</div>
                    <div class="card-face card-back">${card.icon}</div>
                </div>
            `;

            cardElement.addEventListener('click', () => this.flipCard(index));
            grid.appendChild(cardElement);
        });

        // Ajustar clase de grid según dificultad
        grid.className = 'cards-grid ' + this.difficulty.toLowerCase();
    }

    flipCard(index) {
        if (this.isProcessing) return;
        if (!this.cards[index]) return;
        if (this.cards[index].isFlipped) return;
        if (this.cards[index].isMatched) return;
        if (this.flippedCards.length >= 2) return;

        this.cards[index].isFlipped = true;
        this.flippedCards.push(index);

        const cardElement = document.querySelector(`[data-id="${index}"]`);
        if (cardElement) {
            cardElement.classList.add('flipped');
        }

        if (typeof audioManager !== 'undefined') {
            audioManager.play('click');
        }

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateStats();
            this.checkMatch();
        }
    }

    checkMatch() {
        this.isProcessing = true;

        const [index1, index2] = this.flippedCards;
        const card1 = this.cards[index1];
        const card2 = this.cards[index2];

        if (card1.icon === card2.icon) {
            setTimeout(() => this.handleMatch(index1, index2), 400);
        } else {
            this.perfectGame = false;
            setTimeout(() => this.handleNoMatch(index1, index2), 700);
        }
    }

    handleMatch(index1, index2) {
        this.cards[index1].isMatched = true;
        this.cards[index2].isMatched = true;
        this.matches++;

        const card1El = document.querySelector(`[data-id="${index1}"]`);
        const card2El = document.querySelector(`[data-id="${index2}"]`);

        [card1El, card2El].forEach(el => {
            if (el) {
                el.classList.add('matched', 'correct');
                setTimeout(() => el.classList.remove('correct'), 300);
            }
        });

        if (typeof audioManager !== 'undefined') {
            audioManager.play('correct');
        }

        this.xpEarned += 1;

        if (this.lastMatchTime && (Date.now() - this.lastMatchTime) < 1000) {
            this.coinsEarned += 5;
        }
        this.lastMatchTime = Date.now();

        this.flippedCards = [];
        this.isProcessing = false;
        this.updateStats();

        if (this.matches === this.totalPairs) {
            setTimeout(() => this.endGame(true), 500);
        }
    }

    handleNoMatch(index1, index2) {
        this.cards[index1].isFlipped = false;
        this.cards[index2].isFlipped = false;

        const card1El = document.querySelector(`[data-id="${index1}"]`);
        const card2El = document.querySelector(`[data-id="${index2}"]`);

        [card1El, card2El].forEach(el => {
            if (el) {
                el.classList.add('wrong');
            }
        });

        if (typeof audioManager !== 'undefined') {
            audioManager.play('wrong');
        }

        setTimeout(() => {
            [card1El, card2El].forEach(el => {
                if (el) {
                    el.classList.remove('flipped', 'wrong');
                }
            });
            this.flippedCards = [];
            this.isProcessing = false;
        }, 500);
    }

    startTimer() {
        this.stopTimer();
        this.timer = setInterval(() => {
            this.seconds++;
            this.updateTimer();

            if (this.timeLimit && this.seconds >= this.timeLimit) {
                this.endGame(false);
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateTimer() {
        const minutes = Math.floor(this.seconds / 60);
        const secs = this.seconds % 60;
        const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;

        const timerEl = document.getElementById('memoryTime');
        if (timerEl) {
            timerEl.textContent = timeStr;

            // Warning si queda poco tiempo
            if (this.timeLimit && this.seconds >= this.timeLimit - 30) {
                timerEl.classList.add('warning');
            } else {
                timerEl.classList.remove('warning');
            }
        }
    }

    updateStats() {
        const movesEl = document.getElementById('memoryMoves');
        const pairsEl = document.getElementById('memoryPairs');

        if (movesEl) movesEl.textContent = this.moves;
        if (pairsEl) pairsEl.textContent = `${this.matches}/${this.totalPairs}`;
    }

    endGame(won) {
        this.stopTimer();

        let score = 0;
        if (won) {
            score = 1000;
            score -= (this.moves * 10);
            score -= (this.seconds * 2);
            score = Math.max(score, 100);

            if (this.difficulty === 'MEDIUM') score *= 1.5;
            if (this.difficulty === 'HARD') score *= 2;

            score = Math.floor(score);
        }

        this.xpEarned += 50;
        this.coinsEarned += 25;

        if (this.perfectGame) {
            this.xpEarned += 25;
            this.coinsEarned += 15;
        }

        if (this.difficulty === 'MEDIUM') {
            this.xpEarned = Math.floor(this.xpEarned * 1.5);
            this.coinsEarned = Math.floor(this.coinsEarned * 1.5);
        }
        if (this.difficulty === 'HARD') {
            this.xpEarned = Math.floor(this.xpEarned * 2);
            this.coinsEarned = Math.floor(this.coinsEarned * 2);
        }

        if (typeof xpManager !== 'undefined') {
            xpManager.addXP(this.xpEarned);
        }
        if (typeof coinsManager !== 'undefined') {
            coinsManager.addCoins(this.coinsEarned);
        }

        this.checkAchievements();
        this.showResults(won, score);

        if (typeof audioManager !== 'undefined') {
            audioManager.play(won ? 'win' : 'lose');
        }
    }

    checkAchievements() {
        if (typeof achievementsManager === 'undefined') return;

        const stats = achievementsManager.getStats();

        stats.memoryGamesPlayed = (stats.memoryGamesPlayed || 0) + 1;
        stats.memoryTotalMoves = (stats.memoryTotalMoves || 0) + this.moves;
        stats.memoryTotalMatches = (stats.memoryTotalMatches || 0) + this.matches;

        if (this.perfectGame) {
            stats.memoryPerfectGames = (stats.memoryPerfectGames || 0) + 1;
        }

        if (this.seconds < 30) {
            stats.memoryFastGames = (stats.memoryFastGames || 0) + 1;
        }

        achievementsManager.saveStats(stats);

        achievementsManager.checkAchievement('first_memory');

        if (this.perfectGame) {
            achievementsManager.checkAchievement('memory_perfect');
        }

        if (this.seconds < 30) {
            achievementsManager.checkAchievement('memory_fast');
        }

        if (stats.memoryTotalMoves >= 300) {
            achievementsManager.checkAchievement('memory_300_moves');
        }
    }

    showResults(won, score) {
        const minutes = Math.floor(this.seconds / 60);
        const secs = this.seconds % 60;
        const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;

        const accuracy = this.moves > 0
            ? Math.round((this.totalPairs / this.moves) * 100)
            : 100;

        // Actualizar estadísticas globales del jugador
        if (typeof globalPlayer !== 'undefined') {
            globalPlayer.incrementGameStat('memoryFlip', 'gamesPlayed', 1);

            const currentBest = globalPlayer.profile.memoryFlip.bestTime;
            if (!currentBest || this.seconds < currentBest) {
                globalPlayer.updateGameStat('memoryFlip', 'bestTime', this.seconds);
            }

            const currentBestMoves = globalPlayer.profile.memoryFlip.bestMoves;
            if (!currentBestMoves || this.moves < currentBestMoves) {
                globalPlayer.updateGameStat('memoryFlip', 'bestMoves', this.moves);
            }
        }

        // Icono y textos
        const iconEl = document.getElementById('resultsIcon');
        if (iconEl) iconEl.textContent = won ? '🎉' : '⏰';

        const titleEl = document.getElementById('resultsTitle');
        if (titleEl) titleEl.textContent = won ? '¡Reto completado!' : 'Tiempo agotado';

        const summaryEl = document.getElementById('resultsSummary');
        if (summaryEl) {
            summaryEl.textContent = won
                ? `Encontraste todas las parejas en ${timeStr} con ${this.moves} movimientos.`
                : `Te faltaron parejas por descubrir. Intenta de nuevo para mejorar tu tiempo.`;
        }

        // Métricas principales
        const timeVal = document.getElementById('resultTimeValue');
        if (timeVal) timeVal.textContent = timeStr;

        const movesVal = document.getElementById('resultMovesValue');
        if (movesVal) movesVal.textContent = this.moves;

        const scoreVal = document.getElementById('resultScoreValue');
        if (scoreVal) scoreVal.textContent = score;

        // Mejores stats (modal y header)
        const formatTime = (totalSecs) => {
            const m = Math.floor(totalSecs / 60);
            const s = totalSecs % 60;
            return `${m}:${s.toString().padStart(2, '0')}`;
        };

        if (typeof globalPlayer !== 'undefined') {
            const bestTime = globalPlayer.profile.memoryFlip.bestTime;
            const bestMoves = globalPlayer.profile.memoryFlip.bestMoves;

            const bestTimeModal = document.getElementById('resultsBestTime');
            const bestMovesModal = document.getElementById('resultsBestMoves');
            const bestTimeHeader = document.getElementById('bestTimeText');
            const bestMovesHeader = document.getElementById('bestMovesText');

            if (bestTime != null) {
                const txt = formatTime(bestTime);
                if (bestTimeModal) bestTimeModal.textContent = txt;
                if (bestTimeHeader) bestTimeHeader.textContent = txt;
            }

            if (bestMoves != null) {
                if (bestMovesModal) bestMovesModal.textContent = bestMoves;
                if (bestMovesHeader) bestMovesHeader.textContent = bestMoves;
            }
        }

        // Mostrar modal
        const modal = document.getElementById('memoryResultsModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    restart() {
        const modal = document.getElementById('memoryResultsModal');
        if (modal) modal.style.display = 'none';
        this.startGame();
    }

    nextChallenge() {
        const modal = document.getElementById('memoryResultsModal');
        if (modal) modal.style.display = 'none';
        this.startGame(); // Nuevo tablero con misma dificultad / set actual
    }

    shareScore() {
        const minutes = Math.floor(this.seconds / 60);
        const secs = this.seconds % 60;
        const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;

        const text = `🧩 ¡Completé Memory Flip!
⏱️ Tiempo: ${timeStr}
🔄 Movimientos: ${this.moves}
✅ Parejas: ${this.matches}

¡Juega tú también en play.naturalbe.com.co!`;

        if (navigator.share) {
            navigator.share({
                title: 'Memory Flip',
                text: text
            });
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert('¡Resultado copiado al portapapeles!');
            });
        } else {
            alert(text);
        }
    }
}

// Inicializar juego
window.addEventListener('load', () => {
    window.memoryGame = new MemoryGame();
});
