// Integración de Servicios Locales Colombianos - Natural Be
// Transportadoras, pagos locales y cumplimiento regulatorio

(function() {
  'use strict';

  function readNaturalBeCart() {
    try {
      const primary = localStorage.getItem('naturalbe_cart');
      const legacy = localStorage.getItem('nb-cart');
      const raw = primary || legacy || '[]';
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  // Configuración de servicios colombianos
  const colombianServices = {
    // Transportadoras colombianas
    shipping: {
      servientrega: {
        name: 'Servientrega',
        basePrice: 15000,
        freeShippingThreshold: 80000,
        deliveryTime: { min: 1, max: 3 },
        cities: [
          'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga',
          'Pereira', 'Manizales', 'Cúcuta', 'Ibagué', 'Santa Marta',
          'Villavicencio', 'Valledupar', 'Montería', 'Neiva', 'Armenia',
          'Pasto', 'Popayán', 'Riohacha', 'Sincelejo', 'Tunja'
        ],
        tracking: 'https://www.servientrega.com.co/rastreo-envios/',
        insurance: true,
        insuranceRate: 0.01 // 1% del valor declarado
      },
      coordinadora: {
        name: 'Coordinadora',
        basePrice: 12000,
        freeShippingThreshold: 100000,
        deliveryTime: { min: 2, max: 4 },
        cities: [
          'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga',
          'Pereira', 'Manizales', 'Cúcuta', 'Ibagué', 'Santa Marta',
          'Villavicencio', 'Valledupar', 'Montería', 'Neiva', 'Armenia'
        ],
        tracking: 'https://www.coordinadora.com.co/rastreo/',
        insurance: true,
        insuranceRate: 0.008 // 0.8% del valor declarado
      },
      interrapidisimo: {
        name: 'Interrapidisimo',
        basePrice: 18000,
        freeShippingThreshold: 60000,
        deliveryTime: { min: 1, max: 2 },
        cities: [
          'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga',
          'Pereira', 'Manizales', 'Cúcuta', 'Ibagué'
        ],
        tracking: 'https://www.interrapidisimo.com.co/rastreo/',
        insurance: false
      },
      envia: {
        name: 'Envía',
        basePrice: 10000,
        freeShippingThreshold: 120000,
        deliveryTime: { min: 3, max: 5 },
        cities: [
          'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga',
          'Pereira', 'Manizales', 'Cúcuta', 'Ibagué', 'Santa Marta'
        ],
        tracking: 'https://www.envia.co/rastreo/',
        insurance: true,
        insuranceRate: 0.012 // 1.2% del valor declarado
      }
    },

    // Métodos de pago locales
    payments: {
      wompi: {
        name: 'Wompi',
        type: 'gateway',
        fees: { credit: 0.0299 + 900, pse: 0.0099, nequi: 0.0099 },
        installments: [1, 2, 3, 6, 12, 18, 24],
        minInstallmentAmount: 20000,
        enabled: true
      },
      pse: {
        name: 'PSE',
        type: 'bank_transfer',
        fee: 0.0099,
        banks: [
          'Bancolombia', 'Davivienda', 'BBVA', 'Banco de Bogotá', 'Itaú',
          'Scotiabank Colpatria', 'Banco Popular', 'Banco Falabella',
          'Banco Caja Social', 'Banco Agrario', 'Banco AV Villas',
          'Banco GNB Sudameris', 'Banco WWB', 'Banco Serfinanza'
        ],
        enabled: true
      },
      nequi: {
        name: 'Nequi',
        type: 'mobile_wallet',
        fee: 0.0099,
        maxAmount: 2000000,
        enabled: true
      },
      daviplata: {
        name: 'DaviPlata',
        type: 'mobile_wallet',
        fee: 0.0099,
        maxAmount: 2000000,
        enabled: true
      },
      efecty: {
        name: 'Efecty',
        type: 'cash_payment',
        fee: 0.0199,
        maxAmount: 2000000,
        enabled: true
      },
      baloto: {
        name: 'Baloto',
        type: 'cash_payment',
        fee: 0.0199,
        maxAmount: 2000000,
        enabled: true
      }
    },

    // Información regulatoria INVIMA
    regulatory: {
      invima: {
        registrationRequired: true,
        categories: {
          vitaminas: 'Alimento',
          minerales: 'Alimento',
          proteinas: 'Alimento',
          colageno: 'Alimento',
          omega: 'Alimento',
          herbales: 'Medicamento Tradicional',
          deportivos: 'Suplemento Deportivo'
        },
        disclaimer: 'Producto con registro sanitario INVIMA. Consulte número de registro en el empaque.',
        requiredInfo: ['numero_registro_invima', 'fecha_vencimiento', 'lote']
      }
    },

    // Información fiscal colombiana
    tax: {
      // P0: Desactivar tasa fija hasta validar por SKU/categoría con asesor tributario.
      iva: 0,
      ivaExempt: ['medicamentos', 'alimentos básicos'],
      retencion: 0.025, // 2.5% retención en la fuente para proveedores
      ica: {
        bogota: 0.0096, // 9.6 por mil
        medellin: 0.00816, // 8.16 por mil
        cali: 0.007, // 7 por mil
        barranquilla: 0.007 // 7 por mil
      }
    }
  };

  // Sistema de envíos colombianos
  class ColombianShippingSystem {
    constructor() {
      this.selectedCity = null;
      this.selectedCarrier = null;
      this.shippingRates = {};
      this.init();
    }

    init() {
      this.createShippingCalculator();
      this.bindEvents();
      this.loadSavedLocation();
    }

    // Crear calculadora de envíos
    createShippingCalculator() {
      const calculator = document.createElement('div');
      calculator.className = 'shipping-calculator';
      calculator.innerHTML = `
        <div class="shipping-calculator__header">
          <h3>Calcular Envío</h3>
          <button class="shipping-calculator__close" onclick="this.closest('.shipping-calculator').classList.remove('active')">×</button>
        </div>
        <div class="shipping-calculator__body">
          <div class="form-group">
            <label for="shipping-city">Ciudad de entrega</label>
            <select id="shipping-city" required>
              <option value="">Selecciona tu ciudad</option>
              ${this.generateCityOptions()}
            </select>
          </div>
          <div class="form-group">
            <label for="shipping-carrier">Transportadora</label>
            <select id="shipping-carrier">
              <option value="">Todas las opciones</option>
            </select>
          </div>
          <div class="shipping-results" id="shipping-results">
            <!-- Aquí se mostrarán los resultados -->
          </div>
        </div>
      `;

      // Agregar estilos
      if (!document.getElementById('shipping-calculator-styles')) {
        const styles = document.createElement('style');
        styles.id = 'shipping-calculator-styles';
        styles.textContent = `
          .shipping-calculator {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            z-index: 1000;
            max-width: 350px;
            transform: translateY(120%);
            transition: transform 0.3s ease;
          }
          .shipping-calculator.active {
            transform: translateY(0);
          }
          .shipping-calculator__header {
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .shipping-calculator__body {
            padding: 16px;
          }
          .form-group {
            margin-bottom: 16px;
          }
          .form-group label {
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
            color: #374151;
          }
          .form-group select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
          }
          .shipping-results {
            margin-top: 16px;
          }
          .shipping-option {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .shipping-option:hover {
            border-color: #3b82f6;
            background: #f0f9ff;
          }
          .shipping-option.selected {
            border-color: #3b82f6;
            background: #eff6ff;
          }
          .shipping-option__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
          }
          .shipping-option__name {
            font-weight: 600;
            color: #1f2937;
          }
          .shipping-option__price {
            font-weight: bold;
            color: #059669;
          }
          .shipping-option__details {
            font-size: 12px;
            color: #6b7280;
          }
          .shipping-trigger {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 50%;
            width: 56px;
            height: 56px;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            z-index: 999;
            transition: transform 0.2s;
          }
          .shipping-trigger:hover {
            transform: scale(1.1);
          }
        `;
        document.head.appendChild(styles);
      }

      document.body.appendChild(calculator);

      // Botón flotante para abrir calculadora
      const trigger = document.createElement('button');
      trigger.className = 'shipping-trigger';
      trigger.innerHTML = '🚚';
      trigger.title = 'Calcular envío';
      trigger.addEventListener('click', () => {
        calculator.classList.toggle('active');
      });

      document.body.appendChild(trigger);
    }

    // Generar opciones de ciudades
    generateCityOptions() {
      const allCities = new Set();
      Object.values(colombianServices.shipping).forEach(carrier => {
        carrier.cities.forEach(city => allCities.add(city));
      });

      return Array.from(allCities)
        .sort()
        .map(city => `<option value="${city}">${city}</option>`)
        .join('');
    }

    // Cargar ubicación guardada
    loadSavedLocation() {
      const savedCity = localStorage.getItem('nb-user-city');
      if (savedCity) {
        this.selectedCity = savedCity;
        const citySelect = document.getElementById('shipping-city');
        if (citySelect) {
          citySelect.value = savedCity;
          this.calculateShipping();
        }
      }
    }

    // Bind events
    bindEvents() {
      const citySelect = document.getElementById('shipping-city');
      const carrierSelect = document.getElementById('shipping-carrier');

      if (citySelect) {
        citySelect.addEventListener('change', (e) => {
          this.selectedCity = e.target.value;
          localStorage.setItem('nb-user-city', this.selectedCity);
          this.calculateShipping();
          this.updateCarrierOptions();
        });
      }

      if (carrierSelect) {
        carrierSelect.addEventListener('change', (e) => {
          this.selectedCarrier = e.target.value;
          this.calculateShipping();
        });
      }
    }

    // Actualizar opciones de transportadora
    updateCarrierOptions() {
      const carrierSelect = document.getElementById('shipping-carrier');
      if (!carrierSelect || !this.selectedCity) return;

      const availableCarriers = Object.entries(colombianServices.shipping)
        .filter(([_, carrier]) => carrier.cities.includes(this.selectedCity));

      carrierSelect.innerHTML = '<option value="">Todas las opciones</option>' +
        availableCarriers.map(([key, carrier]) => 
          `<option value="${key}">${carrier.name}</option>`
        ).join('');
    }

    // Calcular envío
    calculateShipping() {
      if (!this.selectedCity) return;

      const cartTotal = this.getCartTotal();
      const results = document.getElementById('shipping-results');
      if (!results) return;

      let availableCarriers = Object.entries(colombianServices.shipping)
        .filter(([_, carrier]) => carrier.cities.includes(this.selectedCity));

      if (this.selectedCarrier) {
        availableCarriers = availableCarriers.filter(([key]) => key === this.selectedCarrier);
      }

      const shippingHTML = availableCarriers.map(([key, carrier]) => {
        const price = this.calculateShippingPrice(carrier, cartTotal);
        const isFree = price === 0;
        const deliveryTime = `${carrier.deliveryTime.min}-${carrier.deliveryTime.max} días`;

        return `
          <div class="shipping-option" data-carrier="${key}" onclick="colombianShipping.selectCarrier('${key}')">
            <div class="shipping-option__header">
              <span class="shipping-option__name">${carrier.name}</span>
              <span class="shipping-option__price">${isFree ? 'GRATIS' : new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP'}).format(price)}</span>
            </div>
            <div class="shipping-option__details">
              Entrega: ${deliveryTime} | ${carrier.insurance ? 'Con seguro' : 'Sin seguro'}
            </div>
          </div>
        `;
      }).join('');

      results.innerHTML = shippingHTML || '<p>No hay opciones de envío disponibles para esta ciudad.</p>';
    }

    // Calcular precio de envío
    calculateShippingPrice(carrier, cartTotal) {
      if (cartTotal >= carrier.freeShippingThreshold) {
        return 0;
      }
      return carrier.basePrice;
    }

    // Obtener total del carrito
    getCartTotal() {
      const cart = readNaturalBeCart();
      return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Seleccionar transportadora
    selectCarrier(carrierKey) {
      this.selectedCarrier = carrierKey;
      
      // Actualizar UI
      document.querySelectorAll('.shipping-option').forEach(option => {
        option.classList.remove('selected');
      });
      document.querySelector(`[data-carrier="${carrierKey}"]`).classList.add('selected');

      // Guardar selección
      localStorage.setItem('nb-selected-carrier', carrierKey);
      
      // Actualizar carrito
      this.updateCartShipping(carrierKey);

      // Trackear evento
      if (window.MobileAnalytics) {
        window.MobileAnalytics.trackEvent('shipping_carrier_selected', {
          carrier: colombianServices.shipping[carrierKey].name,
          city: this.selectedCity,
          price: this.calculateShippingPrice(colombianServices.shipping[carrierKey], this.getCartTotal())
        });
      }
    }

    // Actualizar envío en carrito
    updateCartShipping(carrierKey) {
      const carrier = colombianServices.shipping[carrierKey];
      const cartTotal = this.getCartTotal();
      const shippingPrice = this.calculateShippingPrice(carrier, cartTotal);

      // Emitir evento para actualizar carrito
      document.dispatchEvent(new CustomEvent('shipping-updated', {
        detail: {
          carrier: carrierKey,
          price: shippingPrice,
          city: this.selectedCity,
          deliveryTime: carrier.deliveryTime
        }
      }));
    }
  }

  // Sistema de pagos locales
  class ColombianPaymentSystem {
    constructor() {
      this.selectedMethod = null;
      this.init();
    }

    init() {
      this.createPaymentOptions();
      this.bindEvents();
    }

    // Crear opciones de pago
    createPaymentOptions() {
      const paymentContainer = document.querySelector('.payment-methods');
      if (!paymentContainer) return;

      const paymentHTML = Object.entries(colombianServices.payments)
        .filter(([_, payment]) => payment.enabled)
        .map(([key, payment]) => this.createPaymentOption(key, payment))
        .join('');

      paymentContainer.innerHTML = paymentHTML;
    }

    // Crear opción de pago individual
    createPaymentOption(key, payment) {
      switch (payment.type) {
        case 'gateway':
          return this.createGatewayOption(key, payment);
        case 'bank_transfer':
          return this.createPSEOption(payment);
        case 'mobile_wallet':
          return this.createWalletOption(key, payment);
        case 'cash_payment':
          return this.createCashOption(key, payment);
        default:
          return '';
      }
    }

    // Opción de gateway (Wompi)
    createGatewayOption(key, payment) {
      return `
        <div class="payment-option" data-method="${key}">
          <div class="payment-option__header">
            <input type="radio" name="payment_method" value="${key}" id="payment_${key}">
            <label for="payment_${key}">
              <img src="/static/img/${key}-logo.png" alt="${payment.name}" class="payment-logo">
              <span>${payment.name}</span>
            </label>
          </div>
          <div class="payment-option__details">
            <div class="installment-options" id="${key}_installments">
              ${this.generateInstallmentOptions(payment)}
            </div>
          </div>
        </div>
      `;
    }

    // Generar opciones de cuotas
    generateInstallmentOptions(payment) {
      const cartTotal = this.getCartTotal();
      return payment.installments
        .filter(months => cartTotal / months >= payment.minInstallmentAmount)
        .map(months => {
          const monthlyPayment = cartTotal / months;
          const monthlyWithFee = monthlyPayment * (1 + payment.fees.credit) + (payment.fees.credit ? payment.fees.credit * 100 : 0);
          
          return `
            <label class="installment-option">
              <input type="radio" name="installments" value="${months}">
              <span>${months} cuotas de ${new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP'}).format(monthlyWithFee)}</span>
            </label>
          `;
        }).join('');
    }

    // Opción PSE
    createPSEOption(payment) {
      return `
        <div class="payment-option" data-method="pse">
          <div class="payment-option__header">
            <input type="radio" name="payment_method" value="pse" id="payment_pse">
            <label for="payment_pse">
              <img src="/static/img/pse-logo.png" alt="PSE" class="payment-logo">
              <span>PSE - Transferencia bancaria</span>
            </label>
          </div>
          <div class="payment-option__details">
            <div class="bank-selection">
              <label for="pse_bank">Selecciona tu banco:</label>
              <select id="pse_bank" name="pse_bank">
                <option value="">Seleccionar banco</option>
                ${payment.banks.map(bank => `<option value="${bank}">${bank}</option>`).join('')}
              </select>
            </div>
            <div class="pse-info">
              <small>Comisión: ${(payment.fee * 100).toFixed(2)}%</small>
            </div>
          </div>
        </div>
      `;
    }

    // Opción de wallet móvil
    createWalletOption(key, payment) {
      return `
        <div class="payment-option" data-method="${key}">
          <div class="payment-option__header">
            <input type="radio" name="payment_method" value="${key}" id="payment_${key}">
            <label for="payment_${key}">
              <img src="/static/img/${key}-logo.png" alt="${payment.name}" class="payment-logo">
              <span>${payment.name}</span>
            </label>
          </div>
          <div class="payment-option__details">
            <div class="wallet-info">
              <small>Máximo: ${new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP'}).format(payment.maxAmount)}</small>
              <small>Comisión: ${(payment.fee * 100).toFixed(2)}%</small>
            </div>
            <div class="wallet-phone">
              <label for="${key}_phone">Número de teléfono:</label>
              <input type="tel" id="${key}_phone" name="${key}_phone" placeholder="3001234567" pattern="[0-9]{10}">
            </div>
          </div>
        </div>
      `;
    }

    // Opción de pago en efectivo
    createCashOption(key, payment) {
      return `
        <div class="payment-option" data-method="${key}">
          <div class="payment-option__header">
            <input type="radio" name="payment_method" value="${key}" id="payment_${key}">
            <label for="payment_${key}">
              <img src="/static/img/${key}-logo.png" alt="${payment.name}" class="payment-logo">
              <span>${payment.name}</span>
            </label>
          </div>
          <div class="payment-option__details">
            <div class="cash-info">
              <p>Paga en ${payment.name === 'Efecty' ? 'más de 8,000 puntos' : 'más de 10,000 puntos'} nationwide</p>
              <small>Comisión: ${(payment.fee * 100).toFixed(2)}%</small>
              <small>Máximo: ${new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP'}).format(payment.maxAmount)}</small>
            </div>
          </div>
        </div>
      `;
    }

    // Bind events
    bindEvents() {
      document.addEventListener('change', (e) => {
        if (e.target.name === 'payment_method') {
          this.selectedMethod = e.target.value;
          this.showPaymentDetails(e.target.value);
          
          // Trackear selección
          if (window.MobileAnalytics) {
            window.MobileAnalytics.trackEvent('payment_method_selected', {
              method: this.selectedMethod
            });
          }
        }
      });
    }

    // Mostrar detalles de pago
    showPaymentDetails(method) {
      // Ocultar todos los detalles
      document.querySelectorAll('.payment-option__details').forEach(details => {
        details.style.display = 'none';
      });

      // Mostrar detalles del método seleccionado
      const selectedOption = document.querySelector(`[data-method="${method}"] .payment-option__details`);
      if (selectedOption) {
        selectedOption.style.display = 'block';
      }
    }

    // Obtener total del carrito
    getCartTotal() {
      const cart = readNaturalBeCart();
      return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Procesar pago
    processPayment(paymentData) {
      const payment = colombianServices.payments[this.selectedMethod];
      
      switch (payment.type) {
        case 'gateway':
          return this.processGatewayPayment(paymentData);
        case 'bank_transfer':
          return this.processPSEPayment(paymentData);
        case 'mobile_wallet':
          return this.processWalletPayment(paymentData);
        case 'cash_payment':
          return this.processCashPayment(paymentData);
        default:
          return Promise.reject('Método de pago no soportado');
      }
    }

    // Procesar pago gateway (Wompi)
    processGatewayPayment(paymentData) {
      return new Promise((resolve, reject) => {
        if (typeof window.WompiCheckout !== 'undefined') {
          const checkout = new window.WompiCheckout({
            currency: 'COP',
            amountInCents: Math.round(paymentData.total * 100),
            reference: paymentData.reference,
            publicKey: window.NB_WOMPI_CONFIG.publicKey,
            redirectURL: window.NB_WOMPI_CONFIG.successUrl
          });

          checkout.open((result) => {
            if (result.transaction.status === 'APPROVED') {
              resolve(result);
            } else {
              reject(result);
            }
          });
        } else {
          reject('Wompi no está disponible');
        }
      });
    }

    // Procesar pago PSE
    processPSEPayment(paymentData) {
      // Aquí iría la integración con PSE
      return Promise.resolve({
        status: 'PENDING',
        message: 'Transferencia iniciada',
        bank: document.getElementById('pse_bank')?.value
      });
    }

    // Procesar pago wallet
    processWalletPayment(paymentData) {
      // Aquí iría la integración con Nequi/DaviPlata
      return Promise.resolve({
        status: 'PENDING',
        message: 'Pago móvil iniciado',
        phone: document.getElementById(`${this.selectedMethod}_phone`)?.value
      });
    }

    // Procesar pago en efectivo
    processCashPayment(paymentData) {
      // Aquí iría la integración con Efecty/Baloto
      return Promise.resolve({
        status: 'PENDING',
        message: 'Referencia de pago generada',
        reference: this.generateCashReference()
      });
    }

    // Generar referencia de pago en efectivo
    generateCashReference() {
      return Date.now().toString().slice(-8);
    }
  }

  // Sistema de cumplimiento regulatorio
  class RegulatoryCompliance {
    constructor() {
      this.init();
    }

    init() {
      this.addINVIMADisclaimers();
      this.addTaxInformation();
      this.addLegalNotices();
    }

    // Agregar disclaimers de INVIMA
    addINVIMADisclaimers() {
      const products = document.querySelectorAll('.product-card');
      products.forEach(card => {
        const productId = card.dataset.productId;
        const product = this.getProductData(productId);
        
        if (product && this.needsINVIMADisclaimer(product)) {
          const disclaimer = document.createElement('div');
          disclaimer.className = 'invima-disclaimer';
          disclaimer.innerHTML = `
            <small>🏥 ${colombianServices.regulatory.invima.disclaimer}</small>
            <small>Registro INVIMA: ${product.numero_registro_invima || 'Pendiente'}</small>
          `;
          card.appendChild(disclaimer);
        }
      });
    }

    // Verificar si necesita disclaimer de INVIMA
    needsINVIMADisclaimer(product) {
      const category = colombianServices.regulatory.invima.categories[product.categoria];
      return category === 'Alimento' || category === 'Suplemento Deportivo';
    }

    // Obtener datos del producto
    getProductData(productId) {
      if (window.ALL_PRODUCTS) {
        return window.ALL_PRODUCTS.find(p => p.id === productId);
      }
      return null;
    }

    // Agregar información fiscal
    addTaxInformation() {
      const checkout = document.querySelector('.checkout-summary');
      if (checkout) {
        const taxInfo = document.createElement('div');
        taxInfo.className = 'tax-information';
        taxInfo.innerHTML = `
          <div class="tax-breakdown">
            <div class="tax-item">
              <span>Subtotal:</span>
              <span id="tax-subtotal">$0</span>
            </div>
            <div class="tax-item">
              <span>IVA:</span>
              <span id="tax-iva">$0</span>
            </div>
            <div class="tax-item">
              <span>Envío:</span>
              <span id="tax-shipping">$0</span>
            </div>
            <div class="tax-item total">
              <span>Total:</span>
              <span id="tax-total">$0</span>
            </div>
          </div>
        `;
        checkout.appendChild(taxInfo);
        this.updateTaxCalculation();
      }
    }

    // Actualizar cálculo de impuestos
    updateTaxCalculation() {
      const cart = readNaturalBeCart();
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const iva = Math.round(subtotal * colombianServices.tax.iva);
      const shipping = this.getShippingCost();
      const total = subtotal + iva + shipping;

      document.getElementById('tax-subtotal').textContent = new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP'}).format(subtotal);
      document.getElementById('tax-iva').textContent = new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP'}).format(iva);
      document.getElementById('tax-shipping').textContent = new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP'}).format(shipping);
      document.getElementById('tax-total').textContent = new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP'}).format(total);
    }

    // Obtener costo de envío
    getShippingCost() {
      const carrier = localStorage.getItem('nb-selected-carrier');
      if (carrier && window.colombianShipping) {
        const carrierData = colombianServices.shipping[carrier];
        const cartTotal = readNaturalBeCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return window.colombianShipping.calculateShippingPrice(carrierData, cartTotal);
      }
      return 0;
    }

    // Agregar avisos legales
    addLegalNotices() {
      const footer = document.querySelector('footer');
      if (footer) {
        const legalNotices = document.createElement('div');
        legalNotices.className = 'legal-notices';
        legalNotices.innerHTML = `
          <div class="legal-notice">
            <h4>Información Legal</h4>
            <p>Todos nuestros productos cuentan con registro sanitario INVIMA.</p>
            <p>El IVA se calcula según la categoría tributaria aplicable al producto.</p>
            <p>Tiempos de entrega estimados para ciudades principales.</p>
            <p>Para más información, contáctanos en +57 313 721 2923.</p>
          </div>
        `;
        footer.appendChild(legalNotices);
      }
    }
  }

  // Inicialización
  let colombianShipping;
  let colombianPayment;
  let regulatoryCompliance;

  function initColombianServices() {
    colombianShipping = new ColombianShippingSystem();
    colombianPayment = new ColombianPaymentSystem();
    regulatoryCompliance = new RegulatoryCompliance();

    // Exponer globalmente
    window.colombianShipping = colombianShipping;
    window.colombianPayment = colombianPayment;
    window.regulatoryCompliance = regulatoryCompliance;
  }

  // Exponer globalmente
  window.ColombianServices = {
    shipping: colombianShipping,
    payment: colombianPayment,
    regulatory: regulatoryCompliance,
    config: colombianServices,
    init: initColombianServices
  };

  // Auto-inicializar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initColombianServices);
  } else {
    initColombianServices();
  }

})();
