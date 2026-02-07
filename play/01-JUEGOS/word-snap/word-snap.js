// Word Snap - Sopa de Letras Viral
class WordSnapGame {
    constructor() {
        this.gridSize = 10;
        this.timeLimit = 120; // Cambiado a 2 minutos
        this.grid = [];
        this.words = [];
        this.foundWords = [];
        this.foundWordsPositions = {}; // Guardar posiciones de palabras encontradas
        this.selectedCells = [];
        this.score = 0;
        this.timer = null;
        this.timeLeft = this.timeLimit;
        this.isPlaying = false;
        this.currentTheme = null;
        this.sounds = this.initSounds();
        this.themesData = null;
        this.difficulty = 'normal'; // easy, normal, hard
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.puzzleSeed = null; // Para desaf
        this.shopUrl = 'https://naturalbe.com.co/#productos';
        this.gameMeta = { gameId: 'word-snap', gameName: 'Word Snap' };íos
        
        // Métricas locales
        this.metrics = this.loadMetrics();
        
        // Temas de fallback (si no carga el JSON)
        this.fallbackThemes = {
            'Memes Virales 2024': ['SKIBIDI', 'RIZZ', 'SIGMA', 'GYATT', 'OHIO'],
            'Series Netflix': ['STRANGER', 'SQUID', 'CROWN', 'WITCHER', 'NARCOS'],
            'Reggaeton': ['FEID', 'KAROL', 'PESO', 'PLUMA', 'BIZARRAP'],
            'Celebridades': ['SHAKIRA', 'MESSI', 'ROSALIA', 'ANUEL', 'MALUMA'],
            'Gaming': ['FORTNITE', 'MINECRAFT', 'ROBLOX', 'VALORANT', 'APEX'],
            'TikTok Trends': ['DANCE', 'VIRAL', 'TREND', 'DUET', 'FILTER'],
            'Futbol': ['MADRID', 'BARCA', 'MBAPPE', 'HAALAND', 'VINICIUS']
        };
        
        this.init();
    }

