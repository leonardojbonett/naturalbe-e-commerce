// Sistema de Skins y Personalización - Word Snap
const SKINS_CATALOG = {
    tiles: {
        default: {
            id: 'default',
            name: 'Clásico',
            price: 0,
            background: '#ffffff',
            border: '#e0e0e0',
            text: '#333',
            selectedBg: '#667eea',
            selectedText: '#fff',
            foundBg: '#4caf50',
            foundText: '#fff'
        },
        neon: {
            id: 'neon',
            name: 'Neón',
            price: 500,
            background: '#0a0a0a',
            border: '#00ff88',
            text: '#00ff88',
            selectedBg: '#00ff88',
            selectedText: '#0a0a0a',
            foundBg: '#ff00ff',
            foundText: '#0a0a0a',
            glow: '0 0 10px #00ff88'
        },
        pixel: {
            id: 'pixel',
            name: 'Pixel Art',
            price: 750,
            background: '#fef6e4',
            border: '#001858',
            text: '#001858',
            selectedBg: '#f582ae',
            selectedText: '#001858',
            foundBg: '#8bd3dd',
            foundText: '#001858',
            pixelated: true
        },
        futbol: {
            id: 'futbol',
            name: 'Fútbol',
            price: 600,
            background: '#2d5016',
            border: '#ffffff',
            text: '#ffffff',
            selectedBg: '#ffeb3b',
            selectedText: '#2d5016',
            foundBg: '#4caf50',
            foundText: '#ffffff',
            pattern: '⚽'
        },
        espacio: {
            id: 'espacio',
            name: 'Espacio',
            price: 800,
            background: '#0f0f23',
            border: '#4a5568',
            text: '#e2e8f0',
            selectedBg: '#667eea',
            selectedText: '#fff',
            foundBg: '#9f7aea',
            foundText: '#fff',
            stars: true
        },
        egipto: {
            id: 'egipto',
            name: 'Egipto',
            price: 900,
            background: '#f4e4c1',
            border: '#8b6914',
            text: '#5a3e1b',
            selectedBg: '#d4af37',
            selectedText: '#5a3e1b',
            foundBg: '#cd7f32',
            foundText: '#fff',
            hieroglyphs: true
        }
    },
    
    particles: {
        default: { id: 'default', name: 'Estrellas', price: 0, emoji: '⭐' },
        fire: { id: 'fire', name: 'Fuego', price: 300, emoji: '🔥' },
        hearts: { id: 'hearts', name: 'Corazones', price: 400, emoji: '💖' },
        lightning: { id: 'lightning', name: 'Rayos', price: 500, emoji: '⚡' },
        sparkles: { id: 'sparkles', name: 'Brillos', price: 350, emoji: '✨' },
        coins: { id: 'coins', name: 'Monedas', price: 450, emoji: '🪙' }
    }
};

class SkinsSystem {
    constructor() {
        this.currentTileSkin = 'default';
        this.currentParticleSkin = 'default';
        this.ownedTileSkins = ['default'];
        this.ownedParticleSkins = ['default'];
        
        this.init();
    }

    init() {
        this.loadData();
    }

    loadData() {
        this.currentTileSkin = localStorage.getItem('wsTileSkin') || 'default';
        this.currentParticleSkin = localStorage.getItem('wsParticleSkin') || 'default';
        this.ownedTileSkins = JSON.parse(localStorage.getItem('wsOwnedTileSkins') || '["default"]');
        this.ownedParticleSkins = JSON.parse(localStorage.getItem('wsOwnedParticleSkins') || '["default"]');
    }

    saveData() {
        localStorage.setItem('wsTileSkin', this.currentTileSkin);
        localStorage.setItem('wsParticleSkin', this.currentParticleSkin);
        localStorage.setItem('wsOwnedTileSkins', JSON.stringify(this.ownedTileSkins));
        localStorage.setItem('wsOwnedParticleSkins', JSON.stringify(this.ownedParticleSkins));
    }

    buySkin(type, skinId) {
        const catalog = type === 'tile' ? SKINS_CATALOG.tiles : SKINS_CATALOG.particles;
        const skin = catalog[skinId];
        
        if (!skin) return { success: false, message: 'Skin no encontrado' };
        
        const owned = type === 'tile' ? this.ownedTileSkins : this.ownedParticleSkins;
        
        if (owned.includes(skinId)) {
            return { success: false, message: 'Ya tienes este skin' };
        }

        if (window.coinsManager && window.coinsManager.spendCoins(skin.price)) {
            owned.push(skinId);
            this.saveData();
            return { success: true, message: `¡${skin.name} desbloqueado!` };
        }

        return { success: false, message: 'No tienes suficientes monedas' };
    }

