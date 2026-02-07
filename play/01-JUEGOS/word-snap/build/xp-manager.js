// XP Manager - Sistema de Experiencia y Nivel del Jugador
class XPManager {
    constructor() {
        this.xp = parseInt(localStorage.getItem('wsXP') || '0', 10);
        this.level = parseInt(localStorage.getItem('wsPlayerLevel') || '1', 10);
        this.updateRequiredXP();
    }

    updateRequiredXP() {
        // Fórmula progresiva: 100 + (nivel-1) * 25
        this.required = 100 + (this.level - 1) * 25;
    }

    addXP(amount, reason = '') {
        this.xp += amount;
        localStorage.setItem('wsXP', String(this.xp));
        
        // Mostrar notificación
        this.showXPNotification(amount, reason);
        
        // Verificar level up
        while (this.xp >= this.required) {
            this.levelUp();
        }
        
        // Actualizar UI
        this.updateUI();
    }

    levelUp() {
        this.xp -= this.required;
        this.level++;
        localStorage.setItem('wsPlayerLevel', String(this.level));
        this.updateRequiredXP();
        
        // Efectos de level up
        this.triggerLevelUpFX();
        
        // Recompensa por level up
        if (window.coinsManager) {
            const reward = 50 + (this.level * 10);
            coinsManager.addCoins(reward, `¡Nivel ${this.level}!`);
        }
    }

    triggerLevelUpFX() {
        // Sonido especial
        if (window.audioManager) {
            audioManager.play('levelComplete');
        }
        
        // Modal de level up
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content level-up-modal">
                <div class="level-up-animation">
                    <div class="level-up-star">⭐</div>
                    <h2 style="color: #FFD700; font-size: 2.5em; margin: 20px 0;">
                        ¡NIVEL ${this.level}!
                    </h2>
                    <p style="font-size: 1.2em; color: #666;">
                        Has subido de nivel
                    </p>
                    <div style="margin: 20px 0; font-size: 1.5em; color: #4CAF50;">
                        +${50 + (this.level * 10)} 🪙
                    </div>
                </div>
                <button class="modal-btn primary" onclick="xpManager.closeLevelUpModal()" style="margin-top: 20px;">
                    ¡Continuar!
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Confetti
        this.createLevelUpConfetti();
    }

    createLevelUpConfetti() {
        const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4CAF50', '#667eea'];
        
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                document.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), 3000);
            }, i * 20);
        }
    }

    closeLevelUpModal() {
        const modals = document.querySelectorAll('.level-up-modal');
        modals.forEach(m => m.closest('.modal').remove());
    }

    showXPNotification(amount, reason) {
        const notification = document.createElement('div');
        notification.className = 'xp-notification';
        notification.innerHTML = `
            <div class="xp-notif-amount">+${amount} XP</div>
            ${reason ? `<div class="xp-notif-reason">${reason}</div>` : ''}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    updateUI() {
        // Actualizar nivel
        const levelDisplay = document.getElementById('playerLevelDisplay');
        if (levelDisplay) {
            levelDisplay.textContent = this.level;
        }
        
        // Actualizar barra de XP
        const xpBar = document.getElementById('xpBar');
        if (xpBar) {
            const percentage = (this.xp / this.required) * 100;
            xpBar.style.width = `${percentage}%`;
        }
        
        // Actualizar texto de XP
        const xpText = document.getElementById('xpText');
        if (xpText) {
            xpText.textContent = `${this.xp}/${this.required}`;
        }
    }

    getLevel() {
        return this.level;
    }

    getXP() {
        return this.xp;
    }

    getProgress() {
        return {
            level: this.level,
            xp: this.xp,
            required: this.required,
            percentage: (this.xp / this.required) * 100
        };
    }
}

// Instancia global
window.xpManager = new XPManager();
