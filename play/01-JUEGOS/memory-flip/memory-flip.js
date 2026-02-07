// Memory Flip - Lógica del Juego V1.0
// Integración completa con sistemas de XP, monedas, logros y audio

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
        this.shopUrl = 'https://naturalbe.com.co/#productos';
        this.gameMeta = { gameId: 'memory-flip', gameName: 'Memory Flip' };
        
        this.init();
    }
    
    init() {
        // Inicializar sistemas
        if (typeof xpManager !== 'undefined') {
            xpManager.updateUI();
        }
        if (typeof coinsManager !== 'undefined') {
            coinsManager.updateCoinsDisplay();
        }
        
        this.showScreen('startScreen');
    }
    
    selectDifficulty(level, ev) {
        this.difficulty = level;
        
        // Actualizar botones
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        const target = ev ? ev.target : event?.target;
        if (target && target.closest) {
            target.closest('.difficulty-btn').classList.add('selected');
        }
    }
    
    startGame() {
        if (window.NBPlayAnalytics) {
            window.NBPlayAnalytics.init(this.gameMeta);
            window.NBPlayAnalytics.track('start_game', { difficulty: this.difficulty });
        }
        // Resetear variables
        this.moves = 0;
        this.matches = 0;
        this.seconds = 0;
        this.flippedCards = [];
        this.isProcessing = false;
        this.xpEarned = 0;
        this.coinsEarned = 0;
        this.perfectGame = true;
        
        // Obtener configuración de dificultad
        const config = DIFFICULTY_LEVELS[this.difficulty];
        this.totalPairs = config.pairs;
        this.timeLimit = config.timeLimit;
        
        // Generar cartas
        const randomSet = getRandomSet();
        this.cards = getRandomCards(this.difficulty, randomSet);
        
        // Mostrar pantalla de juego
        this.showScreen('gameScreen');
        
        // Configurar grid
        const grid = document.getElementById('cardsGrid');
        grid.className = `cards-grid ${this.difficulty.toLowerCase()}`;
        
        // Renderizar cartas
        this.renderCards();
        
        // Actualizar stats
        this.updateStats();
        
        // Iniciar timer
        this.startTimer();
        
        // Sonido de inicio
        if (typeof audioManager !== 'undefined') {
            audioManager.play('start');
        }
    }
    
    renderCards() {
        const grid = document.getElementById('cardsGrid');
        grid.innerHTML = '';
        
        this.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.id = index;
            cardElement.onclick = () => this.flipCard(index);
            
            cardElement.innerHTML = `
                <div class="card-face card-front">❓</div>
                <div class="card-face card-back">${card.icon}</div>
            `;
            
            grid.appendChild(cardElement);
        });
    }
    
    flipCard(index) {
        if (this.isProcessing) return;
        if (this.cards[index].isFlipped) return;
        if (this.cards[index].isMatched) return;
        if (this.flippedCards.length >= 2) return;
        
        // Voltear carta
        this.cards[index].isFlipped = true;
        this.flippedCards.push(index);
        
        const cardElement = document.querySelector(`[data-id="${index}"]`);
        cardElement.classList.add('flipped');
        
        // Sonido de flip
        if (typeof audioManager !== 'undefined') {
            audioManager.play('click');
        }
        
        // Si hay 2 cartas volteadas, verificar match
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
            // Match!
            setTimeout(() => {
                this.handleMatch(index1, index2);
            }, 500);
        } else {
            // No match
            this.perfectGame = false;
            setTimeout(() => {
                this.handleNoMatch(index1, index2);
            }, 1000);
        }
    }
    
    handleMatch(index1, index2) {
        this.cards[index1].isMatched = true;
        this.cards[index2].isMatched = true;
        this.matches++;
        
        const card1El = document.querySelector(`[data-id="${index1}"]`);
        const card2El = document.querySelector(`[data-id="${index2}"]`);
        
        card1El.classList.add('matched');
        card2El.classList.add('matched');
        
        // Sonido de match
        if (typeof audioManager !== 'undefined') {
            audioManager.play('correct');
        }
        
        // XP por match
        this.xpEarned += 1;
        
        // Monedas por match rápido (< 1s desde el último)
        if (this.lastMatchTime && (Date.now() - this.lastMatchTime) < 1000) {
            this.coinsEarned += 5;
        }
        this.lastMatchTime = Date.now();
        
        this.flippedCards = [];
        this.isProcessing = false;
        this.updateStats();
        
        // Verificar si ganó
        if (this.matches === this.totalPairs) {
            setTimeout(() => {
                this.endGame(true);
            }, 500);
        }
    }
    
    handleNoMatch(index1, index2) {
        this.cards[index1].isFlipped = false;
        this.cards[index2].isFlipped = false;
        
        const card1El = document.querySelector(`[data-id="${index1}"]`);
        const card2El = document.querySelector(`[data-id="${index2}"]`);
        
        card1El.classList.add('wrong');
        card2El.classList.add('wrong');
        
        // Sonido de error
        if (typeof audioManager !== 'undefined') {
            audioManager.play('wrong');
        }
        
        setTimeout(() => {
            card1El.classList.remove('flipped', 'wrong');
            card2El.classList.remove('flipped', 'wrong');
            
            this.flippedCards = [];
            this.isProcessing = false;
        }, 500);
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            this.seconds++;
            this.updateTimer();
            
            // Verificar límite de tiempo
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
        
        const timerEl = document.getElementById('timer');
        timerEl.textContent = timeStr;
        
        // Warning si queda poco tiempo
        if (this.timeLimit && this.seconds >= this.timeLimit - 30) {
            timerEl.classList.add('warning');
        } else {
            timerEl.classList.remove('warning');
        }
    }
    
    updateStats() {
        document.getElementById('moves').textContent = this.moves;
        document.getElementById('pairs').textContent = `${this.matches}/${this.totalPairs}`;
    }
    
    endGame(won) {
        this.stopTimer();
        
        // Calcular puntuación
        let score = 0;
        if (won) {
            score = 1000;
            score -= (this.moves * 10); // Penalización por movimientos
            score -= (this.seconds * 2); // Penalización por tiempo
            score = Math.max(score, 100); // Mínimo 100 puntos
            
            // Bonus por dificultad
            if (this.difficulty === 'MEDIUM') score *= 1.5;
            if (this.difficulty === 'HARD') score *= 2;
            
            score = Math.floor(score);
        }
        
        // XP y monedas
        this.xpEarned += 50; // Base por completar
        this.coinsEarned += 25; // Base por completar
        
        if (this.perfectGame) {
            this.xpEarned += 25; // Bonus por perfecto
            this.coinsEarned += 15;
        }
        
        // Aplicar multiplicador por dificultad
        if (this.difficulty === 'MEDIUM') {
            this.xpEarned = Math.floor(this.xpEarned * 1.5);
            this.coinsEarned = Math.floor(this.coinsEarned * 1.5);
        }
        if (this.difficulty === 'HARD') {
            this.xpEarned = Math.floor(this.xpEarned * 2);
            this.coinsEarned = Math.floor(this.coinsEarned * 2);
        }
        
        // Otorgar XP y monedas
        if (typeof xpManager !== 'undefined') {
            xpManager.addXP(this.xpEarned);
        }
        if (typeof coinsManager !== 'undefined') {
            coinsManager.addCoins(this.coinsEarned);
        }
        
        // Comprobar logros
        this.checkAchievements();
        
        // Mostrar resultados
        this.showResults(won, score);

        const points = Math.max(15, Math.round(score / 25));
        const totalPoints = window.NBPlayStorage ? window.NBPlayStorage.addPoints(points) : points;
        const coupon = window.NBPlayStorage ? window.NBPlayStorage.getOrCreateCoupon() : 'PLAY-XXXX';

        if (window.NBPlayAnalytics) {
            window.NBPlayAnalytics.track('score', { score, won, difficulty: this.difficulty });
            window.NBPlayAnalytics.track('end_game', { score, won, difficulty: this.difficulty });
        }

        window.NBPlayUI?.mountShopCta(document.getElementById('shopCta'), {
            pointsLabel: `Ganaste ${points} puntos (total: ${totalPoints})`,
            coupon,
            shopUrl: this.shopUrl,
            onShop: () => window.NBPlayAnalytics?.track('shop_click', { source: 'results' })
        });
        
        // Sonido
        if (typeof audioManager !== 'undefined') {
            audioManager.play(won ? 'win' : 'lose');
        }
    }
    
    checkAchievements() {
        if (typeof achievementsManager === 'undefined') return;
        
        const stats = achievementsManager.getStats();
        
        // Actualizar estadísticas
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
        
        // Comprobar logros
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
        
        const accuracy = Math.round((this.totalPairs / this.moves) * 100);
        
        // Ranking por estrellas
        let ranking = '⭐';
        if (accuracy >= 80) ranking = '⭐⭐';
        if (accuracy >= 90) ranking = '⭐⭐⭐';
        
        document.getElementById('resultsTitle').textContent = won ? '🎉 ¡Completado!' : '⏰ Tiempo Agotado';
        document.getElementById('finalScore').textContent = score;
        document.getElementById('resultsMessage').textContent = won 
            ? `¡Excelente memoria! Completaste el juego en ${timeStr}`
            : 'No te rindas, ¡inténtalo de nuevo!';
        
        document.getElementById('finalTime').textContent = timeStr;
        document.getElementById('finalMoves').textContent = this.moves;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
        document.getElementById('xpEarned').textContent = this.xpEarned;
        document.getElementById('coinsEarned').textContent = this.coinsEarned;
        document.getElementById('ranking').textContent = ranking;
        
        this.showScreen('resultsScreen');
    }
    
    restart() {
        this.showScreen('startScreen');
    }
    shareScore() {
        const minutes = Math.floor(this.seconds / 60);
        const secs = this.seconds % 60;
        const timeStr = `${minutes}:${String(secs).padStart(2, '0')}`;
        const text = `Completa Memory Flip. Tiempo: ${timeStr}. Movimientos: ${this.moves}. Parejas: ${this.matches}. Juega en play.naturalbe.com.co`;
        if (window.NBPlayShare) {
            window.NBPlayShare.shareText({ title: 'Memory Flip', text, url: this.shopUrl })
                .then(() => window.NBPlayUI?.showToast('Resultado listo para compartir'));
        }
        window.NBPlayAnalytics?.track('share', { moves: this.moves, matches: this.matches });
    }

    showScreen(screenId) {
        ['startScreen', 'gameScreen', 'resultsScreen'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
        document.getElementById(screenId).style.display = 'block';
    }
}

// Inicializar juego
let memoryGame;
window.addEventListener('load', () => {
    memoryGame = new MemoryGame();
});
