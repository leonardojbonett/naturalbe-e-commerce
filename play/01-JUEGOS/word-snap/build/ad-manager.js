// Ad Manager - Estructura para futuros anuncios
class AdManager {
    constructor() {
        this.adsEnabled = false; // Cambiar a true cuando se integren ads reales
        this.interstitialReady = false;
        this.rewardedReady = false;
        
        this.init();
    }

    init() {
        // Simular carga de ads (en producción, aquí iría AdMob, AdSense, etc.)
        setTimeout(() => {
            this.interstitialReady = true;
            this.rewardedReady = true;
        }, 1000);
    }

    showInterstitial(callback) {
        if (!this.adsEnabled) {
            console.log('[AdManager] Interstitial ad (simulado)');
            if (callback) callback();
            return;
        }

        // Aquí iría la lógica real de mostrar interstitial
        // Ejemplo: AdMob.showInterstitial()
        
        if (callback) callback();
    }

    showRewarded(onReward, onCancel) {
        if (!this.adsEnabled) {
            // Modo simulación: mostrar modal de confirmación
            this.showRewardedSimulation(onReward, onCancel);
            return;
        }

        // Aquí iría la lógica real de mostrar rewarded ad
        // Ejemplo: AdMob.showRewardedAd()
    }

    showRewardedSimulation(onReward, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>📺 Ver Anuncio</h2>
                <p style="margin: 20px 0; color: #666;">
                    En la versión completa, aquí verías un anuncio de 30 segundos.
                </p>
                <p style="font-weight: bold; color: #667eea;">
                    ¿Quieres simular ver el anuncio?
                </p>
                <div class="modal-actions" style="margin-top: 25px;">
                    <button class="modal-btn primary" onclick="adManager.completeRewardedSimulation(true)">
                        ✅ Sí, ver anuncio
                    </button>
                    <button class="modal-btn secondary" onclick="adManager.completeRewardedSimulation(false)">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        this.currentRewardCallback = onReward;
        this.currentCancelCallback = onCancel;
    }

    completeRewardedSimulation(watched) {
        // Cerrar modal
        const modals = document.querySelectorAll('.modal');
        modals.forEach(m => m.remove());
        
        if (watched && this.currentRewardCallback) {
            this.currentRewardCallback();
        } else if (!watched && this.currentCancelCallback) {
            this.currentCancelCallback();
        }
        
        this.currentRewardCallback = null;
        this.currentCancelCallback = null;
    }

    // Métodos de utilidad
    isInterstitialReady() {
        return this.interstitialReady;
    }

    isRewardedReady() {
        return this.rewardedReady;
    }
}

// Instancia global
window.adManager = new AdManager();
