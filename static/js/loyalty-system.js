// Sistema de Lealtad y Retención para Natural Be Colombia
// Adaptado al mercado colombiano con gamificación

(function() {
  'use strict';

  // Configuración del programa de lealtad
  const loyaltyConfig = {
    // Niveles de lealtad (adaptados a mercado colombiano)
    tiers: {
      bronze: {
        name: 'Bronce',
        minPoints: 0,
        benefits: ['Envío gratis en compras >$80.000', '5% de descuento acumulable'],
        color: '#CD7F32',
        multiplier: 1.0
      },
      silver: {
        name: 'Plata',
        minPoints: 500,
        benefits: ['Envío gratis en compras >$60.000', '10% de descuento', 'Acceso anticipado a ofertas'],
        color: '#C0C0C0',
        multiplier: 1.2
      },
      gold: {
        name: 'Oro',
        minPoints: 1500,
        benefits: ['Envío gratis siempre', '15% de descuento', 'Regalo exclusivo cada 3 compras', 'Soporte prioritario'],
        color: '#FFD700',
        multiplier: 1.5
      },
      platinum: {
        name: 'Platino',
        minPoints: 3000,
        benefits: ['Envío gratis siempre', '20% de descuento', 'Regalo en cada compra', 'Asesor personal', 'Eventos exclusivos'],
        color: '#E5E4E2',
        multiplier: 2.0
      }
    },

    // Puntos por acción (adaptados a comportamiento colombiano)
    pointsPerAction: {
      purchase: 1, // 1 punto por cada $100 COP
      review: 50,
      referral: 200,
      birthday: 300,
      socialShare: 25,
      newsletter: 100,
      firstPurchase: 500,
      repeatPurchase: 150
    },

    // Recompensas canjeables
    rewards: {
      discount_5: { points: 200, type: 'discount', value: 5, description: '5% de descuento' },
      discount_10: { points: 350, type: 'discount', value: 10, description: '10% de descuento' },
      discount_15: { points: 500, type: 'discount', value: 15, description: '15% de descuento' },
      free_shipping: { points: 150, type: 'shipping', value: 0, description: 'Envío gratis' },
      free_product: { points: 1000, type: 'product', value: 0, description: 'Producto gratis (hasta $30.000)' },
      exclusive_access: { points: 800, type: 'access', value: 0, description: 'Acceso a productos exclusivos' }
    },

    // Gamificación
    achievements: {
      first_purchase: { name: 'Primera Compra', points: 100, icon: '🛒' },
      repeat_customer: { name: 'Cliente Fiel', points: 200, icon: '💝' },
      reviewer: { name: 'Opinador Experto', points: 150, icon: '⭐' },
      sharer: { name: 'Influencer', points: 100, icon: '📱' },
      loyal: { name: 'Leal a la Marca', points: 300, icon: '👑' },
      birthday: { name: 'Cumpleañero', points: 200, icon: '🎂' }
    }
  };

  // Sistema de lealtad
  class LoyaltySystem {
    constructor() {
      this.currentUser = this.loadUserData();
      this.notifications = [];
    }

    // Cargar datos del usuario
    loadUserData() {
      const userData = localStorage.getItem('nb-loyalty-user');
      if (!userData) {
        return this.createNewUser();
      }
      return JSON.parse(userData);
    }

    // Crear nuevo usuario
    createNewUser() {
      const newUser = {
        id: this.generateUserId(),
        email: null,
        name: null,
        phone: null,
        birthday: null,
        city: null,
        points: 0,
        tier: 'bronze',
        joinDate: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        purchaseHistory: [],
        achievements: [],
        rewards: [],
        referrals: [],
        preferences: {
          newsletter: false,
          sms: false,
          whatsapp: true
        }
      };
      this.saveUserData(newUser);
      return newUser;
    }

    // Generar ID de usuario
    generateUserId() {
      return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Guardar datos del usuario
    saveUserData() {
      localStorage.setItem('nb-loyalty-user', JSON.stringify(this.currentUser));
      this.updateUI();
    }

    // Obtener tier actual del usuario
    getCurrentTier() {
      let currentTier = 'bronze';
      Object.entries(loyaltyConfig.tiers).forEach(([tierName, tierData]) => {
        if (this.currentUser.points >= tierData.minPoints) {
          currentTier = tierName;
        }
      });
      return currentTier;
    }

    // Añadir puntos
    addPoints(action, data = {}) {
      let points = loyaltyConfig.pointsPerAction[action] || 0;
      
      // Aplicar multiplicador según tier
      const tier = loyaltyConfig.tiers[this.getCurrentTier()];
      points = Math.round(points * tier.multiplier);

      // Bonus especiales
      if (action === 'purchase') {
        const purchaseAmount = data.amount || 0;
        points += Math.floor(purchaseAmount / 100); // 1 punto por cada $100
        
        // Bonus de primera compra
        if (this.currentUser.purchaseHistory.length === 0) {
          points += loyaltyConfig.pointsPerAction.firstPurchase;
        }
        
        // Bonus de compra repetida
        if (this.currentUser.purchaseHistory.length > 0) {
          points += loyaltyConfig.pointsPerAction.repeatPurchase;
        }
      }

      this.currentUser.points += points;
      this.currentUser.lastActivity = new Date().toISOString();
      
      // Verificar logros
      this.checkAchievements(action, data);
      
      // Verificar upgrade de tier
      this.checkTierUpgrade();
      
      // Notificar
      this.showNotification(`¡Ganaste ${points} puntos!`, 'success');
      
      this.saveUserData();
      return points;
    }

    // Canjear recompensa
    redeemReward(rewardId) {
      const reward = loyaltyConfig.rewards[rewardId];
      if (!reward) {
        this.showNotification('Recompensa no válida', 'error');
        return false;
      }

      if (this.currentUser.points < reward.points) {
        this.showNotification('No tienes suficientes puntos', 'error');
        return false;
      }

      this.currentUser.points -= reward.points;
      this.currentUser.rewards.push({
        id: rewardId,
        redeemedAt: new Date().toISOString(),
        used: false
      });

      this.saveUserData();
      this.showNotification(`¡Canjeaste: ${reward.description}!`, 'success');
      return true;
    }

    // Verificar logros
    checkAchievements(action, data) {
      const achievements = loyaltyConfig.achievements;
      
      // Primera compra
      if (action === 'purchase' && this.currentUser.purchaseHistory.length === 0) {
        this.unlockAchievement('first_purchase');
      }

      // Cliente fiel
      if (this.currentUser.purchaseHistory.length >= 3) {
        this.unlockAchievement('repeat_customer');
      }

      // Cumpleaños
      if (action === 'birthday') {
        this.unlockAchievement('birthday');
      }

      // Opinador
      if (action === 'review') {
        const reviewCount = this.currentUser.purchaseHistory.filter(p => p.reviewed).length;
        if (reviewCount >= 3) {
          this.unlockAchievement('reviewer');
        }
      }
    }

    // Desbloquear logro
    unlockAchievement(achievementId) {
      const achievement = loyaltyConfig.achievements[achievementId];
      if (!achievement || this.currentUser.achievements.includes(achievementId)) {
        return;
      }

      this.currentUser.achievements.push(achievementId);
      this.currentUser.points += achievement.points;
      
      this.showNotification(
        `¡Logro desbloqueado: ${achievement.name}! +${achievement.points} puntos`,
        'achievement'
      );
    }

    // Verificar upgrade de tier
    checkTierUpgrade() {
      const newTier = this.getCurrentTier();
      if (newTier !== this.currentUser.tier) {
        const oldTier = loyaltyConfig.tiers[this.currentUser.tier];
        const newTierData = loyaltyConfig.tiers[newTier];
        
        this.currentUser.tier = newTier;
        
        this.showNotification(
          `¡Felicitaciones! Ahora eres nivel ${newTierData.name}`,
          'tier-upgrade'
        );
      }
    }

    // Mostrar notificación
    showNotification(message, type = 'info') {
      // Crear elemento de notificación
      const notification = document.createElement('div');
      notification.className = `loyalty-notification loyalty-notification--${type}`;
      notification.innerHTML = `
        <div class="loyalty-notification__content">
          <span class="loyalty-notification__message">${message}</span>
          <button class="loyalty-notification__close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
      `;

      // Agregar estilos si no existen
      if (!document.getElementById('loyalty-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'loyalty-notification-styles';
        styles.textContent = `
          .loyalty-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
          }
          .loyalty-notification--success { border-left: 4px solid #10b981; }
          .loyalty-notification--error { border-left: 4px solid #ef4444; }
          .loyalty-notification--achievement { border-left: 4px solid #f59e0b; }
          .loyalty-notification--tier-upgrade { border-left: 4px solid #8b5cf6; }
          .loyalty-notification__content {
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .loyalty-notification__message {
            font-weight: 500;
            color: #374151;
          }
          .loyalty-notification__close {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #9ca3af;
          }
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
        document.head.appendChild(styles);
      }

      document.body.appendChild(notification);

      // Auto-remover después de 5 segundos
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 5000);
    }

    // Actualizar UI
    updateUI() {
      // Actualizar widget de puntos
      const pointsWidget = document.getElementById('loyalty-points-widget');
      if (pointsWidget) {
        const tier = loyaltyConfig.tiers[this.getCurrentTier()];
        pointsWidget.innerHTML = `
          <div class="loyalty-widget">
            <div class="loyalty-tier" style="color: ${tier.color}">
              <span class="loyalty-tier__name">${tier.name}</span>
              <span class="loyalty-tier__points">${this.currentUser.points} pts</span>
            </div>
            <div class="loyalty-progress">
              <div class="loyalty-progress__bar" style="width: ${this.getProgressPercentage()}%"></div>
            </div>
          </div>
        `;
      }

      // Actualizar beneficios
      const benefitsWidget = document.getElementById('loyalty-benefits');
      if (benefitsWidget) {
        const tier = loyaltyConfig.tiers[this.getCurrentTier()];
        benefitsWidget.innerHTML = `
          <h4>Tus Beneficios ${tier.name}</h4>
          <ul>
            ${tier.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
          </ul>
        `;
      }
    }

    // Obtener progreso hacia siguiente tier
    getProgressPercentage() {
      const currentTier = loyaltyConfig.tiers[this.getCurrentTier()];
      const tiers = Object.values(loyaltyConfig.tiers);
      const currentIndex = tiers.findIndex(t => t.name === currentTier.name);
      
      if (currentIndex === tiers.length - 1) return 100; // Máximo nivel
      
      const nextTier = tiers[currentIndex + 1];
      const tierRange = nextTier.minPoints - currentTier.minPoints;
      const userProgress = this.currentUser.points - currentTier.minPoints;
      
      return Math.min(100, (userProgress / tierRange) * 100);
    }

    // Integración con carrito
    integrateWithCart() {
      // Escuchar eventos del carrito
      document.addEventListener('cart-updated', (e) => {
        const cart = e.detail.cart;
        if (cart && cart.length > 0) {
          // Mostrar puntos potenciales
          const potentialPoints = Math.floor(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) / 100);
          this.showPotentialPoints(potentialPoints);
        }
      });

      // Escuchar compra completada
      document.addEventListener('purchase-completed', (e) => {
        const purchaseData = e.detail;
        this.addPoints('purchase', { amount: purchaseData.total });
        
        // Agregar al historial
        this.currentUser.purchaseHistory.push({
          id: purchaseData.id,
          date: new Date().toISOString(),
          total: purchaseData.total,
          items: purchaseData.items
        });
        
        this.saveUserData();
      });
    }

    // Mostrar puntos potenciales en carrito
    showPotentialPoints(points) {
      const potentialPointsElement = document.getElementById('cart-potential-points');
      if (potentialPointsElement) {
        potentialPointsElement.innerHTML = `
          <div class="cart-points-info">
            <span>Ganarás ${points} puntos con esta compra</span>
            <small>1 punto = $100 COP</small>
          </div>
        `;
      }
    }
  }

  // UI Component para sistema de lealtad
  class LoyaltyUI {
    constructor(loyaltySystem) {
      this.loyalty = loyaltySystem;
      this.init();
    }

    init() {
      this.createLoyaltyWidget();
      this.createRewardsModal();
      this.bindEvents();
      this.loyalty.integrateWithCart();
    }

    createLoyaltyWidget() {
      // Widget flotante de puntos
      const widget = document.createElement('div');
      widget.id = 'loyalty-points-widget';
      widget.className = 'loyalty-points-widget';
      document.body.appendChild(widget);

      // Widget en el header
      const header = document.querySelector('.market-header__top');
      if (header) {
        const pointsDisplay = document.createElement('div');
        pointsDisplay.className = 'loyalty-header-points';
        pointsDisplay.innerHTML = `
          <div class="loyalty-points-display">
            <span class="points-icon">⭐</span>
            <span class="points-text">0 pts</span>
          </div>
        `;
        header.appendChild(pointsDisplay);
      }
    }

    createRewardsModal() {
      const modal = document.createElement('div');
      modal.id = 'loyalty-rewards-modal';
      modal.className = 'loyalty-modal';
      modal.innerHTML = `
        <div class="loyalty-modal__overlay" onclick="this.parentElement.classList.remove('active')"></div>
        <div class="loyalty-modal__content">
          <div class="loyalty-modal__header">
            <h3>Canjea tus Puntos</h3>
            <button class="loyalty-modal__close" onclick="this.closest('.loyalty-modal').classList.remove('active')">×</button>
          </div>
          <div class="loyalty-modal__body">
            <div class="loyalty-user-info">
              <div class="loyalty-points-display">
                <span class="points-icon">⭐</span>
                <span class="points-text">0 pts</span>
              </div>
              <div class="loyalty-tier-display">Bronce</div>
            </div>
            <div class="loyalty-rewards-grid" id="loyalty-rewards-grid">
              <!-- Aquí se cargarán las recompensas -->
            </div>
          </div>
        </div>
      `;

      // Agregar estilos
      if (!document.getElementById('loyalty-modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'loyalty-modal-styles';
        styles.textContent = `
          .loyalty-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: none;
          }
          .loyalty-modal.active {
            display: block;
          }
          .loyalty-modal__overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
          }
          .loyalty-modal__content {
            position: relative;
            background: white;
            max-width: 600px;
            margin: 50px auto;
            border-radius: 12px;
            max-height: 80vh;
            overflow-y: auto;
          }
          .loyalty-modal__header {
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .loyalty-modal__body {
            padding: 20px;
          }
          .loyalty-user-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .loyalty-rewards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
          }
          .loyalty-reward-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
          }
          .loyalty-reward-card:hover {
            border-color: #3b82f6;
            transform: translateY(-2px);
          }
          .loyalty-reward-card.disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .loyalty-reward__points {
            font-size: 18px;
            font-weight: bold;
            color: #3b82f6;
          }
          .loyalty-reward__description {
            margin: 10px 0;
            color: #374151;
          }
          .loyalty-reward__redeem {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          }
          .loyalty-reward__redeem:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }
        `;
        document.head.appendChild(styles);
      }

      document.body.appendChild(modal);
    }

    loadRewards() {
      const grid = document.getElementById('loyalty-rewards-grid');
      if (!grid) return;

      const rewards = loyaltyConfig.rewards;
      const userPoints = this.loyalty.currentUser.points;

      grid.innerHTML = Object.entries(rewards).map(([key, reward]) => {
        const canRedeem = userPoints >= reward.points;
        return `
          <div class="loyalty-reward-card ${!canRedeem ? 'disabled' : ''}" 
               onclick="${canRedeem ? `loyaltySystem.redeemReward('${key}')` : ''}">
            <div class="loyalty-reward__points">${reward.points} pts</div>
            <div class="loyalty-reward__description">${reward.description}</div>
            <button class="loyalty-reward__redeem" ${!canRedeem ? 'disabled' : ''}>
              ${canRedeem ? 'Canjear' : `Necesitas ${reward.points - userPoints} pts más`}
            </button>
          </div>
        `;
      }).join('');
    }

    bindEvents() {
      // Botón para abrir modal de recompensas
      document.addEventListener('click', (e) => {
        if (e.target.closest('.loyalty-points-widget') || 
            e.target.closest('.loyalty-header-points')) {
          this.showRewardsModal();
        }
      });
    }

    showRewardsModal() {
      const modal = document.getElementById('loyalty-rewards-modal');
      if (modal) {
        modal.classList.add('active');
        this.loadRewards();
        this.loyalty.updateUI();
      }
    }
  }

  // Inicialización del sistema
  let loyaltySystem;
  let loyaltyUI;

  function initLoyaltySystem() {
    loyaltySystem = new LoyaltySystem();
    loyaltyUI = new LoyaltyUI(loyaltySystem);
    loyaltySystem.updateUI();
  }

  // Exponer globalmente
  window.LoyaltySystem = {
    system: loyaltySystem,
    ui: loyaltyUI,
    init: initLoyaltySystem,
    addPoints: (action, data) => {
      if (loyaltySystem) {
        return loyaltySystem.addPoints(action, data);
      }
    },
    redeemReward: (rewardId) => {
      if (loyaltySystem) {
        return loyaltySystem.redeemReward(rewardId);
      }
    }
  };

  // Auto-inicializar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoyaltySystem);
  } else {
    initLoyaltySystem();
  }

})();
