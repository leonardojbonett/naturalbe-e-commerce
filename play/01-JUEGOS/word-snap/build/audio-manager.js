// Audio Manager - Sistema de Sonido para Word Snap
class AudioManager {
    constructor() {
        this.enabled = localStorage.getItem('wsSoundEnabled') !== 'false';
        this.sounds = {};
        this.initSounds();
    }

    initSounds() {
        // Crear sonidos sintéticos usando Web Audio API
        this.audioContext = null;
        
        // Inicializar contexto solo cuando se necesite (para evitar problemas de autoplay)
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    play(name) {
        if (!this.enabled || !this.audioContext) return;
        
        // Reanudar contexto si está suspendido
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        try {
            switch(name) {
                case 'click':
                    this.playClick();
                    break;
                case 'word':
                    this.playWord();
                    break;
                case 'levelComplete':
                    this.playLevelComplete();
                    break;
                case 'timeWarning':
                    this.playTimeWarning();
                    break;
                case 'hiddenWord':
                    this.playHiddenWord();
                    break;
            }
        } catch (e) {
            console.log('Audio error:', e);
        }
    }

    playClick() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    playWord() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.2);
        oscillator.type = 'triangle';
        
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    playLevelComplete() {
        // Secuencia de 3 notas ascendentes
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        notes.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            const startTime = this.audioContext.currentTime + (index * 0.15);
            
            gainNode.gain.setValueAtTime(0.2, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.3);
        });
    }

    playTimeWarning() {
        // Sonido de alerta (dos tonos alternados)
        [800, 600].forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'square';
            
            const startTime = this.audioContext.currentTime + (index * 0.15);
            
            gainNode.gain.setValueAtTime(0.1, startTime);
            gainNode.gain.setValueAtTime(0.01, startTime + 0.1);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.1);
        });
    }

    playHiddenWord() {
        // Sonido especial para palabra oculta (ascendente con vibrato)
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1600, this.audioContext.currentTime + 0.5);
        oscillator.type = 'sine';
        
        lfo.frequency.value = 6;
        lfoGain.gain.value = 20;
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        lfo.start(this.audioContext.currentTime);
        oscillator.start(this.audioContext.currentTime);
        lfo.stop(this.audioContext.currentTime + 0.5);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('wsSoundEnabled', String(this.enabled));
        return this.enabled;
    }
}

// Instancia global
window.audioManager = new AudioManager();
