// 🎮 COLOR MATCH RUSH
// Solo el 2% llega al nivel 10!

const game = new GameEngine('gameCanvas', {
    width: 1080,
    height: 1920,
    fps: 60
});

const particles = new ParticleSystem();

const SHOP_URL = 'https://naturalbe.com.co/#productos';
const GAME_META = { gameId: 'color-match', gameName: 'Color Match Rush' };

// Estado del juego
let gameState = 'playing';
let level = 1;
let timeLeft = 3;
let targetColor = '';
let colorOptions = [];
let colorBoxes = [];
let sessionStarted = false;
let endHandled = false;

// Colores vibrantes
const COLORS = [
    { name: 'ROJO', hex: '#FF006E' },
    { name: 'MORADO', hex: '#8338EC' },
    { name: 'AZUL', hex: '#3A86FF' },
    { name: 'NARANJA', hex: '#FB5607' },
    { name: 'AMARILLO', hex: '#FFBE0B' },
    { name: 'VERDE', hex: '#06FFA5' },
    { name: 'ROSA', hex: '#FF69B4' },
    { name: 'CYAN', hex: '#00FFFF' }
];

// Inicializar nivel
function initLevel() {
    const numColors = Math.min(3 + Math.floor(level / 2), 6);
    colorOptions = [];
    
    // Seleccionar colores aleatorios
    const availableColors = [...COLORS];
    for (let i = 0; i < numColors; i++) {
        const idx = Utils.randomInt(0, availableColors.length - 1);
        colorOptions.push(availableColors[idx]);
        availableColors.splice(idx, 1);
    }
    
    // Color objetivo
    targetColor = colorOptions[Utils.randomInt(0, colorOptions.length - 1)];
    
    // Crear cajas de colores
    colorBoxes = [];
    const boxSize = 200;
    const spacing = 40;
    const cols = 2;
    const startY = 800;
    
    colorOptions.forEach((color, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = game.width / 2 - (cols * boxSize + (cols - 1) * spacing) / 2 + col * (boxSize + spacing);
        const y = startY + row * (boxSize + spacing);
        
        colorBoxes.push({
            x, y,
            width: boxSize,
            height: boxSize,
            color: color,
            scale: 1
        });
    });
    
    timeLeft = Math.max(2 - level * 0.1, 0.8);
}

function startSessionIfNeeded() {
    if (!sessionStarted && window.NBPlayAnalytics) {
        window.NBPlayAnalytics.init(GAME_META);
        window.NBPlayAnalytics.track('start_game', { level });
        sessionStarted = true;
    }
}

function handleGameOver() {
    if (endHandled) return;
    endHandled = true;
    const points = Math.max(10, Math.floor(game.score / 100));
    const totalPoints = window.NBPlayStorage ? window.NBPlayStorage.addPoints(points) : points;
    const coupon = window.NBPlayStorage ? window.NBPlayStorage.getOrCreateCoupon() : 'PLAY-XXXX';

    if (window.NBPlayAnalytics) {
        window.NBPlayAnalytics.track('score', { score: game.score, level });
        window.NBPlayAnalytics.track('end_game', { score: game.score, level, won: false });
    }

    const shareText = `Mi puntuacion en Color Match Rush fue ${game.score}. Juega en play.naturalbe.com.co`;
    window.NBPlayUI?.showEndScreen({
        title: 'Juego terminado',
        scoreLabel: `Score: ${game.score}`,
        pointsLabel: `Ganaste ${points} puntos (total: ${totalPoints})`,
        coupon,
        shopUrl: SHOP_URL,
        onShare: () => {
            window.NBPlayShare?.shareText({ title: 'Color Match Rush', text: shareText, url: SHOP_URL });
            window.NBPlayAnalytics?.track('share', { score: game.score, level });
        },
        onShop: () => window.NBPlayAnalytics?.track('shop_click', { source: 'end_screen' }),
        onReplay: () => {
            game.reset();
            level = 1;
            gameState = 'playing';
            initLevel();
            endHandled = false;
            window.NBPlayAnalytics?.track('start_game', { level });
        }
    });
}

