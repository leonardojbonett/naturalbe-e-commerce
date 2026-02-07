// Global Player System V1.0 - Sistema de Perfil Persistente
class GlobalPlayer {
    constructor() {
        this.profile = this.loadProfile();
    }
    
    getDefaultProfile() {
        return {
            playerName: "Jugador",
            avatar: "🎮",
            xp: 0,
            level: 1,
            coins: 0,
            achievements: [],
            wordSnap: { levelsCompleted: 0, maxLevel: 0, totalWords: 0 },
            trivia: { gamesPlayed: 0, highScore: 0, correctAnswers: 0 },
            memoryFlip: { gamesPlayed: 0, bestTime: null, bestMoves: null },
            settings: { audio: true, vibration: true },
            stats: { totalGamesPlayed: 0, totalPlayTime: 0, daysPlayed: 0 },
            createdAt: Date.now(),
            lastPlayed: Date.now()
        };
    }
    
    loadProfile() {
        try {
            const saved = localStorage.getItem('naturalbe_player_profile');
            if (saved) {
                const profile = JSON.parse(saved);
                profile.lastPlayed = Date.now();
                return profile;
            }
        } catch (e) {
            console.error('Error loading profile:', e);
        }
        return this.getDefaultProfile();
    }
    
    saveProfile() {
        try {
            localStorage.setItem('naturalbe_player_profile', JSON.stringify(this.profile));
            return true;
        } catch (e) {
            console.error('Error saving profile:', e);
            return false;
        }
    }
    
    addXP(amount) {
        this.profile.xp += amount;
        this.checkLevelUp();
        this.saveProfile();
    }
    
    checkLevelUp() {
        const xpNeeded = this.profile.level * 100;
        if (this.profile.xp >= xpNeeded) {
            this.profile.level++;
            this.profile.xp -= xpNeeded;
            this.showLevelUpNotification();
        }
    }
    
    addCoins(amount) {
        this.profile.coins += amount;
        this.saveProfile();
    }
    
    unlockAchievement(id) {
        if (!this.profile.achievements.includes(id)) {
            this.profile.achievements.push(id);
            this.saveProfile();
            return true;
        }
        return false;
    }
    
    updateGameStat(game, field, value) {
        if (this.profile[game]) {
            this.profile[game][field] = value;
            this.saveProfile();
        }
    }
    
    incrementGameStat(game, field, amount = 1) {
        if (this.profile[game]) {
            this.profile[game][field] = (this.profile[game][field] || 0) + amount;
            this.saveProfile();
        }
    }
    
    updatePlayerName(name) {
        this.profile.playerName = name.trim() || "Jugador";
        this.saveProfile();
    }
    
    updateAvatar(avatar) {
        this.profile.avatar = avatar;
        this.saveProfile();
    }
    
    resetProfile() {
        if (confirm('¿Estás seguro de que quieres reiniciar todo tu progreso? Esta acción no se puede deshacer.')) {
            this.profile = this.getDefaultProfile();
            this.saveProfile();
            alert('Perfil reiniciado correctamente');
            window.location.reload();
        }
    }
    
    showLevelUpNotification() {
        const notif = document.createElement('div');
        notif.className = 'level-up-notification';
        notif.innerHTML = `
            <div style="font-size: 3em;">🎉</div>
            <div style="font-size: 1.5em; font-weight: bold;">¡Nivel ${this.profile.level}!</div>
            <div>Has subido de nivel</div>
        `;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }
    
    getProfile() {
        return this.profile;
    }
    
    exportProfile() {
        return JSON.stringify(this.profile);
    }
    
    importProfile(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.profile = imported;
            this.saveProfile();
            return true;
        } catch (e) {
            console.error('Error importing profile:', e);
            return false;
        }
    }
}

// Inicializar sistema global
const globalPlayer = new GlobalPlayer();

// CSS para notificación
const style = document.createElement('style');
style.textContent = `
.level-up-notification {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #333;
    padding: 30px 50px;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(255, 215, 0, 0.5);
    z-index: 10000;
    text-align: center;
    animation: levelUpAnim 0.5s ease;
}
@keyframes levelUpAnim {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    50% { transform: translate(-50%, -50%) scale(1.1); }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
`;
document.head.appendChild(style);
