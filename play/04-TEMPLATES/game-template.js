// 🎮 TEMPLATE DE JUEGO
// Copia este archivo y personalízalo

const game = new GameEngine('gameCanvas', {
    width: 1080,
    height: 1920,
    fps: 60
});

const particles = new ParticleSystem();

// ========================================
// VARIABLES DE JUEGO
// ========================================
let gameState = 'playing'; // playing, paused, gameover
let score = 0;
let level = 1;

// ========================================
// INICIALIZACIÓN
// ========================================
function init() {
    // Inicializa tu juego aquí
    score = 0;
    level = 1;
    gameState = 'playing';
}

// ========================================
// UPDATE - Lógica del juego
// ========================================
function update(dt) {
    if (gameState !== 'playing') return;
    
    // Tu lógica aquí
    
    // Ejemplo: Detectar click
    if (game.mouse.clicked) {
        score += 10;
        
        // Partículas en el click
        particles.emit(game.mouse.x, game.mouse.y, 20, {
            color: '#FF006E',
            speed: 10,
            life: 0.5
        });
        
        game.mouse.clicked = false;
    }
    
    // Actualizar partículas
    particles.update(dt);
}

// ========================================
// RENDER - Dibuja todo
// ========================================
function render(ctx) {
    // Limpiar pantalla
    game.clear();
    
    // Fondo
    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);
    
    if (gameState === 'playing') {
        // Título
        game.drawText('MI JUEGO', game.width / 2, 200, 80, '#fff');
        
        // Score
        game.drawText(`Score: ${score}`, game.width / 2, 350, 50, '#FFBE0B');
        
        // Instrucciones
        game.drawText('Toca la pantalla', game.width / 2, game.height / 2, 40, 'rgba(255,255,255,0.7)');
        
        // Partículas
        particles.render(ctx);
    }
    
    if (gameState === 'gameover') {
        // Game Over
        game.drawText('GAME OVER', game.width / 2, game.height / 2 - 100, 100, '#FF006E');
        game.drawText(`Score: ${score}`, game.width / 2, game.height / 2 + 50, 60, '#fff');
        
        // Botón reiniciar
        const btnW = 400;
        const btnH = 100;
        const btnX = (game.width - btnW) / 2;
        const btnY = game.height / 2 + 200;
        
        game.drawRoundRect(btnX, btnY, btnW, btnH, 20, '#8338EC');
        game.drawText('REINICIAR', game.width / 2, btnY + 65, 50, '#fff');
        
        if (game.isClicked(btnX, btnY, btnW, btnH)) {
            init();
            game.mouse.clicked = false;
        }
    }
}

// ========================================
// INICIAR JUEGO
// ========================================
init();
game.start(update, render);
