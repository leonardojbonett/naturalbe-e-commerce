// Performance Optimizer - Optimización Automática
class PerformanceOptimizer {
    constructor() {
        this.isLowEnd = this.detectLowEndDevice();
        this.settings = this.getOptimalSettings();
        this.init();
    }

    detectLowEndDevice() {
        // Detectar dispositivo de gama baja
        const checks = {
            cores: navigator.hardwareConcurrency <= 4,
            memory: navigator.deviceMemory ? navigator.deviceMemory <= 4 : false,
            connection: navigator.connection ? navigator.connection.effectiveType === '2g' || navigator.connection.effectiveType === '3g' : false
        };

        // Si 2 o más checks son true, es low-end
        const lowEndCount = Object.values(checks).filter(Boolean).length;
        return lowEndCount >= 2;
    }

    getOptimalSettings() {
        if (this.isLowEnd) {
            return {
                particles: 15, // Reducir a la mitad
                particleLifetime: 800, // Más corto
                animations: 'reduced',
                blur: false,
                shadows: false,
                confetti: 30, // Menos confetti
                fps: 30
            };
        }

        return {
            particles: 30,
            particleLifetime: 1000,
            animations: 'full',
            blur: true,
            shadows: true,
            confetti: 100,
            fps: 60
        };
    }

    init() {
        // Aplicar configuración inicial
        this.applySettings();
        
        // Monitorear performance
        this.startPerformanceMonitoring();
    }

    applySettings() {
        // Aplicar clase al body
        if (this.isLowEnd) {
            document.body.classList.add('low-end-device');
        }

        // Configurar CSS
        const style = document.createElement('style');
        style.id = 'performance-optimizations';
        
        if (!this.settings.blur) {
            style.textContent += `
                .modal { backdrop-filter: none !important; }
            `;
        }

        if (!this.settings.shadows) {
            style.textContent += `
                * { box-shadow: none !important; text-shadow: none !important; }
            `;
        }

        if (this.settings.animations === 'reduced') {
            style.textContent += `
                * { 
                    animation-duration: 0.2s !important;
                    transition-duration: 0.2s !important;
                }
            `;
        }

        document.head.appendChild(style);
    }

    startPerformanceMonitoring() {
        // Monitorear FPS
        let lastTime = performance.now();
        let frames = 0;
        let fps = 60;

        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                fps = Math.round((frames * 1000) / (currentTime - lastTime));
                frames = 0;
                lastTime = currentTime;

                // Si FPS baja mucho, reducir calidad
                if (fps < 30 && !this.isLowEnd) {
                    this.degradeQuality();
                }
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    degradeQuality() {
        console.warn('[Performance] Low FPS detected, reducing quality');
        
        // Reducir partículas
        this.settings.particles = Math.max(10, this.settings.particles - 5);
        
        // Desactivar blur
        this.settings.blur = false;
        
        // Reducir animaciones
        this.settings.animations = 'reduced';
        
        // Reaplicar configuración
        this.applySettings();
    }

    // Optimizar animaciones para usar solo GPU
    ensureGPUAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            /* Forzar GPU acceleration */
            .letter-cell,
            .modal,
            .particle,
            .confetti {
                will-change: transform, opacity;
                transform: translateZ(0);
            }

            /* Evitar animaciones de layout */
            * {
                /* No animar estas propiedades */
                transition-property: transform, opacity, filter !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Reciclar nodos DOM
    createDOMPool(className, count) {
        const pool = [];
        
        for (let i = 0; i < count; i++) {
            const element = document.createElement('div');
            element.className = className;
            element.style.display = 'none';
            document.body.appendChild(element);
            
            pool.push({
                element,
                inUse: false
            });
        }

        return pool;
    }

    getFromPool(pool) {
        const available = pool.find(item => !item.inUse);
        if (available) {
            available.inUse = true;
            available.element.style.display = 'block';
            return available;
        }
        return null;
    }

    releaseToPool(poolItem) {
        poolItem.inUse = false;
        poolItem.element.style.display = 'none';
    }

    getSettings() {
        return this.settings;
    }

    isLowEndDevice() {
        return this.isLowEnd;
    }
}

// Instancia global
window.performanceOptimizer = new PerformanceOptimizer();
