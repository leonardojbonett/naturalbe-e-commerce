// 🎮 REFLEX MASTER
// ¿Cuál es tu tiempo de reacción?

const game = new GameEngine('gameCanvas', {
    width: 1080,
    height: 1920
});

const particles = new ParticleSystem();

const SHOP_URL = 'https://naturalbe.com.co/#productos';
const GAME_META = { gameId: 'reflex-test', gameName: 'Reflex Master' };

// Estados
let gameState = 'intro'; // intro, waiting, ready, clicked, result
let round = 0;
let maxRounds = 5;
let reactionTimes = [];
let waitTime = 0;
let startTime = 0;
let backgroundColor = '#1a1a2e';
let targetColor = '#06FFA5';
let sessionStarted = false;
let endHandled = false;

// Animaciones
let pulseScale = 1;
let resultAlpha = 0;

function startRound() {
    round++;
    if (round > maxRounds) {
        gameState = 'final';
        return;
    }
    
    gameState = 'waiting';
    backgroundColor = '#1a1a2e';
    waitTime = Utils.randomInt(2000, 5000); // 2-5 segundos
    startTime = Date.now();
    startSessionIfNeeded();
}

function startSessionIfNeeded() {
    if (!sessionStarted && window.NBPlayAnalytics) {
        window.NBPlayAnalytics.init(GAME_META);
        window.NBPlayAnalytics.track('start_game', { round });
        sessionStarted = true;
    }
}

function handleGameOver() {
    if (endHandled) return;
    endHandled = true;
    const validTimes = reactionTimes.filter(t => t !== -1);
    const avgTime = validTimes.length > 0
        ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
        : 0;
    const bestTime = validTimes.length > 0
        ? Math.min(...validTimes)
        : 0;
    const scoreValue = avgTime ? Math.max(0, Math.round(1000 - avgTime)) : 0;
    const points = Math.max(10, Math.round(scoreValue / 50));
    const totalPoints = window.NBPlayStorage ? window.NBPlayStorage.addPoints(points) : points;
    const coupon = window.NBPlayStorage ? window.NBPlayStorage.getOrCreateCoupon() : 'PLAY-XXXX';

    if (window.NBPlayAnalytics) {
        window.NBPlayAnalytics.track('score', { score: scoreValue, avgTime, bestTime });
        window.NBPlayAnalytics.track('end_game', { score: scoreValue, avgTime, bestTime, won: true });
    }

    const shareText = `Mi promedio en Reflex Master fue ${avgTime}ms. Juega en play.naturalbe.com.co`;
    window.NBPlayUI?.showEndScreen({
        title: 'Resultados finales',
        scoreLabel: `Promedio: ${avgTime}ms`,
        pointsLabel: `Ganaste ${points} puntos (total: ${totalPoints})`,
        coupon,
        shopUrl: SHOP_URL,
        onShare: () => {
            window.NBPlayShare?.shareText({ title: 'Reflex Master', text: shareText, url: SHOP_URL });
            window.NBPlayAnalytics?.track('share', { avgTime, bestTime });
        },
        onShop: () => window.NBPlayAnalytics?.track('shop_click', { source: 'end_screen' }),
        onReplay: () => {
            round = 0;
            reactionTimes = [];
            gameState = 'intro';
            endHandled = false;
            window.NBPlayAnalytics?.track('start_game', { round });
        }
    });
}

function update(dt) {
    if (gameState === 'final') {
        handleGameOver();
        return;
    }
    // Animación de pulso
    pulseScale = 1 + Math.sin(Date.now() / 300) * 0.05;
    
    if (gameState === 'waiting') {
        if (Date.now() - startTime >= waitTime) {
            gameState = 'ready';
            backgroundColor = targetColor;
            startTime = Date.now();
        }
        
        // Click temprano = penalización
        if (game.mouse.clicked) {
            reactionTimes.push(-1); // Marca como fallo
            gameState = 'result';
            backgroundColor = '#FF006E';
            game.mouse.clicked = false;
        }
    }
    
    if (gameState === 'ready') {
        if (game.mouse.clicked) {
            const reactionTime = Date.now() - startTime;
            reactionTimes.push(reactionTime);
            gameState = 'result';
            backgroundColor = '#8338EC';
            resultAlpha = 0;
            
            // Partículas
            particles.emit(game.width / 2, game.height / 2, 50, {
                color: targetColor,
                speed: 20,
                life: 1
            });
            
            game.mouse.clicked = false;
        }
    }
    
    if (gameState === 'result') {
        resultAlpha = Math.min(1, resultAlpha + dt * 2);
        
        // Auto-continuar después de 2s
        if (Date.now() - startTime > 2000) {
            startRound();
        }
    }
    
    particles.update(dt);
}