    equipSkin(type, skinId) {
        const owned = type === 'tile' ? this.ownedTileSkins : this.ownedParticleSkins;
        
        if (!owned.includes(skinId)) {
            return { success: false, message: 'No tienes este skin' };
        }

        if (type === 'tile') {
            this.currentTileSkin = skinId;
        } else {
            this.currentParticleSkin = skinId;
        }

        this.saveData();
        this.applySkin();
        
        return { success: true, message: 'Skin equipado' };
    }

    applySkin() {
        const skin = SKINS_CATALOG.tiles[this.currentTileSkin];
        if (!skin) return;

        // Aplicar estilos a las celdas
        const style = document.createElement('style');
        style.id = 'dynamic-skin-styles';
        
        // Remover estilo anterior si existe
        const oldStyle = document.getElementById('dynamic-skin-styles');
        if (oldStyle) oldStyle.remove();

        style.textContent = `
            .letter-cell {
                background: ${skin.background} !important;
                border-color: ${skin.border} !important;
                color: ${skin.text} !important;
                ${skin.glow ? `box-shadow: ${skin.glow} !important;` : ''}
                ${skin.pixelated ? 'image-rendering: pixelated; font-family: "Courier New", monospace;' : ''}
            }
            
            .letter-cell.selected {
                background: ${skin.selectedBg} !important;
                color: ${skin.selectedText} !important;
                border-color: ${skin.selectedBg} !important;
            }
            
            .letter-cell.found {
                background: ${skin.foundBg} !important;
                color: ${skin.foundText} !important;
                border-color: ${skin.foundBg} !important;
            }
        `;

        document.head.appendChild(style);
    }

    getParticleEmoji() {
        const skin = SKINS_CATALOG.particles[this.currentParticleSkin];
        return skin ? skin.emoji : '⭐';
    }

    showShop() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'shopModal';

        let tilesHTML = '';
        Object.values(SKINS_CATALOG.tiles).forEach(skin => {
            const owned = this.ownedTileSkins.includes(skin.id);
            const equipped = this.currentTileSkin === skin.id;
            
            tilesHTML += `
                <div class="shop-item ${equipped ? 'equipped' : ''}">
                    <div class="shop-item-preview" style="background: ${skin.background}; border: 2px solid ${skin.border}; color: ${skin.text};">
                        A
                    </div>
                    <div class="shop-item-name">${skin.name}</div>
                    <div class="shop-item-price">${skin.price} 🪙</div>
                    ${owned 
                        ? (equipped 
                            ? '<button class="shop-btn equipped">✓ Equipado</button>'
                            : `<button class="shop-btn" onclick="skinsSystem.equipSkin('tile', '${skin.id}')">Equipar</button>`)
                        : `<button class="shop-btn buy" onclick="skinsSystem.buySkin('tile', '${skin.id}')">Comprar</button>`
                    }
                </div>
            `;
        });

        let particlesHTML = '';
        Object.values(SKINS_CATALOG.particles).forEach(skin => {
            const owned = this.ownedParticleSkins.includes(skin.id);
            const equipped = this.currentParticleSkin === skin.id;
            
            particlesHTML += `
                <div class="shop-item ${equipped ? 'equipped' : ''}">
                    <div class="shop-item-preview">${skin.emoji}</div>
                    <div class="shop-item-name">${skin.name}</div>
                    <div class="shop-item-price">${skin.price} 🪙</div>
                    ${owned 
                        ? (equipped 
                            ? '<button class="shop-btn equipped">✓ Equipado</button>'
                            : `<button class="shop-btn" onclick="skinsSystem.equipSkin('particle', '${skin.id}')">Equipar</button>`)
                        : `<button class="shop-btn buy" onclick="skinsSystem.buySkin('particle', '${skin.id}')">Comprar</button>`
                    }
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <h2>🛒 Tienda</h2>
                
                <div style="text-align: center; margin: 15px 0; font-size: 1.2em; font-weight: bold; color: #667eea;">
                    💰 ${window.coinsManager ? window.coinsManager.getCoins() : 0} monedas
                </div>

                <h3 style="margin-top: 20px;">🎨 Skins de Tiles</h3>
                <div class="shop-grid">
                    ${tilesHTML}
                </div>

                <h3 style="margin-top: 30px;">✨ Efectos de Partículas</h3>
                <div class="shop-grid">
                    ${particlesHTML}
                </div>

                <button class="modal-btn secondary" onclick="skinsSystem.closeShop()" style="margin-top: 25px; width: 100%;">
                    Cerrar
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    closeShop() {
        const modal = document.getElementById('shopModal');
        if (modal) modal.remove();
        
        // Recargar UI si es necesario
        if (window.game) {
            window.game.createGrid();
        }
    }
}

// Instancia global
window.skinsSystem = new SkinsSystem();
