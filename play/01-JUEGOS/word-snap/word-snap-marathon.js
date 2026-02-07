// Word Snap - Modo Maratón
class WordSnapMarathon extends WordSnapCampaign {
    constructor() {
        super();
        
        // Sobrescribir propiedades para modo maratón
        this.globalTimeLeft = 90;
        this.marathonScore = 0;
        this.marathonLevels = 0;
        this.marathonTimer = null;
        this.isMarathonMode = true;
    }

    init() {
        this.loadLevel(1); // Empezar desde nivel 1
        this.createGrid();
        this.updateUI();
        this.applyDarkMode();
        this.applyTheme();
        
        // Actualizar UI para modo maratón
        document.getElementById('levelBadge').textContent = '🏃 Modo Maratón';
        document.getElementById('levelInfo').textContent = 'Completa niveles mientras tengas tiempo';
    }

    start() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.globalTimeLeft = 90;
        this.marathonScore = 0;
        this.marathonLevels = 0;
        this.score = 0;
        this.foundWords = [];
        
        this.createGrid();
        this.updateUI();
        
        const startBtn = document.getElementById('startBtn');
        startBtn.textContent = '🔄 Reiniciar Maratón';
        startBtn.classList.add('playing');
        
        // Timer global
        this.marathonTimer = setInterval(() => {
            this.globalTimeLeft--;
            this.updateUI();
            
            if (this.globalTimeLeft <= 20 && this.globalTimeLeft > 0) {
                document.getElementById('timer').classList.add('warning');
                if (this.globalTimeLeft === 20) {
                    window.audioManager?.play('timeWarning');
                }
            }
            
            if (this.globalTimeLeft <= 0) {
                this.endMarathon();
            }
        }, 1000);
    }

    updateUI() {
        document.getElementById('timer').textContent = this.globalTimeLeft;
        document.getElementById('wordsFound').textContent = 
            `${this.foundWords.length}/${this.words.length}`;
        document.getElementById('score').textContent = this.marathonScore;
        
        // Actualizar badge con niveles completados
        document.getElementById('levelBadge').textContent = 
            `🏃 Maratón • ${this.marathonLevels} niveles`;
    }

    levelComplete() {
        this.marathonLevels++;
        this.globalTimeLeft += 20; // Bonus de tiempo
        this.marathonScore += this.score;
        
        // Mostrar feedback rápido
        this.showQuickFeedback();
        
        // Avanzar al siguiente nivel
        this.currentLevel = (this.currentLevel % GAME_LEVELS.totalLevels) + 1;
        
        this.stopPatternAnimation();
        this.loadLevel(this.currentLevel);
        
        // Reset para nuevo nivel
        this.score = 0;
        this.foundWords = [];
        
        this.createGrid();
        this.updateUI();
        this.applyTheme();
        
        window.audioManager?.play('levelComplete');
    }

    showQuickFeedback() {
        const feedback = document.createElement('div');
        feedback.className = 'marathon-feedback';
        feedback.innerHTML = `
            <div style="font-size: 2em;">✅</div>
            <div>¡Nivel ${this.marathonLevels} completado!</div>
            <div style="font-size: 0.9em; opacity: 0.8;">+20s bonus</div>
        `;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 20px 30px;
            border-radius: 20px;
            text-align: center;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: popFeedback 0.5s ease-out;
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => feedback.remove(), 300);
        }, 1500);
    }

    endMarathon() {
        this.isPlaying = false;
        clearInterval(this.marathonTimer);
        
        // Guardar récords
        const bestLevels = parseInt(localStorage.getItem('wsMarathonBestLevels') || '0', 10);
        const bestScore = parseInt(localStorage.getItem('wsMarathonBestScore') || '0', 10);
        
        let newRecord = false;
        
        if (this.marathonLevels > bestLevels) {
            localStorage.setItem('wsMarathonBestLevels', String(this.marathonLevels));
            newRecord = true;
        }
        if (this.marathonScore > bestScore) {
            localStorage.setItem('wsMarathonBestScore', String(this.marathonScore));
            newRecord = true;
        }
        
        this.showMarathonResults(newRecord);
    }

    showMarathonResults(newRecord) {
        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('modalTitle');
        const badge = document.getElementById('completeBadge');
        const finalScore = document.getElementById('finalScore');
        const message = document.getElementById('resultMessage');
        const nextBtn = document.getElementById('nextLevelBtn');
        
        title.textContent = newRecord ? '🏆 ¡Nuevo Récord!' : '🏃 Maratón Terminado';
        badge.textContent = `${this.marathonLevels} niveles completados`;
        badge.style.display = 'inline-block';
        badge.style.background = newRecord 
            ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
            : 'linear-gradient(135deg, #4CAF50, #45a049)';
        
        finalScore.textContent = this.marathonScore;
        message.textContent = newRecord 
            ? '¡Increíble! Has superado tu récord anterior' 
            : 'Buen intento, sigue practicando para mejorar';
        
        nextBtn.style.display = 'none';
        
        // Mostrar métricas de maratón
        document.getElementById('wordsFoundMetric').textContent = this.marathonLevels;
        document.getElementById('timeUsedMetric').textContent = '90s';
        
        const bestLevels = parseInt(localStorage.getItem('wsMarathonBestLevels') || '0', 10);
        const bestScore = parseInt(localStorage.getItem('wsMarathonBestScore') || '0', 10);
        
        document.getElementById('maxLevelMetric').textContent = bestLevels;
        
        const streakEl = document.getElementById('streakMetric');
        const maxScoreEl = document.getElementById('maxScoreMetric');
        
        if (streakEl) streakEl.textContent = `${bestLevels} 🏃`;
        if (maxScoreEl) maxScoreEl.textContent = bestScore;
        
        modal.classList.add('show');
        
        if (newRecord) {
            this.createConfetti();
        }
    }

    restart() {
        const modal = document.getElementById('gameOverModal');
        modal.classList.remove('show');
        
        this.isPlaying = false;
        clearInterval(this.marathonTimer);
        this.stopPatternAnimation();
        
        document.getElementById('timer').classList.remove('warning');
        
        const startBtn = document.getElementById('startBtn');
        startBtn.textContent = '▶️ Iniciar Maratón';
        startBtn.classList.remove('playing');
        
        this.currentLevel = 1;
        this.marathonScore = 0;
        this.marathonLevels = 0;
        
        this.loadLevel(1);
        this.createGrid();
        this.updateUI();
        this.applyTheme();
    }

    // Deshabilitar selector de niveles en modo maratón
    showLevelSelector() {
        alert('El selector de niveles no está disponible en modo maratón');
    }
}

// Inicializar juego en modo maratón
const game = new WordSnapMarathon();
