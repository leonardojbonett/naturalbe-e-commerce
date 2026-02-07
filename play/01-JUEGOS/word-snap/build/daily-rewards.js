// Sistema de Recompensas Diarias - Word Snap
class DailyRewards {
    constructor() {
        this.rewards = [50, 75, 100, 150, 300]; // Días 1-5
        this.currentStreak = 0;
        this.lastClaimDate = null;
        this.canClaim = false;
        
        this.init();
    }

    init() {
        this.loadData();
        this.checkAvailability();
    }

    loadData() {
        this.currentStreak = parseInt(localStorage.getItem('wsDailyStreak') || '0', 10);
        this.lastClaimDate = localStorage.getItem('wsLastClaimDate');
    }

    saveData() {
        localStorage.setItem('wsDailyStreak', String(this.currentStreak));
        localStorage.setItem('wsLastClaimDate', this.lastClaimDate);
    }

    checkAvailability() {
        const today = new Date().toISOString().slice(0, 10);
        
        if (!this.lastClaimDate) {
            // Primera vez
            this.canClaim = true;
            return;
        }

        if (this.lastClaimDate === today) {
            // Ya reclamó hoy
            this.canClaim = false;
            return;
        }

        const lastDate = new Date(this.lastClaimDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Día consecutivo
            this.canClaim = true;
        } else if (diffDays > 1) {
            // Perdió la racha
            this.currentStreak = 0;
            this.canClaim = true;
        }
    }

    claimReward() {
        if (!this.canClaim) {
            return { success: false, message: 'Ya reclamaste tu recompensa hoy' };
        }

        const today = new Date().toISOString().slice(0, 10);
        
        // Incrementar racha
        this.currentStreak++;
        if (this.currentStreak > 5) {
            this.currentStreak = 1; // Reiniciar ciclo
        }

        // Obtener recompensa
        const reward = this.rewards[this.currentStreak - 1];
        
        // Actualizar datos
        this.lastClaimDate = today;
        this.canClaim = false;
        this.saveData();

        // Dar monedas
        if (window.coinsManager) {
            window.coinsManager.addCoins(reward, `Recompensa diaria día ${this.currentStreak}`);
        }

        return {
            success: true,
            reward: reward,
            day: this.currentStreak,
            message: `¡${reward} monedas recibidas!`
        };
    }

    getStatus() {
        return {
            canClaim: this.canClaim,
            currentStreak: this.currentStreak,
            nextReward: this.rewards[this.currentStreak] || this.rewards[0],
            allRewards: this.rewards
        };
    }

    showDailyRewardModal() {
        const status = this.getStatus();
        
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'dailyRewardModal';
        
        let rewardsHTML = '';
        this.rewards.forEach((reward, index) => {
            const day = index + 1;
            const isCurrent = day === status.currentStreak + 1;
            const isClaimed = day <= status.currentStreak && !status.canClaim;
            
            rewardsHTML += `
                <div class="daily-reward-item ${isCurrent ? 'current' : ''} ${isClaimed ? 'claimed' : ''}">
                    <div class="reward-day">Día ${day}</div>
                    <div class="reward-chest">${isClaimed ? '✅' : '🎁'}</div>
                    <div class="reward-amount">${reward} 🪙</div>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="modal-content">
                <h2>🎁 Recompensa Diaria</h2>
                <p style="margin: 15px 0; color: #666;">
                    ${status.canClaim 
                        ? `¡Reclama tu recompensa del día ${status.currentStreak + 1}!` 
                        : 'Vuelve mañana para tu siguiente recompensa'}
                </p>
                
                <div class="daily-rewards-grid">
                    ${rewardsHTML}
                </div>

                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                    <div style="font-size: 0.9em; color: #666;">Racha actual</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #667eea;">
                        ${status.currentStreak} ${status.currentStreak === 1 ? 'día' : 'días'} 🔥
                    </div>
                </div>

                <div class="modal-actions" style="margin-top: 20px;">
                    ${status.canClaim 
                        ? `<button class="modal-btn primary" onclick="dailyRewards.claimAndClose()">
                            🎁 Reclamar ${status.nextReward} 🪙
                           </button>`
                        : ''}
                    <button class="modal-btn secondary" onclick="dailyRewards.closeModal()">
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
            // Animación de cofre
            this.showChestAnimation(result.reward);
            setTimeout(() => {
                this.closeModal();
            }, 2000);
        } else {
            alert(result.message);
        }
    }

    showChestAnimation(reward) {
        const animation = document.createElement('div');
        animation.className = 'chest-animation';
        animation.innerHTML = `
            <div class="chest-opening">
                <div class="chest-icon">🎁</div>
                <div class="chest-reward">+${reward} 🪙</div>
            </div>
        `;
        
        document.body.appendChild(animation);
        
        setTimeout(() => {
            animation.remove();
        }, 2000);
    }

    closeModal() {
        const modal = document.getElementById('dailyRewardModal');
        if (modal) {
            modal.remove();
        }
    }
}

// Instancia global
window.dailyRewards = new DailyRewards();
