// 🎮 MOTOR DE JUEGOS BASE - Microjuegos Virales
// Versión: 1.0.0

class GameEngine {
    constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Configuración
        this.width = config.width || 1080;
        this.height = config.height || 1920;
        this.fps = config.fps || 60;
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        // Setup canvas
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.resize();
        
        // Game loop
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Input
        this.mouse = { x: 0, y: 0, clicked: false };
        this.touches = [];
        
        this.setupInput();
        window.addEventListener('resize', () => this.resize());
    }
    
    setupInput() {
        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            this.updatePointerPosition(e.clientX, e.clientY);
        });
        
        this.canvas.addEventListener('mousedown', () => {
            this.mouse.clicked = true;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.clicked = false;
        });
        
        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touches = Array.from(e.touches).map(touch => {
                const coords = this.mapToCanvas(touch.clientX, touch.clientY);
                return { x: coords.x, y: coords.y };
            });
            if (e.touches[0]) {
                this.updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
            }
            this.mouse.clicked = true;
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches[0]) {
                this.updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', () => {
            this.touches = [];
            this.mouse.clicked = false;
        });
    }

    resize() {
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const scale = Math.min(viewportW / this.width, viewportH / this.height);
        this.scale = scale || 1;
        const displayW = Math.floor(this.width * this.scale);
        const displayH = Math.floor(this.height * this.scale);
        this.canvas.style.width = `${displayW}px`;
        this.canvas.style.height = `${displayH}px`;
        this.offsetX = (viewportW - displayW) / 2;
        this.offsetY = (viewportH - displayH) / 2;
    }

    mapToCanvas(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (clientX - rect.left) * (this.width / rect.width);
        const y = (clientY - rect.top) * (this.height / rect.height);
        return { x, y };
    }

    updatePointerPosition(clientX, clientY) {
        const coords = this.mapToCanvas(clientX, clientY);
        this.mouse.x = coords.x;
        this.mouse.y = coords.y;
    }
    
    start(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.loop();
    }
    
    loop(currentTime = 0) {
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (!this.paused && !this.gameOver) {
            this.updateFn(this.deltaTime);
        }
        
        this.renderFn(this.ctx);
        
        requestAnimationFrame((time) => this.loop(time));
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    drawText(text, x, y, size = 40, color = '#fff', align = 'center') {
        this.ctx.font = `bold ${size}px Arial`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.fillText(text, x, y);
    }
    
    drawRect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
    }
    
    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawRoundRect(x, y, w, h, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
            this.ctx.roundRect(x, y, w, h, radius);
        } else {
            const r = Math.min(radius, w / 2, h / 2);
            this.ctx.moveTo(x + r, y);
            this.ctx.arcTo(x + w, y, x + w, y + h, r);
            this.ctx.arcTo(x + w, y + h, x, y + h, r);
            this.ctx.arcTo(x, y + h, x, y, r);
            this.ctx.arcTo(x, y, x + w, y, r);
        }
        this.ctx.fill();
    }
    
    isClicked(x, y, w, h) {
        if (!this.mouse.clicked) return false;
        
        return this.mouse.x >= x && 
               this.mouse.x <= x + w &&
               this.mouse.y >= y && 
               this.mouse.y <= y + h;
    }
    
    reset() {
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
    }
}

// 🎨 Sistema de Partículas
class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    emit(x, y, count, config = {}) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * (config.speed || 10),
                vy: (Math.random() - 0.5) * (config.speed || 10),
                life: config.life || 1,
                maxLife: config.life || 1,
                size: config.size || 5,
                color: config.color || '#fff'
            });
        }
    }
    
    update(dt) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt;
            return p.life > 0;
        });
    }
    
    render(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}

// 🎵 Sistema de Audio Simple
class AudioSystem {
    constructor() {
        this.sounds = {};
        this.muted = false;
    }
    
    load(name, url) {
        this.sounds[name] = new Audio(url);
    }
    
    play(name, volume = 1) {
        if (this.muted || !this.sounds[name]) return;
        
        const sound = this.sounds[name].cloneNode();
        sound.volume = volume;
        sound.play();
    }
    
    toggleMute() {
        this.muted = !this.muted;
    }
}

// 🎯 Utilidades
const Utils = {
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    randomColor() {
        const colors = ['#FF006E', '#8338EC', '#3A86FF', '#FB5607', '#FFBE0B'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
};
