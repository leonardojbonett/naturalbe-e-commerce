// Optimización Móvil y Analytics Avanzado para Natural Be Colombia
// Enfocado en mercado colombiano y conversión móvil

(function() {
  'use strict';

  // Configuración de analytics para Colombia
  const analyticsConfig = {
    // Events personalizados para e-commerce colombiano
    events: {
      view_product: 'view_item',
      add_to_cart: 'add_to_cart',
      begin_checkout: 'begin_checkout',
      purchase: 'purchase',
      view_cart: 'view_cart',
      remove_from_cart: 'remove_from_cart',
      add_to_wishlist: 'add_to_wishlist',
      view_promotion: 'view_promotion',
      select_promotion: 'select_promotion',
      view_item_list: 'view_item_list',
      select_item: 'select_item',
      search: 'search',
      // Eventos personalizados para Colombia
      whatsapp_click: 'whatsapp_click',
      location_select: 'location_select',
      payment_method_select: 'payment_method_select',
      shipping_calculate: 'shipping_calculate'
    },

    // Parámetros personalizados para Colombia
    customParameters: {
      city: 'city', // Ciudad del usuario
      region: 'region', // Departamento
      device_type: 'device_type', // Tipo de dispositivo
      connection_speed: 'connection_speed', // Velocidad de conexión
      user_tier: 'user_tier', // Nivel de lealtad
      session_source: 'session_source' // Fuente de la sesión
    },

    // Umbrales de rendimiento para móvil
    performanceThresholds: {
      firstContentfulPaint: 1500,
      largestContentfulPaint: 2500,
      firstInputDelay: 100,
      cumulativeLayoutShift: 0.1
    }
  };

  // Sistema de optimización móvil
  class MobileOptimizer {
    constructor() {
      this.deviceInfo = this.detectDevice();
      this.performanceMetrics = {};
      this.init();
    }

    init() {
      this.optimizeImages();
      this.optimizeNavigation();
      this.optimizeForms();
      this.trackPerformance();
      this.optimizeForConnection();
    }

    // Detectar tipo de dispositivo
    detectDevice() {
      const ua = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isTablet = /iPad|Android.*Mobile/i.test(ua) && window.innerWidth > 768;
      
      return {
        isMobile: isMobile && !isTablet,
        isTablet: isTablet,
        isDesktop: !isMobile && !isTablet,
        connection: this.getConnectionInfo(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        pixelRatio: window.devicePixelRatio || 1,
        touch: 'ontouchstart' in window
      };
    }

    // Obtener información de conexión
    getConnectionInfo() {
      if (navigator.connection) {
        return {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData
        };
      }
      return { effectiveType: '4g', downlink: 10, rtt: 50, saveData: false };
    }

    // Optimizar imágenes para móvil
    optimizeImages() {
      if (!this.deviceInfo.isMobile) return;

      const images = document.querySelectorAll('img[data-src], img[src]');
      images.forEach(img => {
        // Lazy loading nativo
        if (!img.loading) {
          img.loading = 'lazy';
        }

        // Optimizar tamaños para móvil
        if (img.width > 400) {
          img.width = Math.min(img.width, 400);
          img.height = 'auto';
        }

        // Prioridad para imágenes above the fold
        if (this.isAboveFold(img)) {
          img.loading = 'eager';
          img.fetchpriority = 'high';
        }

        // WebP support
        if (this.supportsWebP()) {
          this.convertToWebP(img);
        }
      });
    }

    // Verificar si elemento está above the fold
    isAboveFold(element) {
      const rect = element.getBoundingClientRect();
      return rect.top < window.innerHeight;
    }

    // Soporte WebP
    supportsWebP() {
      return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    // Convertir a WebP
    convertToWebP(img) {
      const src = img.src || img.dataset.src;
      if (src && !src.includes('.webp')) {
        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        // Intentar cargar WebP
        const testImg = new Image();
        testImg.onload = () => {
          if (img.src) img.src = webpSrc;
          if (img.dataset.src) img.dataset.src = webpSrc;
        };
        testImg.src = webpSrc;
      }
    }

    // Optimizar navegación móvil
    optimizeNavigation() {
      if (!this.deviceInfo.isMobile) return;

      // Mejorar menú móvil
      const mobileMenu = document.querySelector('.mobile-menu');
      if (mobileMenu) {
        // Touch-friendly
        mobileMenu.querySelectorAll('a, button').forEach(element => {
          element.style.minHeight = '44px';
          element.style.minWidth = '44px';
        });

        // Swipe gestures
        this.addSwipeGestures(mobileMenu);
      }

      // Sticky header optimizado
      const header = document.querySelector('.market-header');
      if (header) {
        this.optimizeStickyHeader(header);
      }

      // Floating action button para carrito
      this.createFloatingCartButton();
    }

    // Agregar gestos swipe
    addSwipeGestures(element) {
      let touchStartX = 0;
      let touchEndX = 0;

      element.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      });

      element.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe(element, touchStartX, touchEndX);
      });
    }

    handleSwipe(element, startX, endX) {
      const swipeThreshold = 50;
      const diff = startX - endX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swipe left - cerrar menú
          element.classList.remove('active');
        } else {
          // Swipe right - abrir menú
          element.classList.add('active');
        }
      }
    }

    // Optimizar header sticky
    optimizeStickyHeader(header) {
      let lastScrollY = window.scrollY;
      let ticking = false;

      const updateHeader = () => {
        const scrollY = window.scrollY;
        
        if (scrollY > lastScrollY && scrollY > 100) {
          // Scrolling down - hide header
          header.style.transform = 'translateY(-100%)';
        } else {
          // Scrolling up - show header
          header.style.transform = 'translateY(0)';
        }
        
        lastScrollY = scrollY;
        ticking = false;
      };

      const onScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(updateHeader);
          ticking = true;
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Crear botón flotante de carrito
    createFloatingCartButton() {
      if (document.querySelector('.floating-cart-btn')) return;

      const button = document.createElement('button');
      button.className = 'floating-cart-btn';
      button.innerHTML = `
        <span class="cart-icon">🛒</span>
        <span class="cart-count">0</span>
      `;
      
      button.addEventListener('click', () => {
        // Abrir carrito
        const cartTrigger = document.querySelector('[data-cart-trigger]');
        if (cartTrigger) cartTrigger.click();
      });

      // Estilos
      const styles = document.createElement('style');
      styles.textContent = `
        .floating-cart-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .floating-cart-btn:hover {
          transform: scale(1.1);
        }
        .floating-cart-btn .cart-count {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `;
      document.head.appendChild(styles);

      document.body.appendChild(button);

      // Actualizar contador
      this.updateFloatingCartCount();
    }

    // Actualizar contador del carrito flotante
    updateFloatingCartCount() {
      const cart = JSON.parse(localStorage.getItem('nb-cart') || '[]');
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      const countElement = document.querySelector('.floating-cart-btn .cart-count');
      if (countElement) {
        countElement.textContent = count;
        countElement.style.display = count > 0 ? 'flex' : 'none';
      }
    }

    // Optimizar formularios para móvil
    optimizeForms() {
      if (!this.deviceInfo.isMobile) return;

      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        // Input types apropiados
        this.optimizeFormInputs(form);
        
        // Validación en tiempo real
        this.addRealTimeValidation(form);
        
        // Autocompletar
        this.addAutocomplete(form);
      });
    }

    // Optimizar inputs del formulario
    optimizeFormInputs(form) {
      const inputs = form.querySelectorAll('input');
      inputs.forEach(input => {
        // Tipos de input apropiados
        if (input.type === 'text') {
          if (input.name.includes('email')) {
            input.type = 'email';
            input.autocomplete = 'email';
          } else if (input.name.includes('phone')) {
            input.type = 'tel';
            input.autocomplete = 'tel';
            input.pattern = '[0-9]{10}';
          } else if (input.name.includes('name')) {
            input.autocomplete = 'name';
          }
        }

        // Inputmode para teclado numérico
        if (input.name.includes('phone') || input.name.includes('cantidad')) {
          input.inputmode = 'numeric';
        }

        // Mejorar UX en móvil
        input.style.fontSize = '16px'; // Evitar zoom en iOS
        input.style.padding = '12px';
      });
    }

    // Validación en tiempo real
    addRealTimeValidation(form) {
      const inputs = form.querySelectorAll('input[required]');
      inputs.forEach(input => {
        input.addEventListener('blur', () => {
          this.validateInput(input);
        });

        input.addEventListener('input', () => {
          if (input.classList.contains('error')) {
            this.validateInput(input);
          }
        });
      });
    }

    // Validar input
    validateInput(input) {
      let isValid = true;
      let errorMessage = '';

      // Remover error anterior
      input.classList.remove('error');
      const existingError = input.parentNode.querySelector('.error-message');
      if (existingError) existingError.remove();

      // Validaciones
      if (input.hasAttribute('required') && !input.value.trim()) {
        isValid = false;
        errorMessage = 'Este campo es requerido';
      } else if (input.type === 'email' && !this.isValidEmail(input.value)) {
        isValid = false;
        errorMessage = 'Email inválido';
      } else if (input.type === 'tel' && !this.isValidPhone(input.value)) {
        isValid = false;
        errorMessage = 'Teléfono inválido';
      }

      // Mostrar error
      if (!isValid) {
        input.classList.add('error');
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = errorMessage;
        errorElement.style.color = '#ef4444';
        errorElement.style.fontSize = '14px';
        errorElement.style.marginTop = '4px';
        input.parentNode.appendChild(errorElement);
      }

      return isValid;
    }

    // Validar email
    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Validar teléfono colombiano
    isValidPhone(phone) {
      return /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));
    }

    // Autocompletar ciudades colombianas
    addAutocomplete(form) {
      const cityInput = form.querySelector('input[name*="city"], input[name*="ciudad"]');
      if (cityInput) {
        this.setupCityAutocomplete(cityInput);
      }
    }

    // Configurar autocompletar de ciudades
    setupCityAutocomplete(input) {
      const colombianCities = [
        'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
        'Bucaramanga', 'Pereira', 'Manizales', 'Cúcuta', 'Ibagué',
        'Santa Marta', 'Villavicencio', 'Valledupar', 'Montería', 'Neiva'
      ];

      // Crear datalist
      const datalist = document.createElement('datalist');
      datalist.id = 'colombian-cities';
      colombianCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        datalist.appendChild(option);
      });
      document.body.appendChild(datalist);

      input.setAttribute('list', 'colombian-cities');
    }

    // Optimizar según conexión
    optimizeForConnection() {
      const connection = this.deviceInfo.connection;
      
      if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        // Modo ahorro de datos
        this.enableDataSaverMode();
      } else if (connection.effectiveType === '3g') {
        // Optimización para 3G
        this.enable3GMode();
      }
    }

    // Modo ahorro de datos
    enableDataSaverMode() {
      // Deshabilitar imágenes pesadas
      document.querySelectorAll('img').forEach(img => {
        if (!img.dataset.lowsrc) {
          img.dataset.lowsrc = img.src;
          img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';
        }
      });

      // Reducir calidad de imágenes
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.dataset.src = img.dataset.src.replace(/quality=\d+/, 'quality=50');
      });

      // Deshabilitar videos
      document.querySelectorAll('video').forEach(video => {
        video.poster = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';
        video.load = () => {};
      });
    }

    // Modo 3G
    enable3GMode() {
      // Lazy loading agresivo
      document.querySelectorAll('img').forEach(img => {
        img.loading = 'lazy';
        img.fetchpriority = 'low';
      });

      // Reducir peticiones
      this.deferNonCriticalResources();
    }

    // Diferir recursos no críticos
    deferNonCriticalResources() {
      const scripts = document.querySelectorAll('script[data-defer]');
      scripts.forEach(script => {
        script.setAttribute('defer', 'defer');
      });
    }

    // Trackear rendimiento
    trackPerformance() {
      // Core Web Vitals
      this.trackCoreWebVitals();
      
      // Métricas personalizadas
      this.trackCustomMetrics();
      
      // Enviar a analytics
      this.sendPerformanceData();
    }

    // Trackear Core Web Vitals
    trackCoreWebVitals() {
      // First Contentful Paint
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.performanceMetrics.fcp = entry.startTime;
          }
        });
      });
      observer.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.performanceMetrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-input') {
            this.performanceMetrics.fid = entry.processingStart - entry.startTime;
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.performanceMetrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // Trackear métricas personalizadas
    trackCustomMetrics() {
      // Tiempo de carga de productos
      if (window.location.pathname.includes('category')) {
        const startTime = performance.now();
        window.addEventListener('load', () => {
          this.performanceMetrics.categoryLoadTime = performance.now() - startTime;
        });
      }

      // Interacciones del usuario
      this.trackUserInteractions();
    }

    // Trackear interacciones del usuario
    trackUserInteractions() {
      let interactionCount = 0;
      const interactions = ['click', 'touchstart', 'scroll'];

      interactions.forEach(eventType => {
        document.addEventListener(eventType, () => {
          interactionCount++;
          this.performanceMetrics.userInteractions = interactionCount;
        }, { passive: true });
      });
    }

    // Enviar datos de rendimiento
    sendPerformanceData() {
      // Esperar a tener todas las métricas
      setTimeout(() => {
        const performanceData = {
          ...this.performanceMetrics,
          device: this.deviceInfo,
          url: window.location.href,
          timestamp: new Date().toISOString()
        };

        // Enviar a Google Analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'page_performance', {
            custom_parameters: performanceData
          });
        }

        // Enviar a analytics personalizado
        this.sendToCustomAnalytics(performanceData);
      }, 5000);
    }

    // Enviar a analytics personalizado
    sendToCustomAnalytics(data) {
      // Aquí podrías enviar a tu propio endpoint
      console.log('Performance Data:', data);
    }
  }

  // Analytics avanzado para e-commerce
  class EcommerceAnalytics {
    constructor() {
      this.sessionData = this.initializeSession();
      this.init();
    }

    init() {
      this.trackPageView();
      this.trackUserEngagement();
      this.trackEcommerceEvents();
      this.trackColombianEvents();
    }

    // Inicializar sesión
    initializeSession() {
      const sessionId = this.getSessionId();
      const sessionData = {
        sessionId: sessionId,
        startTime: Date.now(),
        pageViews: 1,
        events: [],
        location: this.detectLocation(),
        device: this.detectDevice(),
        trafficSource: this.detectTrafficSource()
      };

      // Guardar en localStorage
      localStorage.setItem('nb-session-data', JSON.stringify(sessionData));
      return sessionData;
    }

    // Obtener ID de sesión
    getSessionId() {
      let sessionId = sessionStorage.getItem('nb-session-id');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('nb-session-id', sessionId);
      }
      return sessionId;
    }

    // Detectar ubicación
    detectLocation() {
      // Intentar obtener desde localStorage
      const savedLocation = localStorage.getItem('nb-user-location');
      if (savedLocation) return savedLocation;

      // Detectar por timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes('Bogota')) return 'Bogotá';
      if (timezone.includes('America')) return 'Colombia';

      return 'Unknown';
    }

    // Detectar dispositivo
    detectDevice() {
      const ua = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      
      return {
        type: isMobile ? 'mobile' : 'desktop',
        os: this.detectOS(),
        browser: this.detectBrowser()
      };
    }

    // Detectar SO
    detectOS() {
      const ua = navigator.userAgent;
      if (ua.includes('Android')) return 'Android';
      if (ua.includes('iOS')) return 'iOS';
      if (ua.includes('Windows')) return 'Windows';
      if (ua.includes('Mac')) return 'macOS';
      return 'Unknown';
    }

    // Detectar navegador
    detectBrowser() {
      const ua = navigator.userAgent;
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Safari')) return 'Safari';
      if (ua.includes('Edge')) return 'Edge';
      return 'Unknown';
    }

    // Detectar fuente de tráfico
    detectTrafficSource() {
      const referrer = document.referrer;
      const utmSource = new URLSearchParams(window.location.search).get('utm_source');
      
      if (utmSource) return utmSource;
      if (referrer.includes('google')) return 'google';
      if (referrer.includes('facebook')) return 'facebook';
      if (referrer.includes('instagram')) return 'instagram';
      if (referrer) return 'referral';
      
      return 'direct';
    }

    // Trackear vista de página
    trackPageView() {
      const pageData = {
        page_title: document.title,
        page_location: window.location.href,
        page_referrer: document.referrer
      };

      // Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('config', 'G-DM18HLQ3R8', {
          custom_map: {
            custom_parameter_1: 'city',
            custom_parameter_2: 'device_type',
            custom_parameter_3: 'user_tier'
          }
        });
        
        gtag('event', 'page_view', pageData);
      }

      // Analytics personalizado
      this.trackCustomEvent('page_view', pageData);
    }

    // Trackear engagement del usuario
    trackUserEngagement() {
      let timeOnPage = 0;
      let lastActivity = Date.now();

      // Trackear scroll
      let maxScroll = 0;
      window.addEventListener('scroll', () => {
        const scrollPercent = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        maxScroll = Math.max(maxScroll, scrollPercent);
        lastActivity = Date.now();
      }, { passive: true });

      // Trackear tiempo en página
      setInterval(() => {
        timeOnPage += 5; // Cada 5 segundos
        lastActivity = Date.now();
      }, 5000);

      // Enviar datos al salir
      window.addEventListener('beforeunload', () => {
        const engagementData = {
          time_on_page: timeOnPage,
          max_scroll: maxScroll,
          session_duration: Date.now() - this.sessionData.startTime
        };

        this.trackCustomEvent('user_engagement', engagementData);
      });
    }

    // Trackear eventos de e-commerce
    trackEcommerceEvents() {
      // View product
      document.addEventListener('click', (e) => {
        const productCard = e.target.closest('.product-card');
        if (productCard) {
          const productId = productCard.dataset.productId;
          const product = this.getProductData(productId);
          if (product) {
            this.trackEvent('view_item', {
              currency: 'COP',
              value: product.precio,
              items: [this.formatProductForGA(product)]
            });
          }
        }
      });

      // Add to cart
      document.addEventListener('click', (e) => {
        if (e.target.closest('[data-add-to-cart]')) {
          const button = e.target.closest('[data-add-to-cart]');
          const product = {
            item_id: button.dataset.productId,
            item_name: button.dataset.productName,
            price: parseFloat(button.dataset.productPrice),
            quantity: 1
          };

          this.trackEvent('add_to_cart', {
            currency: 'COP',
            value: product.price,
            items: [product]
          });
        }
      });

      // View cart
      document.addEventListener('click', (e) => {
        if (e.target.closest('[data-cart-trigger]')) {
          const cart = this.getCartData();
          this.trackEvent('view_cart', {
            currency: 'COP',
            value: cart.total,
            items: cart.items
          });
        }
      });
    }

    // Trackear eventos colombianos
    trackColombianEvents() {
      // Click en WhatsApp
      document.addEventListener('click', (e) => {
        if (e.target.closest('[data-wa-content]')) {
          this.trackEvent('whatsapp_click', {
            content_name: e.target.closest('[data-wa-content]').dataset.waContent
          });
        }
      });

      // Selección de ubicación
      document.addEventListener('change', (e) => {
        if (e.target.name.includes('city') || e.target.name.includes('ciudad')) {
          this.trackEvent('location_select', {
            city: e.target.value
          });
        }
      });

      // Cálculo de envío
      document.addEventListener('click', (e) => {
        if (e.target.closest('[data-calculate-shipping]')) {
          this.trackEvent('shipping_calculate', {
            city: document.querySelector('[name*="city"], [name*="ciudad"]')?.value
          });
        }
      });
    }

    // Obtener datos del producto
    getProductData(productId) {
      if (window.ALL_PRODUCTS) {
        return window.ALL_PRODUCTS.find(p => p.id === productId);
      }
      return null;
    }

    // Formatear producto para GA
    formatProductForGA(product) {
      return {
        item_id: product.id,
        item_name: product.nombre,
        category: product.categoria,
        brand: product.marca,
        price: product.precio_oferta || product.precio,
        quantity: 1
      };
    }

    // Obtener datos del carrito
    getCartData() {
      const cart = JSON.parse(localStorage.getItem('nb-cart') || '[]');
      const items = cart.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      return { items, total };
    }

    // Trackear evento
    trackEvent(eventName, parameters) {
      // Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
          ...parameters,
          custom_parameters: {
            city: this.sessionData.location,
            device_type: this.sessionData.device.type,
            user_tier: this.getUserTier()
          }
        });
      }

      // Analytics personalizado
      this.trackCustomEvent(eventName, parameters);
    }

    // Obtener tier del usuario
    getUserTier() {
      if (window.LoyaltySystem && window.LoyaltySystem.system) {
        return window.LoyaltySystem.system.currentUser.tier;
      }
      return 'bronze';
    }

    // Trackear evento personalizado
    trackCustomEvent(eventName, parameters) {
      const eventData = {
        event: eventName,
        parameters: parameters,
        session_data: this.sessionData,
        timestamp: new Date().toISOString()
      };

      // Enviar a endpoint personalizado
      this.sendToAnalyticsEndpoint(eventData);
    }

    // Enviar a endpoint de analytics
    sendToAnalyticsEndpoint(data) {
      // Aquí podrías enviar a tu propio backend
      console.log('Analytics Event:', data);
      
      // Opcional: Enviar a Google Analytics Measurement Protocol
      this.sendToMeasurementProtocol(data);
    }

    // Enviar a Measurement Protocol
    sendToMeasurementProtocol(data) {
      const measurementId = 'G-DM18HLQ3R8';
      const apiSecret = 'YOUR_API_SECRET'; // Necesitarás configurar esto
      
      const payload = {
        client_id: this.getSessionId(),
        user_id: this.getUserId(),
        events: [{
          name: data.event,
          parameters: {
            ...data.parameters,
            engagement_time_msec: 100,
            session_id: this.sessionData.sessionId
          }
        }]
      };

      // Enviar a GA4 Measurement Protocol
      fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }).catch(err => console.log('Analytics error:', err));
    }

    // Obtener ID de usuario
    getUserId() {
      if (window.LoyaltySystem && window.LoyaltySystem.system) {
        return window.LoyaltySystem.system.currentUser.id;
      }
      return null;
    }
  }

  // Inicialización
  let mobileOptimizer;
  let ecommerceAnalytics;

  function initMobileAnalytics() {
    mobileOptimizer = new MobileOptimizer();
    ecommerceAnalytics = new EcommerceAnalytics();
  }

  // Exponer globalmente
  window.MobileAnalytics = {
    optimizer: mobileOptimizer,
    analytics: ecommerceAnalytics,
    init: initMobileAnalytics,
    trackEvent: (eventName, parameters) => {
      if (ecommerceAnalytics) {
        ecommerceAnalytics.trackEvent(eventName, parameters);
      }
    }
  };

  // Auto-inicializar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileAnalytics);
  } else {
    initMobileAnalytics();
  }

})();
