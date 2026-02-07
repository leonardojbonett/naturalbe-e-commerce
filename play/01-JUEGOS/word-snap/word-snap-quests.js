// Sistema de Misiones Diarias - Word Snap
class QuestManager {
    constructor() {
        this.quests = [];
        this.progress = {};
        this.resetTime = null;
        this.init();
    }

    init() {
        this.loadProgress();
        this.checkReset();
        this.generateDailyQuests();
    }

    loadProgress() {
        const stored = localStorage.getItem('questsProgress');
        if (stored) {
            const data = JSON.parse(stored);
            this.progress = data.progress || {};
            this.resetTime = data.resetTime;
        }
    }

    saveProgress() {
        localStorage.setItem('questsProgress', JSON.stringify({
            progress: this.progress,
            resetTime: this.resetTime
        }));
    }

    checkReset() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        if (!this.resetTime || this.resetTime !== today) {
            // Reset diario
            this.resetTime = today;
            this.progress = {};
            this.saveProgress();
        }
    }

    generateDailyQuests() {
        const today = new Date().toISOString().split('T')[0];
        const seed = this.hashCode(today);
        
        // Generar 3 misiones basadas en la fecha (siempre las mismas para ese día)
        const allQuests = [
            {
                id: 'find_words',
                title: 'Encuentra 10 palabras',
                description: 'Encuentra 10 palabras en cualquier nivel',
                target: 10,
                reward: { coins: 50, boost: 'none' },
                icon: '📝'
            },
            {
                id: 'complete_level',
                title: 'Supera un nivel sin fallar',
                description: 'Completa un nivel encontrando todas las palabras',
                target: 1,
                reward: { coins: 100, boost: 'time' },
                icon: '⭐'
            },
            {
                id: 'play_levels',
                title: 'Juega 3 niveles diferentes',
                description: 'Completa 3 niveles distintos',
                target: 3,
                reward: { coins: 75, boost: 'hint' },
                icon: '🎮'
            },
            {
                id: 'speed_run',
                title: 'Completa un nivel en menos de 60s',
                description: 'Termina un nivel rápidamente',
                target: 1,
                reward: { coins: 150, boost: 'time' },
                icon: '⚡'
            },
            {
                id: 'streak',
                title: 'Mantén tu racha',
                description: 'Juega hoy para mantener tu racha',
                target: 1,
                reward: { coins: 50, boost: 'none' },
                icon: '🔥'
            }
        ];

        // Seleccionar 3 misiones basadas en el seed
        this.quests = [];
        const indices = [seed % 5, (seed + 1) % 5, (seed + 2) % 5];
        indices.forEach(i => {
            const quest = {...allQuests[i]};
            quest.progress = this.progress[quest.id] || 0;
            quest.completed = quest.progress >= quest.target;
            this.quests.push(quest);
        });
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    updateProgress(questId, amount = 1) {
        if (!this.progress[questId]) {
            this.progress[questId] = 0;
        }
        
        this.progress[questId] += amount;
        this.saveProgress();
        
        // Actualizar quest
        const quest = this.quests.find(q => q.id === questId);
        if (quest) {
            quest.progress = this.progress[questId];
            
            if (quest.progress >= quest.target && !quest.completed) {
                quest.completed = true;
                this.onQuestCompleted(quest);
            }
        }
        
        // Verificar si todas las misiones están completadas
        if (this.allQuestsCompleted()) {
            this.onAllQuestsCompleted();
        }
    }

    onQuestCompleted(quest) {
        // Dar recompensa
        if (quest.reward.coins > 0) {
            window.coinsManager?.addCoins(quest.reward.coins, `Misión: ${quest.title}`);
        }
        
        // Activar boost
        if (quest.reward.boost !== 'none') {
            this.activateBoost(quest.reward.boost);
        }
        
        // Mostrar notificación
        this.showQuestNotification(quest);
    }

    onAllQuestsCompleted() {
        // Bonus por completar todas las misiones
        const bonusCoins = 200;
        window.coinsManager?.addCoins(bonusCoins, 'Bonus: Todas las misiones');
        
        // Mostrar modal especial
        this.showAllQuestsModal();
    }

    activateBoost(boostType) {
        const boosts = JSON.parse(localStorage.getItem('activeBoosts') || '{}');
        boosts[boostType] = Date.now() + (60 * 60 * 1000); // 1 hora
        localStorage.setItem('activeBoosts', JSON.stringify(boosts));
    }

    hasActiveBoost(boostType) {
        const boosts = JSON.parse(localStorage.getItem('activeBoosts') || '{}');
        return boosts[boostType] && boosts[boostType] > Date.now();
    }

    allQuestsCompleted() {
        return this.quests.every(q => q.completed);
    }

    showQuestNotification(quest) {
        const notification = document.createElement('div');
        notification.className = 'quest-notification';
        notification.innerHTML = `
            <div class="quest-notif-icon">${quest.icon}</div>
            <div class="quest-notif-content">
                <div class="quest-notif-title">¡Misión Completada!</div>
                <div class="quest-notif-desc">${quest.title}</div>
                <div class="quest-notif-reward">+${quest.reward.coins} 🪙</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showAllQuestsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🔥 ¡Racha Conseguida!</h2>
                <p style="font-size: 1.2em; margin: 20px 0;">
                    ¡Has completado todas las misiones diarias!
                </p>
                <div class="quest-reward-big">
                    +200 🪙
                </div>
                <p style="color: #666; margin-top: 20px;">
                    Vuelve mañana para nuevas misiones
                </p>
                <button class="modal-btn primary" onclick="this.closest('.modal').remove()">
                    ¡Genial!
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    getQuests() {
        return this.quests;
    }

    getQuestProgress(questId) {
        return this.progress[questId] || 0;
    }
}

// Inicializar globalmente
window.questManager = new QuestManager();