// Update
function update(dt) {
    if (gameState !== 'playing') return;
    
    timeLeft -= dt;
    
    if (timeLeft <= 0) {
        gameState = 'gameover';
        handleGameOver();
        return;
    }
    
    // Animación de cajas
    colorBoxes.forEach(box => {
        const isHover = game.mouse.x >= box.x && 
                       game.mouse.x <= box.x + box.width &&
                       game.mouse.y >= box.y && 
                       game.mouse.y <= box.y + box.height;
        
        box.scale = Utils.lerp(box.scale, isHover ? 1.05 : 1, 0.2);
        
        // Click
        if (isHover && game.mouse.clicked) {
            if (box.color.name === targetColor.name) {
                // Correcto!
                game.score += level * 100;
                level++;
                particles.emit(box.x + box.width / 2, box.y + box.height / 2, 30, {
                    color: box.color.hex,
                    speed: 15,
                    life: 0.8
                });
                initLevel();
            } else {
                // Incorrecto
                gameState = 'gameover';
                particles.emit(box.x + box.width / 2, box.y + box.height / 2, 50, {
                    color: '#ff0000',
                    speed: 20,
                    life: 1
                });
                handleGameOver();
            }
            game.mouse.clicked = false;
        }
    });
    
    particles.update(dt);
}

// Render
function render(ctx) {
    game.clear();
    
    // Fondo degradado
    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);
    
    if (gameState === 'playing') {
        startSessionIfNeeded();
        // Instrucción
        game.drawText('TOCA EL COLOR:', game.width / 2, 300, 50, '#fff');
        
        // Color objetivo
        game.drawText(targetColor.name, game.width / 2, 450, 120, targetColor.hex);
        
        // Barra de tiempo
        const barWidth = 800;
        const barHeight = 30;
        const barX = (game.width - barWidth) / 2;
        const barY = 600;
        
        // Fondo barra
        game.drawRoundRect(barX, barY, barWidth, barHeight, 15, 'rgba(255,255,255,0.2)');
        
        // Barra de progreso
        const progress = Math.max(0, timeLeft / (Math.max(2 - level * 0.1, 0.8)));
        const progressColor = progress > 0.5 ? '#06FFA5' : progress > 0.25 ? '#FFBE0B' : '#FF006E';
        game.drawRoundRect(barX, barY, barWidth * progress, barHeight, 15, progressColor);
        
        // Cajas de colores
        colorBoxes.forEach(box => {
            ctx.save();
            ctx.translate(box.x + box.width / 2, box.y + box.height / 2);
            ctx.scale(box.scale, box.scale);
            ctx.translate(-box.width / 2, -box.height / 2);
            
            // Sombra
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 10;
            
            // Caja
            ctx.fillStyle = box.color.hex;
            ctx.beginPath();
            ctx.roundRect(0, 0, box.width, box.height, 20);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Partículas
        particles.render(ctx);
        
    } else if (gameState === 'gameover') {
        // Game Over
        game.drawText('GAME OVER', game.width / 2, game.height / 2 - 100, 100, '#FF006E');
        game.drawText(`Nivel alcanzado: ${level}`, game.width / 2, game.height / 2 + 50, 60, '#fff');
        game.drawText(`Score: ${game.score}`, game.width / 2, game.height / 2 + 150, 60, '#FFBE0B');
        
        // Botón reiniciar
        const btnW = 400;
        const btnH = 100;
        const btnX = (game.width - btnW) / 2;
        const btnY = game.height / 2 + 300;
        
        game.drawRoundRect(btnX, btnY, btnW, btnH, 20, '#8338EC');
        game.drawText('JUGAR DE NUEVO', game.width / 2, btnY + 65, 50, '#fff');
        
        if (game.isClicked(btnX, btnY, btnW, btnH)) {
            game.reset();
            level = 1;
            gameState = 'playing';
            initLevel();
            game.mouse.clicked = false;
        }
        
        particles.render(ctx);
    }
    
    // UI
    document.getElementById('score').textContent = `Score: ${game.score}`;
    document.getElementById('level').textContent = `Nivel ${level}`;
}

// Iniciar
initLevel();
game.start(update, render);