function render(ctx) {
    // Fondo con transición
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, game.width, game.height);
    
    if (gameState === 'intro') {
        // Pantalla de inicio
        game.drawText('REFLEX MASTER', game.width / 2, 400, 100, '#fff');
        game.drawText('Mide tu tiempo de reacción', game.width / 2, 550, 40, 'rgba(255,255,255,0.7)');
        
        // Instrucciones
        const instructions = [
            'Espera a que la pantalla',
            'se ponga VERDE',
            '',
            'Luego toca lo más rápido posible'
        ];
        
        instructions.forEach((line, i) => {
            game.drawText(line, game.width / 2, 800 + i * 60, 45, 'rgba(255,255,255,0.9)');
        });
        
        // Botón start
        ctx.save();
        ctx.translate(game.width / 2, 1400);
        ctx.scale(pulseScale, pulseScale);
        
        game.drawRoundRect(-200, -60, 400, 120, 20, targetColor);
        game.drawText('EMPEZAR', 0, 20, 60, '#1a1a2e');
        
        ctx.restore();
        
        if (game.isClicked(game.width / 2 - 200, 1400 - 60, 400, 120)) {
            startRound();
            game.mouse.clicked = false;
        }
    }
    
    if (gameState === 'waiting') {
        game.drawText('ESPERA...', game.width / 2, game.height / 2, 100, '#FF006E');
        game.drawText(`Ronda ${round}/${maxRounds}`, game.width / 2, 200, 50, 'rgba(255,255,255,0.5)');
    }
    
    if (gameState === 'ready') {
        game.drawText('¡AHORA!', game.width / 2, game.height / 2, 120, '#1a1a2e');
        game.drawText(`Ronda ${round}/${maxRounds}`, game.width / 2, 200, 50, 'rgba(0,0,0,0.5)');
    }
    
    if (gameState === 'result') {
        const lastTime = reactionTimes[reactionTimes.length - 1];
        
        ctx.globalAlpha = resultAlpha;
        
        if (lastTime === -1) {
            game.drawText('¡MUY PRONTO!', game.width / 2, game.height / 2 - 100, 80, '#FF006E');
            game.drawText('Espera al verde', game.width / 2, game.height / 2 + 50, 50, 'rgba(255,255,255,0.8)');
        } else {
            game.drawText(`${lastTime}ms`, game.width / 2, game.height / 2, 140, '#FFBE0B');
            
            // Calificación
            let rating = '';
            let ratingColor = '#fff';
            
            if (lastTime < 200) {
                rating = '⚡ INCREÍBLE';
                ratingColor = '#06FFA5';
            } else if (lastTime < 300) {
                rating = '🔥 EXCELENTE';
                ratingColor = '#3A86FF';
            } else if (lastTime < 400) {
                rating = '👍 BUENO';
                ratingColor = '#FFBE0B';
            } else {
                rating = '🐌 LENTO';
                ratingColor = '#FF006E';
            }
            
            game.drawText(rating, game.width / 2, game.height / 2 + 150, 60, ratingColor);
        }
        
        game.drawText(`Ronda ${round}/${maxRounds}`, game.width / 2, 200, 50, 'rgba(255,255,255,0.5)');
        
        ctx.globalAlpha = 1;
    }
    
    if (gameState === 'final') {
        // Resultados finales
        const validTimes = reactionTimes.filter(t => t !== -1);
        const avgTime = validTimes.length > 0 
            ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
            : 0;
        const bestTime = validTimes.length > 0 
            ? Math.min(...validTimes)
            : 0;
        
        game.drawText('RESULTADOS', game.width / 2, 300, 80, '#fff');
        
        // Promedio
        game.drawText('Promedio:', game.width / 2, 550, 50, 'rgba(255,255,255,0.7)');
        game.drawText(`${avgTime}ms`, game.width / 2, 650, 100, '#FFBE0B');
        
        // Mejor
        game.drawText('Mejor:', game.width / 2, 850, 50, 'rgba(255,255,255,0.7)');
        game.drawText(`${bestTime}ms`, game.width / 2, 950, 100, targetColor);
        
        // Comparación
        let comparison = '';
        if (avgTime < 200) {
            comparison = 'Top 1% mundial 🏆';
        } else if (avgTime < 250) {
            comparison = 'Top 10% mundial 🥇';
        } else if (avgTime < 300) {
            comparison = 'Mejor que el promedio 👍';
        } else {
            comparison = 'Sigue practicando 💪';
        }
        
        game.drawText(comparison, game.width / 2, 1150, 45, '#fff');
        
        // Botón reiniciar
        ctx.save();
        ctx.translate(game.width / 2, 1450);
        ctx.scale(pulseScale, pulseScale);
        
        game.drawRoundRect(-250, -60, 500, 120, 20, targetColor);
        game.drawText('JUGAR DE NUEVO', 0, 20, 55, '#1a1a2e');
        
        ctx.restore();
        
        if (game.isClicked(game.width / 2 - 250, 1450 - 60, 500, 120)) {
            // Reiniciar
            round = 0;
            reactionTimes = [];
            gameState = 'intro';
            game.mouse.clicked = false;
        }
    }
    
    particles.render(ctx);
}

game.start(update, render);