    initSounds() {
        // Crear sonidos simples usando Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        return {
            tick: () => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            },
            success: () => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 523.25; // C5
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                
                // Segunda nota
                setTimeout(() => {
                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    
                    osc2.connect(gain2);
                    gain2.connect(audioContext.destination);
                    
                    osc2.frequency.value = 659.25; // E5
                    osc2.type = 'sine';
                    
                    gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    
                    osc2.start(audioContext.currentTime);
                    osc2.stop(audioContext.currentTime + 0.3);
                }, 100);
            },
            error: () => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 200;
                oscillator.type = 'sawtooth';
                
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            },
            start: () => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 440;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            },
            warning: () => {
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.value = 1000;
                        oscillator.type = 'square';
                        
                        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                        
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.1);
                    }, i * 150);
                }
            },
            modal: () => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 880;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }
        };
    }

    async init() {
        await this.loadThemes();
        
        // Verificar si hay un desafío en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const puzzleParam = urlParams.get('puzzle');
        
        if (puzzleParam) {
            this.loadPuzzleFromChallenge(puzzleParam);
        } else {
            this.selectDailyTheme();
        }
        
        this.createGrid();
        this.updateUI();
        this.updateStartButton();
        this.applyDarkMode();
    }

    async loadThemes() {
        try {
            // Añadir timestamp para evitar caché
            const timestamp = new Date().getTime();
            const response = await fetch(`themes.json?v=${timestamp}`, {
                cache: 'no-store'
            });
            const data = await response.json();
            this.themesData = data;
        } catch (error) {
            console.warn('No se pudo cargar themes.json, usando temas de fallback');
            this.themesData = null;
        }
    }

    selectDailyTheme() {
        const today = new Date().toISOString().split('T')[0];
        
        if (this.themesData && this.themesData.dailyThemes && this.themesData.dailyThemes[today]) {
            // Usar tema del día específico
            const theme = this.themesData.dailyThemes[today];
            this.currentTheme = theme.tema;
            this.words = theme.palabras;
            this.themeColor = theme.color;
            this.themeDescription = theme.descripcion;
            
            const badge = document.getElementById('themeBadge');
            badge.textContent = `${theme.emoji} ${theme.tema}`;
            badge.style.background = theme.color;
            badge.title = theme.descripcion;
        } else if (this.themesData && this.themesData.fallbackThemes) {
            // Usar tema de fallback del JSON
            const dayIndex = new Date().getDate();
            const theme = this.themesData.fallbackThemes[dayIndex % this.themesData.fallbackThemes.length];
            this.currentTheme = theme.tema;
            this.words = theme.palabras;
            this.themeColor = theme.color;
            
            const badge = document.getElementById('themeBadge');
            badge.textContent = `${theme.emoji} ${theme.tema}`;
            badge.style.background = theme.color;
            badge.title = theme.descripcion;
        } else {
            // Usar temas hardcodeados
            const themeNames = Object.keys(this.fallbackThemes);
            const dayIndex = new Date().getDate();
            const themeName = themeNames[dayIndex % themeNames.length];
            this.currentTheme = themeName;
            this.words = this.fallbackThemes[themeName];
            document.getElementById('themeBadge').textContent = `🎯 ${themeName}`;
        }
        
        console.log('🎯 Tema seleccionado:', this.currentTheme);
        console.log('📝 Palabras:', this.words);
    }

    createGrid() {
        this.grid = Array(this.gridSize).fill(null).map(() => 
            Array(this.gridSize).fill('')
        );
        
        // Resetear posiciones de palabras encontradas
        this.foundWordsPositions = {};
        
        // Colocar palabras en el grid
        this.words.forEach(word => {
            this.placeWord(word);
        });
        
        // Rellenar espacios vacíos con letras aleatorias
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
        
        // Configurar direcciones según dificultad
        if (this.difficulty === 'easy') {
            // Solo horizontal y vertical
            directions = [
                { dx: 0, dy: 1 },   // horizontal
                { dx: 1, dy: 0 }    // vertical
            ];
        } else if (this.difficulty === 'normal') {
            // Horizontal, vertical y diagonales
            directions = [
                { dx: 0, dy: 1 },   // horizontal
                { dx: 1, dy: 0 },   // vertical
                { dx: 1, dy: 1 },   // diagonal
                { dx: 1, dy: -1 }   // diagonal inversa
            ];
        } else { // hard
            // Todas las direcciones incluyendo inversas
            directions = [
                { dx: 0, dy: 1 },   // horizontal →
                { dx: 0, dy: -1 },  // horizontal ←
                { dx: 1, dy: 0 },   // vertical ↓
                { dx: -1, dy: 0 },  // vertical ↑
                { dx: 1, dy: 1 },   // diagonal ↘
                { dx: 1, dy: -1 },  // diagonal ↙
                { dx: -1, dy: 1 },  // diagonal ↗
                { dx: -1, dy: -1 }  // diagonal ↖
            ];
        }
        
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!placed && attempts < maxAttempts) {
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const startX = Math.floor(Math.random() * this.gridSize);
            const startY = Math.floor(Math.random() * this.gridSize);
            
            if (this.canPlaceWord(word, startX, startY, dir)) {
                const positions = [];
                for (let i = 0; i < word.length; i++) {
                    const x = startX + (dir.dx * i);
                    const y = startY + (dir.dy * i);
                    this.grid[x][y] = word[i];
                    positions.push({ row: x, col: y });
                }
                // Guardar posiciones de la palabra
                this.foundWordsPositions[word] = positions;
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
                cell.addEventListener('touchstart', (e) => this.startSelection(e), { passive: false });
                cell.addEventListener('touchmove', (e) => this.continueSelection(e), { passive: false });
                cell.addEventListener('touchend', () => this.endSelection());
                
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
            wordItem.dataset.word = word;
            
            if (this.foundWords.includes(word)) {
                wordItem.classList.add('found');
            }
            
            listElement.appendChild(wordItem);
        });
    }

    startSelection(e) {
        if (!this.isPlaying) return;
        if (e && e.preventDefault) e.preventDefault();
        this.selectedCells = [];
        const cell = this.getTouchedCell(e) || e.target;
        if (cell && cell.classList.contains('letter-cell')) {
            this.selectCell(cell);
        }
    }

    continueSelection(e) {
        if (!this.isPlaying || this.selectedCells.length === 0) return;
        if (e && e.preventDefault) e.preventDefault();
        const cell = this.getTouchedCell(e) || e.target;
        if (!cell || !cell.classList.contains('letter-cell')) return;
        this.selectCell(cell);
    }

    getTouchedCell(e) {
        if (!e || !e.touches || !e.touches[0]) return null;
        const touch = e.touches[0];
        return document.elementFromPoint(touch.clientX, touch.clientY);
    }

    selectCell(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const key = `${row}-${col}`;
        
        if (!this.selectedCells.find(c => c.key === key)) {
            this.selectedCells.push({ row, col, key, element: cell });
            cell.classList.add('selected');
            
            // Sonido tick al seleccionar
            try {
                this.sounds.tick();
            } catch (e) {
                // Silenciar errores de audio
            }
            
            this.updateCurrentWord();
        }
    }

    updateCurrentWord() {
        const word = this.selectedCells.map(c => 
            this.grid[c.row][c.col]
        ).join('');
        
        const currentWordEl = document.getElementById('currentWord');
        currentWordEl.textContent = word || '...';
        
        // Cambiar color según validez
        currentWordEl.classList.remove('valid', 'invalid');
        
        if (word.length > 0) {
            if (this.words.includes(word) && !this.foundWords.includes(word)) {
                currentWordEl.classList.add('valid');
            } else if (word.length >= 3) {
                // Verificar si es inicio de alguna palabra
                const isPotential = this.words.some(w => w.startsWith(word));
                if (!isPotential) {
                    currentWordEl.classList.add('invalid');
                }
            }
        }
    }

    endSelection() {
        if (!this.isPlaying || this.selectedCells.length === 0) return;
        
        const selectedWord = this.selectedCells.map(c => 
            this.grid[c.row][c.col]
        ).join('');
        
        if (this.words.includes(selectedWord) && !this.foundWords.includes(selectedWord)) {
            this.foundWord(selectedWord);
        } else if (selectedWord.length >= 3) {
            // Sonido de error si la palabra no es válida
            try {
                this.sounds.error();
            } catch (e) {}
        }
        
        this.clearSelection();
    }

    foundWord(word) {
        this.foundWords.push(word);
        this.score += word.length * 10;
        
        // Sonido de éxito
        try {
            this.sounds.success();
        } catch (e) {
            // Silenciar errores de audio
        }
        
        // Vibración en móvil
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Marcar celdas como encontradas con animación
        this.selectedCells.forEach((cell, index) => {
            setTimeout(() => {
                cell.element.classList.add('found', 'flash');
                
                // Crear diferentes tipos de partículas
                if (index % 3 === 0) {
                    this.createParticle(cell.element, 'star');
                } else if (index % 3 === 1) {
                    this.createParticle(cell.element, 'letter');
                } else {
                    this.createParticle(cell.element, 'emoji');
                }
            }, index * 50);
        });
        
        // Highlight prolongado de la palabra encontrada
        setTimeout(() => {
            this.highlightFoundWord(word);
        }, 500);
        
        // Popup de palabra encontrada
        this.showWordFoundPopup(word);
        
        this.updateUI();
        this.renderWordsList();
        
        // Verificar si ganó
        if (this.foundWords.length === this.words.length) {
            setTimeout(() => this.gameOver(true), 1000);
        }
    }

    highlightFoundWord(word) {
        const positions = this.foundWordsPositions[word];
        if (!positions) return;
        
        const cells = document.querySelectorAll('.letter-cell');
        positions.forEach(pos => {
            const index = pos.row * this.gridSize + pos.col;
            const cell = cells[index];
            if (cell) {
                cell.classList.add('highlight');
                setTimeout(() => {
                    cell.classList.remove('highlight');
                }, 2000);
            }
        });
    }

    createParticle(element, type = 'emoji') {
        const rect = element.getBoundingClientRect();
        
        if (type === 'emoji') {
            const emojis = ['⭐', '✨', '💫', '🌟', '⚡'];
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = emoji;
            particle.style.left = rect.left + rect.width / 2 + 'px';
            particle.style.top = rect.top + rect.height / 2 + 'px';
            
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
            
        } else if (type === 'star') {
            // Explosión radial de estrellas
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const particle = document.createElement('div');
                particle.className = 'particle-star';
                particle.textContent = '⭐';
                particle.style.left = rect.left + rect.width / 2 + 'px';
                particle.style.top = rect.top + rect.height / 2 + 'px';
                particle.style.setProperty('--angle', `${angle}rad`);
                
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 1000);
            }
            
        } else if (type === 'letter') {
            // Letra volando
            const letter = element.textContent;
            const particle = document.createElement('div');
            particle.className = 'particle-letter';
            particle.textContent = letter;
            particle.style.left = rect.left + rect.width / 2 + 'px';
            particle.style.top = rect.top + rect.height / 2 + 'px';
            
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }
    }

    showWordFoundPopup(word) {
        const popup = document.createElement('div');
        popup.className = 'word-found-popup';
        popup.textContent = `🎉 ${word} +${word.length * 10}`;
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.style.animation = 'popupBounce 0.3s ease-in reverse';
            setTimeout(() => popup.remove(), 300);
        }, 800);
    }

    clearSelection() {
        this.selectedCells.forEach(cell => {
            if (!cell.element.classList.contains('found')) {
                cell.element.classList.remove('selected');
            }
        });
        this.selectedCells = [];
        document.getElementById('currentWord').textContent = '';
    }

    toggleStart() {
        if (this.isPlaying) {
            // Reiniciar juego
            this.restart();
        } else {
            // Iniciar juego
            this.start();
        }
    }

    start() {
        if (window.NBPlayAnalytics) {
            window.NBPlayAnalytics.init(this.gameMeta);
            window.NBPlayAnalytics.track('start_game', { difficulty: this.difficulty });
        }
        if (this.isPlaying) return;
        
        // Sonido de inicio
        try {
            this.sounds.start();
        } catch (e) {}
        
        this.isPlaying = true;
        this.timeLeft = this.timeLimit;
        this.score = 0;
        this.foundWords = [];
        
        this.createGrid();
        this.updateUI();
        this.updateStartButton();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateUI();
            
            // Alerta cuando quedan 20 segundos
            if (this.timeLeft === 20) {
                this.showTimeWarning();
            }
            
            if (this.timeLeft <= 0) {
                this.gameOver(false);
            }
        }, 1000);
    }

    showTimeWarning() {
        const timerEl = document.getElementById('timer');
        timerEl.classList.add('warning');
        
        // Sonido de alerta
        try {
            this.sounds.warning();
        } catch (e) {}
        
        // Vibración más larga
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    updateStartButton() {
        const startBtn = document.getElementById('startBtn');
        
        if (this.isPlaying) {
            startBtn.textContent = '🔄 Reiniciar';
            startBtn.classList.add('playing');
        } else {
            startBtn.textContent = '▶️ Jugar';
            startBtn.classList.remove('playing');
        }
    }

    gameOver(won) {
        this.isPlaying = false;
        clearInterval(this.timer);
        
        // Remover clase warning del timer
        document.getElementById('timer').classList.remove('warning');
        
        // Sonido de modal
        try {
            this.sounds.modal();
        } catch (e) {}
        
        // Actualizar métricas
        this.updateMetrics(won);
        
        const modal = document.getElementById('gameOverModal');
        const finalScore = document.getElementById('finalScore');
        const message = document.getElementById('resultMessage');
        
        finalScore.textContent = this.score;
        
        if (won) {
            message.textContent = `¡Increíble! Encontraste todas las palabras en ${this.timeLimit - this.timeLeft}s`;
        } else {
            message.textContent = `Encontraste ${this.foundWords.length}/${this.words.length} palabras`;
        }
        
        // Mostrar métricas
        this.displayMetrics();

        const points = Math.max(20, Math.round(this.score / 40));
        const totalPoints = window.NBPlayStorage ? window.NBPlayStorage.addPoints(points) : points;
        const coupon = window.NBPlayStorage ? window.NBPlayStorage.getOrCreateCoupon() : 'PLAY-XXXX';

        if (window.NBPlayAnalytics) {
            window.NBPlayAnalytics.track('score', { score: this.score, won, words: this.foundWords.length });
            window.NBPlayAnalytics.track('end_game', { score: this.score, won, words: this.foundWords.length });
        }

        window.NBPlayUI?.mountShopCta(document.getElementById('shopCta'), {
            pointsLabel: `Ganaste ${'${points}'} puntos (total: ${'${totalPoints}'})`,
            coupon,
            shopUrl: this.shopUrl,
            onShop: () => window.NBPlayAnalytics?.track('shop_click', { source: 'results' })
        });
        
        // Generar tabla estilo Wordle
        this.generateWordleGrid();
        
        // Animación de entrada del modal
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        this.updateStartButton();
    }

    restart() {
        const modal = document.getElementById('gameOverModal');
        
        // Animación de salida
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        this.isPlaying = false;
        clearInterval(this.timer);
        document.getElementById('timer').classList.remove('warning');
        this.init();
    }
    shareScore() {
        const today = new Date().toISOString().split('T')[0];
        const wordleGrid = this.generateWordleGrid();
        const text = `Word Snap - ${this.currentTheme}. Tiempo restante: ${this.timeLeft}s. Palabras: ${this.foundWords.length}/${this.words.length}.

${wordleGrid}

Juega: ${window.location.origin}${window.location.pathname}?date=${today}`;
        if (window.NBPlayShare) {
            window.NBPlayShare.shareText({ title: 'Word Snap', text, url: `${window.location.origin}${window.location.pathname}?date=${today}` })
                .then(() => window.NBPlayUI?.showToast('Resultado listo para compartir'));
        }
        window.NBPlayAnalytics?.track('share', { type: 'score', score: this.score });
    }

    challengeFriend() {
        window.NBPlayAnalytics?.track('share', { type: 'challenge', score: this.score });
        const seed = this.generatePuzzleSeed();
        const challengeUrl = `${window.location.origin}${window.location.pathname}?puzzle=${seed}`;
        const text = `Te reto a Word Snap. Tema: ${this.currentTheme}. Mi puntuacion: ${this.score}. Palabras: ${this.foundWords.length}/${this.words.length}. Juega: ${challengeUrl}`;
        if (window.NBPlayShare) {
            window.NBPlayShare.shareText({ title: 'Reto Word Snap', text, url: challengeUrl })
                .then(() => window.NBPlayUI?.showToast('Reto listo para compartir'));
        }
    }

    generatePuzzleSeed() {
        // Crear seed basado en tema, dificultad y fecha
        const today = new Date().toISOString().split('T')[0];
        const themeCode = this.currentTheme.replace(/\s+/g, '-').toUpperCase();
        const diffCode = this.difficulty.toUpperCase();
        const randomPart = Math.floor(Math.random() * 9999);
        
        return `${themeCode}-${diffCode}-${today}-${randomPart}`;
    }

    loadPuzzleFromChallenge(puzzleParam) {
        // Parsear el seed del puzzle
        const parts = puzzleParam.split('-');
        
        if (parts.length >= 2) {
            // Extraer dificultad
            const diffCode = parts[1];
            if (['EASY', 'NORMAL', 'HARD'].includes(diffCode)) {
                this.difficulty = diffCode.toLowerCase();
                this.setDifficulty(this.difficulty);
            }
            
            // Extraer tema (primeras partes antes de la dificultad)
            const themeCode = parts[0];
            
            // Buscar tema correspondiente
            if (this.themesData) {
                const theme = this.themesData.find(t => 
                    t.name.replace(/\s+/g, '-').toUpperCase().includes(themeCode)
                );
                
                if (theme) {
                    this.currentTheme = theme.name;
                    this.words = theme.words;
                    document.getElementById('themeBadge').textContent = `${theme.emoji} ${theme.name}`;
                    return;
                }
            }
        }
        
        // Si no se pudo cargar, usar tema del día
        this.selectDailyTheme();
    }

    updateUI() {
        const timerEl = document.getElementById('timer');
        timerEl.textContent = this.timeLeft;
        
        // Añadir clase warning si quedan 20 segundos o menos
        if (this.timeLeft <= 20 && this.timeLeft > 0 && this.isPlaying) {
            timerEl.classList.add('warning');
        } else {
            timerEl.classList.remove('warning');
        }
        
        document.getElementById('wordsFound').textContent = 
            `${this.foundWords.length}/${this.words.length}`;
        document.getElementById('score').textContent = this.score;
    }

    showInstructions() {
        const modal = document.getElementById('instructionsModal');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }

    closeInstructions() {
        const modal = document.getElementById('instructionsModal');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }

    setDifficulty(level) {
        if (this.isPlaying) {
            alert('No puedes cambiar la dificultad durante el juego');
            return;
        }
        
        this.difficulty = level;
        
        // Actualizar tamaño del grid según dificultad
        if (level === 'easy') {
            this.gridSize = 8;
        } else if (level === 'normal') {
            this.gridSize = 10;
        } else { // hard
            this.gridSize = 12;
        }
        
        // Actualizar botones
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === level) {
                btn.classList.add('active');
            }
        });
        
        // Actualizar grid CSS
        document.getElementById('letterGrid').style.gridTemplateColumns = 
            `repeat(${this.gridSize}, 1fr)`;
        
        // Recrear grid
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
            document.querySelector('.dark-mode-toggle').textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            document.querySelector('.dark-mode-toggle').textContent = '🌙';
        }
    }

    // === MÉTRICAS LOCALES ===
    
    loadMetrics() {
        const stored = localStorage.getItem('wordSnapMetrics');
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

    saveMetrics() {
        localStorage.setItem('wordSnapMetrics', JSON.stringify(this.metrics));
    }

    updateMetrics(won) {
        const today = new Date().toISOString().split('T')[0];
        
        // Actualizar récord
        if (this.score > this.metrics.maxScore) {
            this.metrics.maxScore = this.score;
        }
        
        // Actualizar días jugados y racha
        if (this.metrics.lastPlayedDate !== today) {
            this.metrics.daysPlayed++;
            
            // Calcular racha
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (this.metrics.lastPlayedDate === yesterdayStr) {
                // Continúa la racha
                this.metrics.currentStreak++;
            } else if (this.metrics.lastPlayedDate === null || this.metrics.lastPlayedDate < yesterdayStr) {
                // Racha rota, empezar de nuevo
                this.metrics.currentStreak = 1;
            }
            
            this.metrics.lastPlayedDate = today;
        }
        
        this.metrics.totalGames++;
        this.saveMetrics();
    }

    displayMetrics() {
        document.getElementById('maxScore').textContent = this.metrics.maxScore;
        document.getElementById('daysPlayed').textContent = this.metrics.daysPlayed;
        document.getElementById('streak').textContent = this.metrics.currentStreak;
    }

    // === TABLA ESTILO WORDLE ===
    
    generateWordleGrid() {
        const totalWords = this.words.length;
        const foundCount = this.foundWords.length;
        
        // Crear filas de 5 cuadrados
        let grid = '';
        const rows = Math.ceil(totalWords / 5);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < 5; col++) {
                const index = row * 5 + col;
                if (index < totalWords) {
                    // Verde si encontrada, gris si no
                    grid += this.foundWords.includes(this.words[index]) ? '🟩' : '⬛';
                } else {
                    grid += '⬛';
                }
            }
            grid += '\n';
        }
        
        // Mostrar en el modal
        const wordleGridEl = document.getElementById('wordleGrid');
        if (wordleGridEl) {
            wordleGridEl.textContent = grid;
        }
        
        return grid.trim();
    }
}

// Inicializar juego
const game = new WordSnapGame();
