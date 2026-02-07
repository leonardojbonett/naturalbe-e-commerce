// Sistema de Evento Semanal Automático
class WeeklyEvent {
    constructor() {
        this.currentWeek = this.getWeekNumber();
        this.weekSeed = null;
        this.init();
    }

    init() {
        this.checkWeeklyReset();
        this.generateWeeklySeed();
    }

    getWeekNumber() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.floor(diff / oneWeek);
    }

    checkWeeklyReset() {
        const lastWeek = parseInt(localStorage.getItem('wsLastWeek') || '0', 10);
        
        if (lastWeek !== this.currentWeek) {
            // Nueva semana, resetear progreso
            localStorage.setItem('wsLastWeek', String(this.currentWeek));
            localStorage.setItem('wsWeeklyScore', '0');
            localStorage.setItem('wsWeeklyLevels', '0');
        }
    }

    generateWeeklySeed() {
        const savedSeed = localStorage.getItem('wsWeeklySeed');
        const savedWeek = parseInt(localStorage.getItem('wsWeeklySeedWeek') || '0', 10);
        
        if (savedWeek === this.currentWeek && savedSeed) {
            this.weekSeed = parseInt(savedSeed, 10);
        } else {
            // Generar nueva semilla basada en la semana
            this.weekSeed = this.currentWeek * 123456789 % 999999999;
            localStorage.setItem('wsWeeklySeed', String(this.weekSeed));
            localStorage.setItem('wsWeeklySeedWeek', String(this.currentWeek));
        }
    }

    getWeeklyChallenge() {
        // Generar desafío basado en la semilla
        const challenges = [
            { type: 'score', target: 5000, reward: 500, desc: 'Consigue 5,000 puntos esta semana' },
            { type: 'levels', target: 20, reward: 400, desc: 'Completa 20 niveles esta semana' },
            { type: 'words', target: 100, reward: 300, desc: 'Encuentra 100 palabras esta semana' },
            { type: 'hidden', target: 5, reward: 600, desc: 'Encuentra 5 palabras ocultas esta semana' },
            { type: 'marathon', target: 3, reward: 450, desc: 'Completa 3 maratones esta semana' }
        ];
        
        const index = this.weekSeed % challenges.length;
        return challenges[index];
    }

    getWeeklyProgress() {
        const challenge = this.getWeeklyChallenge();
        let current = 0;
        
        switch(challenge.type) {
            case 'score':
                current = parseInt(localStorage.getItem('wsWeeklyScore') || '0', 10);
                break;
            case 'levels':
                current = parseInt(localStorage.getItem('wsWeeklyLevels') || '0', 10);
                break;
            case 'words':
                current = parseInt(localStorage.getItem('wsWeeklyWords') || '0', 10);
                break;
            case 'hidden':
                current = parseInt(localStorage.getItem('wsWeeklyHidden') || '0', 10);
                break;
            case 'marathon':
                current = parseInt(localStorage.getItem('wsWeeklyMarathons') || '0', 10);
                break;
        }
        
        return {
            current,
            target: challenge.target,
            percentage: (current / challenge.target) * 100,
            completed: current >= challenge.target
        };
    }

    updateProgress(type, amount) {
        const key = `wsWeekly${type.charAt(0).toUpperCase() + type.slice(1)}`;
        const current = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, String(current + amount));
        
        // Verificar si se completó el desafío
        const progress = this.getWeeklyProgress();
        if (progress.completed && !this.hasClaimedReward()) {
            this.showCompletionNotification();
        }
    }

    hasClaimedReward() {
        const claimed = localStorage.getItem('wsWeeklyRewardClaimed');
        const claimedWeek = parseInt(localStorage.getItem('wsWeeklyRewardWeek') || '0', 10);
        return claimed === 'true' && claimedWeek === this.currentWeek;
    }

    claimReward() {
        const challenge = this.getWeeklyChallenge();
        const progress = this.getWeeklyProgress();
        
        if (!progress.completed) {
            return { success: false, message: 'Desafío no completado' };
        }
        
        if (this.hasClaimedReward()) {
            return { success: false, message: 'Ya reclamaste la recompensa' };
        }
        
        // Dar recompensa
        if (window.coinsManager) {
            coinsManager.addCoins(challenge.reward, 'Desafío Semanal');
        }
        
        if (window.xpManager) {
            xpManager.addXP(100, 'Desafío Semanal');
        }
        
        // Marcar como reclamado
        localStorage.setItem('wsWeeklyRewardClaimed', 'true');
        localStorage.setItem('wsWeeklyRewardWeek', String(this.currentWeek));
        
        return { success: true, reward: challenge.reward };
    }

    showCompletionNotification() {
        const notification = document.createElement('div');
        notification.className = 'weekly-completion-notification';
        notification.innerHTML = `
            <div style="font-size: 2em;">🌟</div>
            <div style="font-weight: bold; margin: 10px 0;">¡Desafío Semanal Completado!</div>
            <div style="font-size: 0.9em;">Reclama tu recompensa</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    showWeeklyModal() {
        const challenge = this.getWeeklyChallenge();
        const progress = this.getWeeklyProgress();
        const canClaim = progress.completed && !this.hasClaimedReward();
        
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'weeklyModal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🌎 Desafío Semanal</h2>
                <p style="margin: 15px 0; color: #666;">
                    Semana ${this.currentWeek} del año
                </p>
                
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 15px; margin: 20px 0;">
                    <div style="font-size: 1.2em; margin-bottom: 10px;">${challenge.desc}</div>
                    <div style="font-size: 2em; font-weight: bold; margin: 15px 0;">
                        ${progress.current} / ${challenge.target}
                    </div>
                    <div class="progress-bar" style="background: rgba(255,255,255,0.3);">
                        <div class="progress-fill" style="width: ${Math.min(progress.percentage, 100)}%; background: #4CAF50;"></div>
                    </div>
                    <div style="margin-top: 15px; font-size: 1.1em;">
                        Recompensa: ${challenge.reward} 🪙 + 100 XP
                    </div>
                </div>
                
                ${progress.completed ? 
                    `<div style="background: #4CAF50; color: white; padding: 15px; border-radius: 10px; margin: 15px 0;">
                        ✅ ¡Desafío Completado!
                    </div>` : 
                    `<div style="color: #666; margin: 15px 0;">
                        Sigue jugando para completar el desafío
                    </div>`
                }
                
                <div class="modal-actions" style="margin-top: 20px;">
                    ${canClaim ? 
                        `<button class="modal-btn primary" onclick="weeklyEvent.claimAndClose()">
                            🎁 Reclamar Recompensa
                        </button>` : ''}
                    <button class="modal-btn secondary" onclick="weeklyEvent.closeModal()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    claimAndClose() {
        const result = this.claimReward();
        if (result.success) {
            this.closeModal();
            setTimeout(() => this.showWeeklyModal(), 500);
        } else {
            alert(result.message);
        }
    }

    closeModal() {
        const modal = document.getElementById('weeklyModal');
        if (modal) modal.remove();
    }
}

// Instancia global
window.weeklyEvent = new WeeklyEvent();
