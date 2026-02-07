// Sistema de Logros y Trofeos - 50 Achievements
const ACHIEVEMENTS = [
    // Básicos (10)
    { id: 'first_word', icon: '🔤', name: 'Primera Palabra', desc: 'Encuentra tu primera palabra', check: (s) => s.totalWords >= 1 },
    { id: 'find_10_words', icon: '🔍', name: 'Explorador', desc: 'Encuentra 10 palabras', check: (s) => s.totalWords >= 10 },
    { id: 'find_50_words', icon: '📝', name: 'Escritor', desc: 'Encuentra 50 palabras', check: (s) => s.totalWords >= 50 },
    { id: 'find_100_words', icon: '📚', name: 'Bibliotecario', desc: 'Encuentra 100 palabras', check: (s) => s.totalWords >= 100 },
    { id: 'find_500_words', icon: '🎓', name: 'Erudito', desc: 'Encuentra 500 palabras', check: (s) => s.totalWords >= 500 },
    { id: 'level_5', icon: '🏅', name: 'Novato', desc: 'Alcanza el nivel 5', check: (s) => s.playerLevel >= 5 },
    { id: 'level_10', icon: '🥈', name: 'Aprendiz', desc: 'Alcanza el nivel 10', check: (s) => s.playerLevel >= 10 },
    { id: 'level_25', icon: '🥇', name: 'Experto', desc: 'Alcanza el nivel 25', check: (s) => s.playerLevel >= 25 },
    { id: 'level_50', icon: '👑', name: 'Maestro', desc: 'Alcanza el nivel 50', check: (s) => s.playerLevel >= 50 },
    { id: 'level_100', icon: '💎', name: 'Leyenda', desc: 'Alcanza el nivel 100', check: (s) => s.playerLevel >= 100 },
    
    // Niveles de campaña (10)
    { id: 'complete_10', icon: '🎯', name: 'Principiante', desc: 'Completa 10 niveles', check: (s) => s.levelsCompleted >= 10 },
    { id: 'complete_25', icon: '🎪', name: 'Aventurero', desc: 'Completa 25 niveles', check: (s) => s.levelsCompleted >= 25 },
    { id: 'complete_50', icon: '🎨', name: 'Coleccionista', desc: 'Completa 50 niveles', check: (s) => s.levelsCompleted >= 50 },
    { id: 'complete_75', icon: '🌟', name: 'Campeón', desc: 'Completa 75 niveles', check: (s) => s.levelsCompleted >= 75 },
    { id: 'complete_100', icon: '🏆', name: 'Conquistador', desc: 'Completa los 100 niveles', check: (s) => s.levelsCompleted >= 100 },
    { id: 'perfect_level', icon: '💯', name: 'Perfección', desc: 'Completa un nivel sin errores', check: (s) => s.perfectLevels >= 1 },
    { id: 'speed_demon', icon: '⚡', name: 'Velocista', desc: 'Completa un nivel en menos de 30s', check: (s) => s.fastestLevel <= 30 },
    { id: 'time_master', icon: '⏱️', name: 'Maestro del Tiempo', desc: 'Completa 10 niveles en menos de 60s', check: (s) => s.fastLevels >= 10 },
    { id: 'no_hints', icon: '🧠', name: 'Cerebrito', desc: 'Completa 5 niveles sin pistas', check: (s) => s.noHintLevels >= 5 },
    { id: 'all_categories', icon: '🌈', name: 'Polímata', desc: 'Completa niveles de todas las categorías', check: (s) => s.categoriesCompleted >= 8 },
    
    // Palabras ocultas (5)
    { id: 'hidden_1', icon: '💎', name: 'Cazador', desc: 'Encuentra 1 palabra oculta', check: (s) => s.hiddenWords >= 1 },
    { id: 'hidden_5', icon: '🔮', name: 'Detective', desc: 'Encuentra 5 palabras ocultas', check: (s) => s.hiddenWords >= 5 },
    { id: 'hidden_10', icon: '🕵️', name: 'Investigador', desc: 'Encuentra 10 palabras ocultas', check: (s) => s.hiddenWords >= 10 },
    { id: 'hidden_all', icon: '👁️', name: 'Vidente', desc: 'Encuentra todas las palabras ocultas', check: (s) => s.hiddenWords >= 5 },
    { id: 'hidden_streak', icon: '🎯', name: 'Racha Oculta', desc: 'Encuentra 3 palabras ocultas seguidas', check: (s) => s.hiddenStreak >= 3 },
    
    // Monedas (5)
    { id: 'coins_100', icon: '💰', name: 'Ahorrador', desc: 'Acumula 100 monedas', check: (s) => s.totalCoins >= 100 },
    { id: 'coins_500', icon: '💵', name: 'Rico', desc: 'Acumula 500 monedas', check: (s) => s.totalCoins >= 500 },
    { id: 'coins_1000', icon: '💸', name: 'Millonario', desc: 'Acumula 1,000 monedas', check: (s) => s.totalCoins >= 1000 },
    { id: 'coins_5000', icon: '🏦', name: 'Magnate', desc: 'Acumula 5,000 monedas', check: (s) => s.totalCoins >= 5000 },
    { id: 'spend_1000', icon: '🛍️', name: 'Comprador', desc: 'Gasta 1,000 monedas', check: (s) => s.coinsSpent >= 1000 },
    
    // Racha y consistencia (10)
    { id: 'streak_3', icon: '🔥', name: 'Racha Inicial', desc: '3 días consecutivos', check: (s) => s.streak >= 3 },
    { id: 'streak_7', icon: '🌟', name: 'Semana Completa', desc: '7 días consecutivos', check: (s) => s.streak >= 7 },
    { id: 'streak_14', icon: '💫', name: 'Dos Semanas', desc: '14 días consecutivos', check: (s) => s.streak >= 14 },
    { id: 'streak_30', icon: '🎆', name: 'Mes Completo', desc: '30 días consecutivos', check: (s) => s.streak >= 30 },
    { id: 'daily_5', icon: '📅', name: 'Fiel', desc: 'Reclama 5 recompensas diarias', check: (s) => s.dailyClaims >= 5 },
    { id: 'play_100_days', icon: '🗓️', name: 'Veterano', desc: 'Juega 100 días diferentes', check: (s) => s.daysPlayed >= 100 },
    { id: 'marathon_5', icon: '🏃', name: 'Corredor', desc: 'Completa 5 maratones', check: (s) => s.marathonsCompleted >= 5 },
    { id: 'marathon_10', icon: '🏃‍♂️', name: 'Atleta', desc: 'Completa 10 maratones', check: (s) => s.marathonsCompleted >= 10 },
    { id: 'marathon_record', icon: '🥇', name: 'Récord Maratón', desc: 'Completa 10+ niveles en maratón', check: (s) => s.marathonBestLevels >= 10 },
    { id: 'high_score', icon: '📊', name: 'Puntuación Alta', desc: 'Consigue 1,000 puntos en un nivel', check: (s) => s.maxScore >= 1000 },
    
    // Skins y personalización (5)
    { id: 'buy_skin', icon: '🎨', name: 'Fashionista', desc: 'Compra tu primer skin', check: (s) => s.skinsOwned >= 2 },
    { id: 'all_skins', icon: '👔', name: 'Coleccionista de Moda', desc: 'Desbloquea todos los skins', check: (s) => s.skinsOwned >= 6 },
    { id: 'buy_particle', icon: '✨', name: 'Efectos Especiales', desc: 'Compra un efecto de partículas', check: (s) => s.particlesOwned >= 2 },
    { id: 'all_particles', icon: '🎆', name: 'Pirotécnico', desc: 'Desbloquea todos los efectos', check: (s) => s.particlesOwned >= 6 },
    { id: 'customize', icon: '🎭', name: 'Personalizado', desc: 'Equipa un skin y un efecto', check: (s) => s.customized },
    
    // Especiales (5)
    { id: 'night_owl', icon: '🦉', name: 'Búho Nocturno', desc: 'Juega después de medianoche', check: (s) => s.playedAtNight },
    { id: 'early_bird', icon: '🐦', name: 'Madrugador', desc: 'Juega antes de las 6 AM', check: (s) => s.playedEarly },
    { id: 'share_score', icon: '📤', name: 'Compartidor', desc: 'Comparte tu puntuación', check: (s) => s.shared >= 1 },
    { id: 'challenge_friend', icon: '🎯', name: 'Retador', desc: 'Reta a un amigo', check: (s) => s.challenged >= 1 },
    { id: 'complete_challenge', icon: '🏅', name: 'Aceptado', desc: 'Completa un reto de amigo', check: (s) => s.challengesCompleted >= 1 },
    
    // Trivia Challenge (10)
    { id: 'first_trivia', icon: '🧠', name: 'Primer Quiz', desc: 'Completa tu primera partida de Trivia', check: (s) => s.triviaGamesPlayed >= 1 },
    { id: 'trivia_streak_5', icon: '🔥', name: 'Cerebro en Llama', desc: 'Racha de 5 respuestas correctas en Trivia', check: (s) => s.triviaMaxStreak >= 5 },
    { id: 'trivia_perfect', icon: '💯', name: 'Perfeccionista', desc: '10/10 respuestas correctas en Trivia', check: (s) => s.triviaPerfectGames >= 1 },
    { id: 'trivia_100_questions', icon: '📚', name: 'Maratón de Trivia', desc: 'Responde 100 preguntas en total', check: (s) => s.triviaQuestionsAnswered >= 100 },
    { id: 'trivia_historian', icon: '🏛️', name: 'Historiador', desc: '20 respuestas correctas en Historia', check: (s) => s.triviaHistoryCorrect >= 20 },
    { id: 'trivia_scientist', icon: '🔬', name: 'Científico', desc: '20 respuestas correctas en Ciencia', check: (s) => s.triviaScienceCorrect >= 20 },
    { id: 'trivia_geographer', icon: '🌍', name: 'Geógrafo', desc: '20 respuestas correctas en Geografía', check: (s) => s.triviaGeographyCorrect >= 20 },
    { id: 'trivia_pop_culture', icon: '🎬', name: 'Cinéfilo', desc: '20 respuestas correctas en Cultura Pop', check: (s) => s.triviaPopCultureCorrect >= 20 },
    { id: 'trivia_athlete', icon: '⚽', name: 'Deportista', desc: '20 respuestas correctas en Deportes', check: (s) => s.triviaSportsCorrect >= 20 },
    { id: 'trivia_tech', icon: '💻', name: 'Tecnólogo', desc: '20 respuestas correctas en Tecnología', check: (s) => s.triviaTechCorrect >= 20 },
    
    // Memory Flip (5)
    { id: 'first_memory', icon: '🧩', name: 'Primer Match', desc: 'Completa tu primera partida de Memory Flip', check: (s) => s.memoryGamesPlayed >= 1 },
    { id: 'memory_perfect', icon: '💯', name: 'Memoria de Acero', desc: 'Completa un juego sin fallos', check: (s) => s.memoryPerfectGames >= 1 },
    { id: 'memory_fast', icon: '⚡', name: 'Reloj Humano', desc: 'Termina en menos de 30 segundos', check: (s) => s.memoryFastGames >= 1 },
    { id: 'memory_300_moves', icon: '🎯', name: '300 Movimientos', desc: 'Acumula 300 movimientos totales', check: (s) => s.memoryTotalMoves >= 300 },
    { id: 'memory_master', icon: '🏆', name: 'Maestro de la Memoria', desc: 'Completa 10 juegos perfectos', check: (s) => s.memoryPerfectGames >= 10 }
];

