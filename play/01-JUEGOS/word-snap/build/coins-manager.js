// Sistema de Monedas y Tienda - Word Snap
class CoinsManager {
    constructor() {
        this.coins = 0;
        this.skinsOwned = [];
        this.skinEquipped = 'default';
        this.particlesOwned = [];
        this.particleEquipped = 'default';
        this.themesOwned = [];
        this.themeEquipped = 'default';
        
        this.init();
    }

    init() {
        this.loadData();
    }

    loadData() {
        this.coins = parseInt(localStorage.getItem('wsCoins') || '0', 10);
        this.skinsOwned = JSON.parse(localStorage.getItem('wsSkinsOwned') || '["default"]');
        this.skinEquipped = localStorage.getItem('wsSkinEquipped') || 'default';
        this.particlesOwned = JSON.parse(localStorage.getItem('wsParticlesOwned') || '["default"]');
        this.particleEquipped = localStorage.getItem('wsParticleEquipped') || 'default';
        this.themesOwned = JSON.parse(localStorage.getItem('wsThemesOwned') || '["default"]');
        this.themeEquipped = localStorage.getItem('wsThemeEquipped') || 'default';
    }

    saveData() {
        localStorage.setItem('wsCoins', String(this.coins));
        localStorage.setItem('wsSkinsOwned', JSON.stringify(this.skinsOwned));
        localStorage.setItem('wsSkinEquipped', this.skinEquipped);
        localStorage.setItem('wsParticlesOwned', JSON.stringify(this.particlesOwned));
        localStorage.setItem('wsParticleEquipped', this.particleEquipped);
        localStorage.setItem('wsThemesOwned', JSON.stringify(this.themesOwned));
        localStorage.setItem('wsThemeEquipped', this.themeEquipped);
    }

    addCoins(amount, reason = '') {
        this.coins += amount;
        this.saveData();
        this.updateCoinsDisplay();
        
        if (reason) {
            this.showCoinsNotification(amount, reason);
        }
    }

    spendCoins(amount) {
        if (this.coins >= amount) {
            this.coins -= amount;
            this.saveData();
            this.updateCoinsDisplay();
            return true;
        }
        return false;
    }

    getCoins() {
        return this.coins;
    }

    updateCoinsDisplay() {
        const display = document.getElementById('coinsDisplay');
        if (display) {
            display.textContent = this.coins;
        }
    }

    showCoinsNotification(amount, reason) {
        const notification = document.createElement('div');
        notification.className = 'coins-notification';
        notification.innerHTML = `
            <div class="coins-notif-amount">+${amount} 🪙</div>
            <div class="coins-notif-reason">${reason}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Sistema de Tienda
    getShopItems() {
        return {
            skins: [
                { id: 'default', name: 'Clásico', price: 0, owned: true },
                { id: 'neon', name: 'Neón', price: 500, color: '#00ff88', owned: this.skinsOwned.includes('neon') },
                { id: 'gold', name: 'Dorado', price: 1000, color: '#ffd700', owned: this.skinsOwned.includes('gold') },
                { id: 'rainbow', name: 'Arcoíris', price: 1500, gradient: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)', owned: this.skinsOwned.includes('rainbow') },
                { id: 'dark', name: 'Oscuro', price: 750, color: '#1a1a2e', owned: this.skinsOwned.includes('dark') }
            ],
            particles: [
                { id: 'default', name: 'Estrellas', price: 0, emoji: '⭐', owned: true },
                { id: 'fire', name: 'Fuego', price: 300, emoji: '🔥', owned: this.particlesOwned.includes('fire') },
                { id: 'hearts', name: 'Corazones', price: 400, emoji: '💖', owned: this.particlesOwned.includes('hearts') },
                { id: 'lightning', name: 'Rayos', price: 500, emoji: '⚡', owned: this.particlesOwned.includes('lightning') },
                { id: 'gems', name: 'Gemas', price: 600, emoji: '💎', owned: this.particlesOwned.includes('gems') }
            ],
            themes: [
                { id: 'default', name: 'Clásico', price: 0, owned: true },
                { id: 'ocean', name: 'Océano', price: 800, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', owned: this.themesOwned.includes('ocean') },
                { id: 'sunset', name: 'Atardecer', price: 800, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', owned: this.themesOwned.includes('sunset') },
                { id: 'forest', name: 'Bosque', price: 800, gradient: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', owned: this.themesOwned.includes('forest') }
            ]
        };
    }

    buyItem(category, itemId, price) {
        if (this.spendCoins(price)) {
            if (category === 'skins') {
                this.skinsOwned.push(itemId);
                this.skinEquipped = itemId;
            } else if (category === 'particles') {
                this.particlesOwned.push(itemId);
                this.particleEquipped = itemId;
            } else if (category === 'themes') {
                this.themesOwned.push(itemId);
                this.themeEquipped = itemId;
            }
            
            this.saveData();
            this.applyEquippedItems();
            return true;
        }
        return false;
    }

    equipItem(category, itemId) {
        if (category === 'skins' && this.skinsOwned.includes(itemId)) {
            this.skinEquipped = itemId;
        } else if (category === 'particles' && this.particlesOwned.includes(itemId)) {
            this.particleEquipped = itemId;
        } else if (category === 'themes' && this.themesOwned.includes(itemId)) {
            this.themeEquipped = itemId;
        }
        
        this.saveData();
        this.applyEquippedItems();
    }

    applyEquippedItems() {
        // Aplicar skin de celdas
        const cells = document.querySelectorAll('.letter-cell');
        const skinData = this.getShopItems().skins.find(s => s.id === this.skinEquipped);
        
        if (skinData) {
            cells.forEach(cell => {
                if (skinData.color) {
                    cell.style.background = skinData.color;
                } else if (skinData.gradient) {
                    cell.style.background = skinData.gradient;
                }
            });
        }
        
        // Aplicar tema de fondo
        const themeData = this.getShopItems().themes.find(t => t.id === this.themeEquipped);
        if (themeData && themeData.gradient) {
            document.body.style.background = themeData.gradient;
        }
    }

    getEquippedParticle() {
        const particleData = this.getShopItems().particles.find(p => p.id === this.particleEquipped);
        return particleData ? particleData.emoji : '⭐';
    }
}

// Inicializar globalmente
window.coinsManager = new CoinsManager();
