// Profile Screen Logic V1.0
class ProfileScreen {
    constructor() {
        this.init();
    }
    
    init() {
        this.loadProfileData();
    }
    
    loadProfileData() {
        const profile = globalPlayer.getProfile();
        
        document.getElementById('avatarDisplay').textContent = profile.avatar;
        document.getElementById('playerNameDisplay').textContent = profile.playerName;
        document.getElementById('levelDisplay').textContent = profile.level;
        document.getElementById('xpDisplay').textContent = profile.xp;
        document.getElementById('coinsDisplay').textContent = profile.coins;
        document.getElementById('achievementsDisplay').textContent = profile.achievements.length;
        
        const totalGames = (profile.wordSnap.levelsCompleted || 0) + 
                          (profile.trivia.gamesPlayed || 0) + 
                          (profile.memoryFlip.gamesPlayed || 0);
        document.getElementById('gamesPlayedDisplay').textContent = totalGames;
        
        document.getElementById('wordSnapLevels').textContent = profile.wordSnap.levelsCompleted || 0;
        document.getElementById('wordSnapWords').textContent = profile.wordSnap.totalWords || 0;
        document.getElementById('triviaGames').textContent = profile.trivia.gamesPlayed || 0;
        document.getElementById('triviaHighScore').textContent = profile.trivia.highScore || 0;
        document.getElementById('memoryGames').textContent = profile.memoryFlip.gamesPlayed || 0;
        
        const bestTime = profile.memoryFlip.bestTime;
        if (bestTime) {
            const mins = Math.floor(bestTime / 60);
            const secs = bestTime % 60;
            document.getElementById('memoryBestTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    editName() {
        const current = globalPlayer.getProfile().playerName;
        const newName = prompt('Ingresa tu nombre:', current);
        if (newName !== null && newName.trim()) {
            globalPlayer.updatePlayerName(newName);
            this.loadProfileData();
        }
    }
    
    toggleAvatarSelector() {
        const selector = document.getElementById('avatarSelector');
        selector.style.display = selector.style.display === 'none' ? 'block' : 'none';
    }
    
    selectAvatar(avatar) {
        globalPlayer.updateAvatar(avatar);
        this.loadProfileData();
        this.toggleAvatarSelector();
    }
    
    resetProfile() {
        globalPlayer.resetProfile();
    }
}

const profileScreen = new ProfileScreen();