class AchievementsManager {
    constructor() {
        this.unlocked = JSON.parse(localStorage.getItem('wsAchievements') || '[]');
        this.newUnlocks = [];
    }

    checkAchievements() {
        const stats = this.getStats();
        const newUnlocks = [];

        ACHIEVEMENTS.forEach(achievement => {
            if (!this.unlocked.includes(achievement.id)) {
                if (achievement.check(stats)) {
                    this.unlocked.push(achievement.id);
                    newUnlocks.push(achievement);
                }
            }
        });

        if (newUnlocks.length > 0) {
            this.saveUnlocked();
            this.showUnlockNotifications(newUnlocks);
        }

        return newUnlocks;
    }

    getStats() {
        return {
            totalWords: parseInt(localStorage.getItem('wsTotalWordsFound') || '0', 10),
            playerLevel: parseInt(localStorage.getItem('wsPlayerLevel') || '1', 10),
            levelsCompleted: parseInt(localStorage.getItem('wsTotalLevelsCompleted') || '0', 10),
            hiddenWords: parseInt(localStorage.getItem('wsHiddenWordsFound') || '0', 10),
            totalCoins: parseInt(localStorage.getItem('wsCoins') || '0', 10),
            coinsSpent: parseInt(localStorage.getItem('wsCoinsSpent') || '0', 10),
            streak: parseInt(localStorage.getItem('wordSnapStreak') || '0', 10),
            daysPlayed: parseInt(localStorage.getItem('wordSnapDaysPlayed') || '0', 10),
            dailyClaims: parseInt(localStorage.getItem('wsDailyClaims') || '0', 10),
            marathonsCompleted: parseInt(localStorage.getItem('wsMarathonsCompleted') || '0', 10),
            marathonBestLevels: parseInt(localStorage.getItem('wsMarathonBestLevels') || '0', 10),
            maxScore: parseInt(localStorage.getItem('wordSnapMaxScore') || '0', 10),
            skinsOwned: JSON.parse(localStorage.getItem('wsOwnedTileSkins') || '["default"]').length,
            particlesOwned: JSON.parse(localStorage.getItem('wsOwnedParticleSkins') || '["default"]').length,
            customized: localStorage.getItem('wsTileSkin') !== 'default' || localStorage.getItem('wsParticleSkin') !== 'default',
            shared: parseInt(localStorage.getItem('wsShared') || '0', 10),
            challenged: parseInt(localStorage.getItem('wsChallenged') || '0', 10),
            challengesCompleted: parseInt(localStorage.getItem('wsChallengesCompleted') || '0', 10),
            playedAtNight: localStorage.getItem('wsPlayedAtNight') === 'true',
            playedEarly: localStorage.getItem('wsPlayedEarly') === 'true',
            perfectLevels: parseInt(localStorage.getItem('wsPerfectLevels') || '0', 10),
            fastestLevel: parseInt(localStorage.getItem('wsFastestLevel') || '999', 10),
            fastLevels: parseInt(localStorage.getItem('wsFastLevels') || '0', 10),
            noHintLevels: parseInt(localStorage.getItem('wsNoHintLevels') || '0', 10),
            categoriesCompleted: parseInt(localStorage.getItem('wsCategoriesCompleted') || '0', 10),
            hiddenStreak: parseInt(localStorage.getItem('wsHiddenStreak') || '0', 10)
        };
    }

