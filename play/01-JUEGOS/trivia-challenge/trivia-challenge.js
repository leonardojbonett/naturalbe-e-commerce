// Trivia Challenge - Lógica del Juego V1.0
// Integración completa con sistemas de XP, monedas, logros y audio

class TriviaGame {
    constructor() {
        this.currentQuestion = 0;
        this.score = 0;
        this.lives = 3;
        this.streak = 0;
        this.maxStreak = 0;
        this.correctAnswers = 0;
        this.totalQuestions = 10;
        this.questions = [];
        this.timer = null;
        this.timeLeft = 15;
        this.totalTime = 15;
        this.isAnswering = false;
        this.coinsEarned = 0;
        this.xpEarned = 0;
        this.gameFinished = false;
        
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
        
        // Mostrar pantalla de inicio
        this.showScreen('startScreen');
    }
    
    startGame() {
        if (window.NBPlayAnalytics) {
            window.NBPlayAnalytics.init(this.gameMeta);
            window.NBPlayAnalytics.track('start_game', { totalQuestions: this.totalQuestions });
        }
        // Resetear variables
        this.currentQuestion = 0;
        this.score = 0;
        this.lives = 3;
        this.streak = 0;
        this.maxStreak = 0;
        this.correctAnswers = 0;
        this.coinsEarned = 0;
        this.xpEarned = 0;
        this.gameFinished = false;
        
        // Seleccionar preguntas aleatorias
        this.questions = getRandomQuestions(this.totalQuestions);
        
        // Mostrar pantalla de juego
        this.showScreen('gameScreen');
        
        // Cargar primera pregunta
        this.loadQuestion();
        
        // Sonido de inicio
        if (typeof audioManager !== 'undefined') {
            audioManager.play('start');
        }
    }
    
    loadQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.endGame();
            return;
        }
        
        const question = this.questions[this.currentQuestion];
        this.isAnswering = false;
        
        // Actualizar UI
        document.getElementById('questionNumber').textContent = `${this.currentQuestion + 1}/${this.totalQuestions}`;
        document.getElementById('categoryDisplay').textContent = question.categoria;
        document.getElementById('questionText').textContent = question.pregunta;
        document.getElementById('score').textContent = this.score;
        this.updateLivesDisplay();
        this.updateStreakDisplay();
        
        // Cargar respuestas
        const answersGrid = document.getElementById('answersGrid');
        const letters = ['A', 'B', 'C', 'D'];
        answersGrid.innerHTML = '';
        
        question.opciones.forEach((opcion, index) => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.textContent = `${letters[index]}) ${opcion}`;
            btn.onclick = () => this.selectAnswer(index);
            answersGrid.appendChild(btn);
        });
        
        // Iniciar temporizador
        this.startTimer();
    }
    
    startTimer() {
        this.timeLeft = this.totalTime;
        this.updateTimerBar();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerBar();
            
            if (this.timeLeft <= 0) {
                this.timeOut();
            }
        }, 1000);
    }
    
    updateTimerBar() {
        const timerFill = document.getElementById('timerFill');
        const percentage = (this.timeLeft / this.totalTime) * 100;
        timerFill.style.width = `${percentage}%`;
        
        if (this.timeLeft <= 5) {
            timerFill.classList.add('warning');
        } else {
            timerFill.classList.remove('warning');
        }
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    selectAnswer(index) {
        if (this.isAnswering) return;
        
        this.isAnswering = true;
        this.stopTimer();
        
        const question = this.questions[this.currentQuestion];
        const buttons = document.querySelectorAll('.answer-btn');
        const isCorrect = index === question.correcta;
        
        // Deshabilitar todos los botones
        buttons.forEach(btn => btn.disabled = true);
        
        // Marcar respuesta
        buttons[index].classList.add(isCorrect ? 'correct' : 'incorrect');
        if (!isCorrect) {
            buttons[question.correcta].classList.add('correct');
        }
        
        // Procesar respuesta
        if (isCorrect) {
            this.handleCorrectAnswer(question);
        } else {
            this.handleIncorrectAnswer();
        }
        
        // Siguiente pregunta después de 1.5s
        setTimeout(() => {
            if (this.gameFinished) return;
            
            this.currentQuestion++;
            
            if (this.lives <= 0 || this.currentQuestion >= this.questions.length) {
                this.endGame();
                return;
            }
            
            this.loadQuestion();
        }, 1500);
    }
    
    handleCorrectAnswer(question) {
        // Calcular puntos
        let points = 100;
        if (question.dificultad === 'media') points = 150;
        if (question.dificultad === 'dificil') points = 200;
        
        // Aplicar multiplicador por racha
        const multiplier = Math.min(1 + (this.streak * 0.1), 2);
        points = Math.floor(points * multiplier);
        
        this.score += points;
        this.correctAnswers++;
        this.streak++;
        this.maxStreak = Math.max(this.maxStreak, this.streak);
        
        // XP
        let xp = 10;
        if (question.dificultad === 'media') xp = 20;
        if (question.dificultad === 'dificil') xp = 30;
        if (this.streak >= 3) xp += 5;
        
        this.xpEarned += xp;
        if (typeof xpManager !== 'undefined') {
            xpManager.addXP(xp);
        }
        
        // Monedas
        const coins = Math.floor(points / 20);
        this.coinsEarned += coins;
        if (typeof coinsManager !== 'undefined') {
            coinsManager.addCoins(coins);
        }
        
        // Sonido
        if (typeof audioManager !== 'undefined') {
            audioManager.play('correct');
        }
        
        // Partículas
        this.createParticles('✨');
    }
    
    handleIncorrectAnswer() {
        this.lives--;
        this.streak = 0;
        
        // Sonido
        if (typeof audioManager !== 'undefined') {
            audioManager.play('wrong');
        }
        
        // Verificar game over
        if (this.lives <= 0) {
            this.gameFinished = true;
        }
    }
    
    timeOut() {
        this.stopTimer();
        this.handleIncorrectAnswer();
        
        // Marcar respuesta correcta
        const question = this.questions[this.currentQuestion];
        const buttons = document.querySelectorAll('.answer-btn');
        buttons.forEach(btn => btn.disabled = true);
        buttons[question.correcta].classList.add('correct');
        
        // Siguiente pregunta
        setTimeout(() => {
            if (this.gameFinished) return;
            
            this.currentQuestion++;
            
            if (this.lives <= 0 || this.currentQuestion >= this.questions.length) {
                this.endGame();
                return;
            }
            
            this.loadQuestion();
        }, 1500);
    }
    
    updateLivesDisplay() {
        const livesDisplay = document.getElementById('livesDisplay');
        livesDisplay.textContent = '❤️'.repeat(this.lives) + '🖤'.repeat(3 - this.lives);
    }
    
    updateStreakDisplay() {
        const streakContainer = document.getElementById('streakContainer');
        const streakDisplay = document.getElementById('streakDisplay');
        
        if (this.streak >= 3) {
            streakContainer.style.display = 'block';
            streakDisplay.textContent = this.streak;
        } else {
            streakContainer.style.display = 'none';
        }
    }
    
    endGame() {
        if (this.gameFinished) return; // PREVENCIÓN DOBLE
        this.gameFinished = true;
        
        this.stopTimer();
        
        // Bonus por completar
        if (this.lives > 0) {
            const bonusCoins = 50;
            this.coinsEarned += bonusCoins;
            if (typeof coinsManager !== 'undefined') {
                coinsManager.addCoins(bonusCoins);
            }
        }
        
        // Comprobar logros
        this.checkAchievements();
        
        // Mostrar resultados
        this.showResults();

        const points = Math.max(15, Math.round(this.score / 50));
        const totalPoints = window.NBPlayStorage ? window.NBPlayStorage.addPoints(points) : points;
        const coupon = window.NBPlayStorage ? window.NBPlayStorage.getOrCreateCoupon() : 'PLAY-XXXX';

        if (window.NBPlayAnalytics) {
            window.NBPlayAnalytics.track('score', { score: this.score, correct: this.correctAnswers });
            window.NBPlayAnalytics.track('end_game', { score: this.score, correct: this.correctAnswers });
        }

        window.NBPlayUI?.mountShopCta(document.getElementById('shopCta'), {
            pointsLabel: `Ganaste ${points} puntos (total: ${totalPoints})`,
            coupon,
            shopUrl: this.shopUrl,
            onShop: () => window.NBPlayAnalytics?.track('shop_click', { source: 'results' })
        });
        
        // Sonido
        if (typeof audioManager !== 'undefined') {
            audioManager.play(this.lives > 0 ? 'win' : 'lose');
        }
    }
    
    checkAchievements() {
        if (typeof achievementsManager === 'undefined') return;
        
        // Primer Quiz
        achievementsManager.checkAchievement('first_trivia');
        
        // Racha de 5
        if (this.maxStreak >= 5) {
            achievementsManager.checkAchievement('trivia_streak_5');
        }
        
        // Perfecto (10/10)
        if (this.correctAnswers === this.totalQuestions) {
            achievementsManager.checkAchievement('trivia_perfect');
        }
        
        // Por categorías (se puede implementar después)
    }
    
    showResults() {
        const accuracy = Math.round((this.correctAnswers / this.totalQuestions) * 100);
        
        document.getElementById('resultsTitle').textContent = 
            this.lives > 0 ? '🎉 ¡Excelente!' : '💪 ¡Buen Intento!';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('resultsMessage').textContent = 
            this.lives > 0 
                ? `¡Completaste el quiz con ${this.lives} vida${this.lives > 1 ? 's' : ''} restante${this.lives > 1 ? 's' : ''}!`
                : '¡Sigue practicando para mejorar!';
        
        document.getElementById('correctAnswers').textContent = this.correctAnswers;
        document.getElementById('maxStreak').textContent = this.maxStreak;
        document.getElementById('coinsEarned').textContent = this.coinsEarned;
        document.getElementById('xpEarned').textContent = this.xpEarned;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
        document.getElementById('totalQuestions').textContent = this.totalQuestions;
        
        this.showScreen('resultsScreen');
    }
    
    restart() {
        this.startGame();
    }
    shareScore() {
        const text = `Obtuve ${this.score} puntos en Trivia Challenge. ${this.correctAnswers}/${this.totalQuestions} correctas. Juega en play.naturalbe.com.co`;
        if (window.NBPlayShare) {
            window.NBPlayShare.shareText({ title: 'Trivia Challenge', text, url: this.shopUrl })
                .then(() => window.NBPlayUI?.showToast('Resultado listo para compartir'));
        }
        window.NBPlayAnalytics?.track('share', { score: this.score, correct: this.correctAnswers });
    }

    showScreen(screenId) {
        ['startScreen', 'gameScreen', 'resultsScreen'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
        document.getElementById(screenId).style.display = 'block';
    }
    
    createParticles(emoji) {
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = emoji;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }
}

// Inicializar juego
window.addEventListener('load', () => {
    window.triviaGame = new TriviaGame();
});
