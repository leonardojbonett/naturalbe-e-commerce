// Word Snap PRO - Funciones Avanzadas
// Este archivo complementa word-snap.js con características pro

// Extender la clase WordSnapGame
(function() {
    const originalConstructor = WordSnapGame.prototype.constructor;
    
    // Añadir propiedades pro al constructor
    WordSnapGame.prototype.initPro = function() {
        this.gameMode = 'normal'; // normal, zen, extreme
        this.combo = 0;
        this.lastWordTime = 0;
        this.comboTimeout = null;
        this.wordBonuses = {
            diagonal: 1.5,
            reverse: 1.3,
            long: 1.2
        };
        this.isChallenge = false;
        this.challengeCreator = null;
        this.challengeScore = 0;
    };
    
    // Modo de juego
    WordSnapGame.prototype.setGameMode = function(mode) {
        if (this.isPlaying) {
            alert('No puedes cambiar el modo durante el juego');
            return;
        }
        
        this.gameMode = mode;
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        
        if (mode === 'zen') {
            this.timeLimit = Infinity;
        } else if (mode === 'extreme') {
            this.timeLimit = 30;
        } else {
            this.timeLimit = 120;
        }
    };
    
    // Calcular bonus de palabra
    WordSnapGame.prototype.calculateWordBonus = function(word, positions) {
        let bonus = 1.0;
        let bonusReasons = [];
        
        if (this.isDiagonal(positions)) {
            bonus *= this.wordBonuses.diagonal;
            bonusReasons.push('Diagonal');
        }
        
        if (this.isReverse(positions)) {
            bonus *= this.wordBonuses.reverse;
            bonusReasons.push('Inversa');
        }
        
        if (word.length >= 7) {
            bonus *= this.wordBonuses.long;
            bonusReasons.push('Larga');
        }
        
        return { bonus, reasons: bonusReasons };
    };
    
    WordSnapGame.prototype.isDiagonal = function(positions) {
        if (positions.length < 2) return false;
        
        const dx = positions[1].row - positions[0].row;
        const dy = positions[1].col - positions[0].col;
        
        return dx !== 0 && dy !== 0;
    };
    
    WordSnapGame.prototype.isReverse = function(positions) {
        if (positions.length < 2) return false;
        
        const dx = positions[1].row - positions[0].row;
        const dy = positions[1].col - positions[0].col;
        
        return dx < 0 || dy < 0;
    };
    
    // Mostrar popup de bonus
    WordSnapGame.prototype.showBonusPopup = function(points, reasons) {
        const popup = document.createElement('div');
        popup.className = 'bonus-popup';
        popup.innerHTML = `
            <div class="bonus-points">+${points}</div>
            <div class="bonus-reason">${reasons.join(' + ')}</div>
        `;
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.style.opacity = '0';
            setTimeout(() => popup.remove(), 300);
        }, 1500);
    };
    
    // Sistema de combos
    WordSnapGame.prototype.updateCombo = function() {
        if (this.gameMode !== 'extreme') return;
        
        const now = Date.now();
        const timeSinceLastWord = now - this.lastWordTime;
        
        if (timeSinceLastWord < 3000 && this.lastWordTime > 0) {
            this.combo++;
            this.showComboPopup();
            this.timeLeft += 2;
        } else {
            this.combo = 0;
        }
        
        this.lastWordTime = now;
        
        clearTimeout(this.comboTimeout);
        this.comboTimeout = setTimeout(() => {
            this.combo = 0;
            this.updateComboUI();
        }, 3000);
        
        this.updateComboUI();
    };
    
    WordSnapGame.prototype.showComboPopup = function() {
        const popup = document.createElement('div');
        popup.className = 'combo-popup';
        popup.textContent = `🔥 COMBO x${this.combo}`;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    };
    
    WordSnapGame.prototype.updateComboUI = function() {
        const comboEl = document.getElementById('comboDisplay');
        if (comboEl) {
            if (this.combo > 0 && this.gameMode === 'extreme') {
                comboEl.textContent = `🔥 x${this.combo}`;
                comboEl.style.display = 'block';
            } else {
                comboEl.style.display = 'none';
            }
        }
    };
    
    // Compartir en Instagram Story
    WordSnapGame.prototype.shareToInstagramStory = async function() {
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
        ctx.fillText(this.score.toString(), 540, 800);
        
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
            
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
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
                this.downloadImage(blob);
            }
        });
    };
    
    WordSnapGame.prototype.downloadImage = function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'word-snap-score.png';
        a.click();
        URL.revokeObjectURL(url);
        
        alert('Imagen descargada! Súbela a tu Instagram Story 📸');
    };
    
    // Mejorar challengeFriend
    const originalChallengeFriend = WordSnapGame.prototype.challengeFriend;
    WordSnapGame.prototype.challengeFriend = function() {
        const playerName = this.getPlayerName();
        const seed = this.generatePuzzleSeed();
        const challengeUrl = `${window.location.origin}${window.location.pathname}?challenge=${seed}&creator=${encodeURIComponent(playerName)}&score=${this.score}`;
        
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
    };
    
    WordSnapGame.prototype.getPlayerName = function() {
        let name = localStorage.getItem('playerName');
        if (!name) {
            name = prompt('Tu nombre:', 'Jugador') || 'Jugador';
            localStorage.setItem('playerName', name);
        }
        return name;
    };
    
    // Detectar desafío en init
    const originalInit = WordSnapGame.prototype.init;
    WordSnapGame.prototype.init = async function() {
        this.initPro();
        
        await this.loadThemes();
        
        const urlParams = new URLSearchParams(window.location.search);
        const challengeParam = urlParams.get('challenge');
        const creatorName = urlParams.get('creator');
        const creatorScore = urlParams.get('score');
        
        if (challengeParam) {
            this.isChallenge = true;
            this.challengeCreator = creatorName;
            this.challengeScore = parseInt(creatorScore);
            
            this.showChallengeBanner();
            this.loadPuzzleFromChallenge(challengeParam);
        } else {
            this.selectDailyTheme();
        }
        
        this.createGrid();
        this.updateUI();
        this.updateStartButton();
        this.applyDarkMode();
    };
    
    WordSnapGame.prototype.showChallengeBanner = function() {
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
    };
    
    // Mejorar foundWord con bonus y combos
    const originalFoundWord = WordSnapGame.prototype.foundWord;
    WordSnapGame.prototype.foundWord = function(word) {
        this.foundWords.push(word);
        
        // Sistema de combo
        this.updateCombo();
        
        // Calcular puntos con bonus
        const basePoints = word.length * 10;
        const { bonus, reasons } = this.calculateWordBonus(word, this.selectedCells);
        const comboMultiplier = this.gameMode === 'extreme' ? (1 + this.combo * 0.5) : 1;
        const totalPoints = Math.floor(basePoints * bonus * comboMultiplier);
        
        this.score += totalPoints;
        
        // Mostrar bonus si aplica
        if (bonus > 1.0) {
            this.showBonusPopup(totalPoints, reasons);
        }
        
        // Sonido de éxito
        try {
            this.sounds.success();
        } catch (e) {}
        
        // Vibración mejorada
        if (navigator.vibrate) {
            navigator.vibrate([40, 20, 40]);
        }
        
        // Marcar celdas como encontradas con animación
        this.selectedCells.forEach((cell, index) => {
            setTimeout(() => {
                cell.element.classList.add('found', 'flash');
                
                if (index % 3 === 0) {
                    this.createParticle(cell.element, 'star');
                } else if (index % 3 === 1) {
                    this.createParticle(cell.element, 'letter');
                } else {
                    this.createParticle(cell.element, 'emoji');
                }
            }, index * 50);
        });
        
        setTimeout(() => {
            this.highlightFoundWord(word);
        }, 500);
        
        this.showWordFoundPopup(word);
        
        this.updateUI();
        this.renderWordsList();
        
        if (this.foundWords.length === this.words.length) {
            setTimeout(() => this.gameOver(true), 1000);
        }
    };
    
    // Mejorar start para modos
    const originalStart = WordSnapGame.prototype.start;
    WordSnapGame.prototype.start = function() {
        if (this.isPlaying) return;
        
        try {
            this.sounds.start();
        } catch (e) {}
        
        this.isPlaying = true;
        this.score = 0;
        this.foundWords = [];
        this.combo = 0;
        this.lastWordTime = 0;
        
        if (this.gameMode === 'zen') {
            this.timeLeft = Infinity;
        } else {
            this.timeLeft = this.timeLimit;
            
            this.timer = setInterval(() => {
                this.timeLeft--;
                this.updateUI();
                
                if (this.timeLeft === 20 && this.gameMode === 'normal') {
                    this.showTimeWarning();
                } else if (this.timeLeft === 10 && this.gameMode === 'extreme') {
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
    };
})();

console.log('Word Snap PRO features loaded! 🚀');