    saveUnlocked() {
        localStorage.setItem('wsAchievements', JSON.stringify(this.unlocked));
    }

    showUnlockNotifications(achievements) {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                this.showUnlockNotification(achievement);
                
                // Sonido
                if (window.audioManager) {
                    audioManager.play('levelComplete');
                }
                
                // XP bonus
                if (window.xpManager) {
                    xpManager.addXP(25, `Logro: ${achievement.name}`);
                }
            }, index * 1000);
        });
    }

    showUnlockNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-title">¡Logro Desbloqueado!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    showAchievementsModal() {
        const stats = this.getStats();
        const unlockedCount = this.unlocked.length;
        const totalCount = ACHIEVEMENTS.length;

        let achievementsHTML = '';
        ACHIEVEMENTS.forEach(achievement => {
            const isUnlocked = this.unlocked.includes(achievement.id);
            achievementsHTML += `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-card-icon">${isUnlocked ? achievement.icon : '🔒'}</div>
                    <div class="achievement-card-name">${achievement.name}</div>
                    <div class="achievement-card-desc">${achievement.desc}</div>
                    ${isUnlocked ? '<div class="achievement-unlocked-badge">✓</div>' : ''}
                </div>
            `;
        });

        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'achievementsModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <h2>🏆 Logros</h2>
                <div style="text-align: center; margin: 15px 0; font-size: 1.2em;">
                    <span style="color: #4CAF50; font-weight: bold;">${unlockedCount}</span>
                    <span style="color: #666;"> / ${totalCount} desbloqueados</span>
                </div>
                <div class="progress-bar" style="margin: 15px 0;">
                    <div class="progress-fill" style="width: ${(unlockedCount/totalCount)*100}%; background: linear-gradient(90deg, #FFD700, #FFA500);"></div>
                </div>
                <div class="achievements-grid">
                    ${achievementsHTML}
                </div>
                <button class="modal-btn secondary" onclick="achievementsManager.closeModal()" style="margin-top: 20px; width: 100%;">
                    Cerrar
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    closeModal() {
        const modal = document.getElementById('achievementsModal');
        if (modal) modal.remove();
    }

    getProgress() {
        return {
            unlocked: this.unlocked.length,
            total: ACHIEVEMENTS.length,
            percentage: (this.unlocked.length / ACHIEVEMENTS.length) * 100
        };
    }
}

// Instancia global
window.achievementsManager = new AchievementsManager();
