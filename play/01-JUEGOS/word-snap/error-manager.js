// Error Manager - Manejo Robusto de Errores
class ErrorManager {
    constructor() {
        this.errors = [];
        this.maxErrors = 50;
        this.init();
    }

    init() {
        // Capturar errores globales
        window.onerror = (msg, src, line, col, err) => {
            this.logError({
                type: 'runtime',
                message: msg,
                source: src,
                line: line,
                column: col,
                error: err?.stack || err
            });
            return false; // No prevenir comportamiento por defecto
        };

        // Capturar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: 'promise',
                message: event.reason?.message || 'Promise rejected',
                error: event.reason
            });
        });

        // Capturar errores de recursos
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.logError({
                    type: 'resource',
                    message: `Failed to load: ${event.target.src || event.target.href}`,
                    target: event.target.tagName
                });
            }
        }, true);
    }

    logError(errorData) {
        const timestamp = new Date().toISOString();
        const error = {
            ...errorData,
            timestamp,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.errors.push(error);
        
        // Mantener solo los últimos N errores
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Guardar en localStorage para análisis
        try {
            localStorage.setItem('wsErrors', JSON.stringify(this.errors.slice(-10)));
        } catch (e) {
            // Si falla localStorage, ignorar
        }

        // Log en consola solo en desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error('[ErrorManager]', error);
        }

        // Mostrar modal de error solo para errores críticos
        if (this.isCriticalError(error)) {
            this.showErrorModal(error);
        }
    }

    isCriticalError(error) {
        const criticalPatterns = [
            'Cannot read property',
            'undefined is not',
            'null is not',
            'Failed to fetch',
            'Network request failed'
        ];

        return criticalPatterns.some(pattern => 
            error.message?.includes(pattern)
        );
    }

    showErrorModal(error) {
        // Evitar múltiples modales
        if (document.getElementById('errorModal')) return;

        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'errorModal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>⚠️ Algo salió mal</h2>
                <p style="margin: 20px 0; color: #666;">
                    Ocurrió un error inesperado. El juego intentará recuperarse automáticamente.
                </p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin: 15px 0; font-family: monospace; font-size: 0.85em; max-height: 150px; overflow-y: auto;">
                    ${error.message}
                </div>
                <div class="modal-actions">
                    <button class="modal-btn primary" onclick="errorManager.recover()">
                        🔄 Reintentar
                    </button>
                    <button class="modal-btn secondary" onclick="errorManager.closeErrorModal()">
                        Continuar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    closeErrorModal() {
        const modal = document.getElementById('errorModal');
        if (modal) modal.remove();
    }

    recover() {
        this.closeErrorModal();
        
        // Intentar recuperación según el contexto
        if (window.game) {
            try {
                // Reiniciar nivel actual
                game.restart();
            } catch (e) {
                // Si falla, recargar página
                window.location.reload();
            }
        } else {
            // Recargar página
            window.location.reload();
        }
    }

    // Fallback para generación de grid
    safeGridGeneration(game) {
        try {
            game.createGrid();
            return true;
        } catch (e) {
            this.logError({
                type: 'grid',
                message: 'Grid generation failed, using fallback',
                error: e
            });

            // Parámetros seguros de fallback
            game.gridSize = 10;
            game.words = ['WORD', 'SNAP', 'GAME', 'PLAY', 'FUN'];
            
            try {
                game.createGrid();
                return true;
            } catch (e2) {
                this.logError({
                    type: 'grid',
                    message: 'Fallback grid generation also failed',
                    error: e2
                });
                return false;
            }
        }
    }

    getErrorReport() {
        return {
            totalErrors: this.errors.length,
            errors: this.errors,
            lastError: this.errors[this.errors.length - 1],
            errorsByType: this.groupErrorsByType()
        };
    }

    groupErrorsByType() {
        const grouped = {};
        this.errors.forEach(error => {
            grouped[error.type] = (grouped[error.type] || 0) + 1;
        });
        return grouped;
    }

    clearErrors() {
        this.errors = [];
        localStorage.removeItem('wsErrors');
    }
}

// Instancia global
window.errorManager = new ErrorManager();
