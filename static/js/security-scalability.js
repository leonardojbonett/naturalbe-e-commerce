// Sistema de Seguridad y Escalabilidad para Natural Be Colombia
// Autenticación robusta, protección de datos y preparación para alto tráfico

(function() {
  'use strict';

  // Configuración de seguridad
  const securityConfig = {
    // Rate limiting
    rateLimiting: {
      login: { max: 5, window: 900000 }, // 5 intentos en 15 minutos
      registration: { max: 3, window: 3600000 }, // 3 registros en 1 hora
      passwordReset: { max: 3, window: 3600000 }, // 3 resets en 1 hora
      api: { max: 100, window: 60000 }, // 100 requests por minuto
      search: { max: 30, window: 60000 } // 30 búsquedas por minuto
    },

    // Seguridad de contraseñas
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5, // No reusar últimas 5 contraseñas
      maxAge: 7776000000 // 90 días en ms
    },

    // Sesiones
    session: {
      timeout: 1800000, // 30 minutos
      renewalThreshold: 300000, // Renovar 5 minutos antes de expirar
      maxConcurrent: 3, // Máximo 3 sesiones simultáneas
      secureFlags: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      }
    },

    // Protección CSRF
    csrf: {
      tokenLength: 32,
      expiration: 3600000 // 1 hora
    },

    // Encriptación
    encryption: {
      algorithm: 'AES-GCM',
      keyLength: 256,
      ivLength: 12
    },

    // Validación de datos
    validation: {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[0-9]{10}$/,
      id: /^[0-9]{6,10}$/,
      name: /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]{2,50}$/,
      address: /^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-\#\.]{5,100}$/
    }
  };

  // Sistema de autenticación segura
  class SecureAuthSystem {
    constructor() {
      this.currentUser = null;
      this.sessionTimer = null;
      this.csrfToken = null;
      this.init();
    }

    init() {
      this.initializeAuth();
      this.setupSecurityHeaders();
      this.setupCSRFProtection();
      this.setupSessionManagement();
      this.bindEvents();
    }

    // Inicializar autenticación
    initializeAuth() {
      // Verificar si hay sesión activa
      const session = this.getValidSession();
      if (session) {
        this.currentUser = session.user;
        this.startSessionTimer();
        this.updateAuthUI();
      }
    }

    // Obtener sesión válida
    getValidSession() {
      const sessionData = localStorage.getItem('nb-auth-session');
      if (!sessionData) return null;

      try {
        const session = JSON.parse(sessionData);
        
        // Verificar expiración
        if (Date.now() > session.expiresAt) {
          this.logout();
          return null;
        }

        // Verificar integridad
        if (!this.verifySessionIntegrity(session)) {
          this.logout();
          return null;
        }

        return session;
      } catch (error) {
        console.error('Error parsing session:', error);
        this.logout();
        return null;
      }
    }

    // Verificar integridad de sesión
    verifySessionIntegrity(session) {
      // Aquí podrías verificar firma HMAC
      return session.user && session.token && session.expiresAt;
    }

    // Configurar headers de seguridad
    setupSecurityHeaders() {
      if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        return;
      }
      // Meta tags de seguridad
      const securityMeta = document.createElement('meta');
      securityMeta.httpEquiv = 'Content-Security-Policy';
      securityMeta.content = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://checkout.wompi.co;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: https:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://api.naturalbe.com.co https://checkout.wompi.co;
        frame-src https://checkout.wompi.co;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
      `.replace(/\s+/g, ' ').trim();
      
      document.head.appendChild(securityMeta);
    }

    // Configurar protección CSRF
    setupCSRFProtection() {
      this.csrfToken = this.generateCSRFToken();
      
      // Agregar token a todos los formularios
      document.addEventListener('DOMContentLoaded', () => {
        this.addCSRFToForms();
      });
    }

    // Generar token CSRF
    generateCSRFToken() {
      const array = new Uint8Array(securityConfig.csrf.tokenLength);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Agregar token CSRF a formularios
    addCSRFToForms() {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        const existingToken = form.querySelector('input[name="csrf_token"]');
        if (!existingToken) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'csrf_token';
          input.value = this.csrfToken;
          form.appendChild(input);
        }
      });
    }

    // Configurar manejo de sesiones
    setupSessionManagement() {
      // Detectar actividad del usuario
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      activityEvents.forEach(event => {
        document.addEventListener(event, () => {
          this.renewSession();
        }, { passive: true });
      });

      // Renovar sesión periódicamente
      setInterval(() => {
        this.checkSessionStatus();
      }, 60000); // Cada minuto
    }

    // Iniciar timer de sesión
    startSessionTimer() {
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
      }

      this.sessionTimer = setTimeout(() => {
        this.showSessionWarning();
      }, securityConfig.session.timeout - securityConfig.session.renewalThreshold);
    }

    // Mostrar advertencia de sesión
    showSessionWarning() {
      const warning = document.createElement('div');
      warning.className = 'session-warning';
      warning.innerHTML = `
        <div class="session-warning__content">
          <h4>⏰ Tu sesión está por expirar</h4>
          <p>¿Deseas extender tu sesión?</p>
          <div class="session-warning__actions">
            <button class="btn-primary" onclick="secureAuth.extendSession()">Extender</button>
            <button class="btn-ghost" onclick="secureAuth.logout()">Cerrar sesión</button>
          </div>
        </div>
      `;

      // Estilos
      if (!document.getElementById('session-warning-styles')) {
        const styles = document.createElement('style');
        styles.id = 'session-warning-styles';
        styles.textContent = `
          .session-warning {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
          }
          .session-warning__content {
            background: white;
            padding: 24px;
            border-radius: 12px;
            max-width: 400px;
            text-align: center;
          }
          .session-warning__actions {
            margin-top: 16px;
            display: flex;
            gap: 12px;
            justify-content: center;
          }
        `;
        document.head.appendChild(styles);
      }

      document.body.appendChild(warning);

      // Auto-cerrar después de 2 minutos
      setTimeout(() => {
        if (warning.parentElement) {
          warning.remove();
          this.logout();
        }
      }, 120000);
    }

    // Extender sesión
    extendSession() {
      const warning = document.querySelector('.session-warning');
      if (warning) warning.remove();

      const session = this.getValidSession();
      if (session) {
        session.expiresAt = Date.now() + securityConfig.session.timeout;
        localStorage.setItem('nb-auth-session', JSON.stringify(session));
        this.startSessionTimer();
      }
    }

    // Renovar sesión
    renewSession() {
      const session = this.getValidSession();
      if (session && Date.now() > session.expiresAt - securityConfig.session.renewalThreshold) {
        this.extendSession();
      }
    }

    // Verificar estado de sesión
    checkSessionStatus() {
      const session = this.getValidSession();
      if (!session && this.currentUser) {
        this.logout();
      }
    }

    // Bind events
    bindEvents() {
      // Prevenir envío de formularios sin validación
      document.addEventListener('submit', (e) => {
        const form = e.target;
        if (form.tagName === 'FORM') {
          if (!this.validateForm(form)) {
            e.preventDefault();
          }
        }
      });

      // Validar inputs en tiempo real
      document.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT') {
          this.validateInput(e.target);
        }
      });
    }

    // Validar formulario
    validateForm(form) {
      let isValid = true;
      const inputs = form.querySelectorAll('input[required]');

      inputs.forEach(input => {
        if (!this.validateInput(input)) {
          isValid = false;
        }
      });

      // Validar CSRF
      const csrfToken = form.querySelector('input[name="csrf_token"]');
      if (!csrfToken || csrfToken.value !== this.csrfToken) {
        this.showError('Error de seguridad: token inválido');
        return false;
      }

      return isValid;
    }

    // Validar input
    validateInput(input) {
      let isValid = true;
      let errorMessage = '';

      // Remover error anterior
      input.classList.remove('error');
      const existingError = input.parentNode.querySelector('.error-message');
      if (existingError) existingError.remove();

      // Validaciones según tipo
      switch (input.type) {
        case 'email':
          if (!securityConfig.validation.email.test(input.value)) {
            isValid = false;
            errorMessage = 'Email inválido';
          }
          break;
        case 'tel':
          if (!securityConfig.validation.phone.test(input.value.replace(/\D/g, ''))) {
            isValid = false;
            errorMessage = 'Teléfono inválido (10 dígitos)';
          }
          break;
        case 'password':
          if (!this.validatePassword(input.value)) {
            isValid = false;
            errorMessage = 'La contraseña no cumple los requisitos';
          }
          break;
        case 'text':
          if (input.name.includes('name') && !securityConfig.validation.name.test(input.value)) {
            isValid = false;
            errorMessage = 'Nombre inválido';
          }
          break;
      }

      // Validaciones generales
      if (input.hasAttribute('required') && !input.value.trim()) {
        isValid = false;
        errorMessage = 'Este campo es requerido';
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

    // Validar contraseña
    validatePassword(password) {
      const config = securityConfig.password;
      
      if (password.length < config.minLength) return false;
      if (config.requireUppercase && !/[A-Z]/.test(password)) return false;
      if (config.requireLowercase && !/[a-z]/.test(password)) return false;
      if (config.requireNumbers && !/\d/.test(password)) return false;
      if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
      
      return true;
    }

    // Login
    async login(email, password) {
      try {
        // Rate limiting
        if (!this.checkRateLimit('login', email)) {
          throw new Error('Demasiados intentos. Intenta más tarde.');
        }

        // Validar inputs
        if (!securityConfig.validation.email.test(email)) {
          throw new Error('Email inválido');
        }

        if (!this.validatePassword(password)) {
          throw new Error('Contraseña inválida');
        }

        // Hash de contraseña
        const hashedPassword = await this.hashPassword(password);

        // Llamada a API (simulada)
        const response = await this.apiCall('/auth/login', {
          email: email.toLowerCase(),
          password: hashedPassword,
          csrfToken: this.csrfToken
        });

        if (response.success) {
          this.createSession(response.user);
          return { success: true, user: response.user };
        } else {
          throw new Error(response.message || 'Credenciales inválidas');
        }

      } catch (error) {
        this.recordRateLimit('login', email);
        throw error;
      }
    }

    // Registro
    async register(userData) {
      try {
        // Rate limiting
        if (!this.checkRateLimit('registration', userData.email)) {
          throw new Error('Demasiados registros. Intenta más tarde.');
        }

        // Validar datos
        this.validateUserData(userData);

        // Hash de contraseña
        const hashedPassword = await this.hashPassword(userData.password);

        // Llamada a API
        const response = await this.apiCall('/auth/register', {
          ...userData,
          password: hashedPassword,
          email: userData.email.toLowerCase(),
          csrfToken: this.csrfToken
        });

        if (response.success) {
          return { success: true, message: 'Registro exitoso' };
        } else {
          throw new Error(response.message || 'Error en registro');
        }

      } catch (error) {
        this.recordRateLimit('registration', userData.email);
        throw error;
      }
    }

    // Validar datos de usuario
    validateUserData(userData) {
      if (!securityConfig.validation.email.test(userData.email)) {
        throw new Error('Email inválido');
      }

      if (!this.validatePassword(userData.password)) {
        throw new Error('Contraseña no cumple los requisitos');
      }

      if (userData.phone && !securityConfig.validation.phone.test(userData.phone.replace(/\D/g, ''))) {
        throw new Error('Teléfono inválido');
      }

      if (!securityConfig.validation.name.test(userData.name)) {
        throw new Error('Nombre inválido');
      }
    }

    // Hash de contraseña
    async hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode('pepper-secret-key'),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        key,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const hash = await crypto.subtle.digest('SHA-256', data);
      return {
        hash: Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join(''),
        salt: Array.from(salt, b => b.toString(16).padStart(2, '0')).join('')
      };
    }

    // Crear sesión
    createSession(user) {
      const session = {
        user: user,
        token: this.generateSessionToken(),
        expiresAt: Date.now() + securityConfig.session.timeout,
        createdAt: Date.now(),
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent
      };

      localStorage.setItem('nb-auth-session', JSON.stringify(session));
      this.currentUser = user;
      this.startSessionTimer();
      this.updateAuthUI();
    }

    // Generar token de sesión
    generateSessionToken() {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Obtener IP del cliente
    getClientIP() {
      // En producción, esto vendría del servidor
      return '127.0.0.1';
    }

    // Logout
    logout() {
      localStorage.removeItem('nb-auth-session');
      this.currentUser = null;
      
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }

      // Limpiar UI
      this.updateAuthUI();

      // Redirigir a login
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/login.html';
      }
    }

    // Actualizar UI de autenticación
    updateAuthUI() {
      const authElements = document.querySelectorAll('[data-auth]');
      authElements.forEach(element => {
        const authState = element.dataset.auth;
        
        if (authState === 'logged-in' && this.currentUser) {
          element.style.display = 'block';
        } else if (authState === 'logged-out' && !this.currentUser) {
          element.style.display = 'block';
        } else {
          element.style.display = 'none';
        }
      });

      // Actualizar nombre de usuario
      const userNameElements = document.querySelectorAll('[data-user-name]');
      userNameElements.forEach(element => {
        element.textContent = this.currentUser?.name || 'Usuario';
      });
    }

    // Rate limiting
    checkRateLimit(action, identifier) {
      const key = `rate_limit_${action}_${identifier}`;
      const attempts = JSON.parse(localStorage.getItem(key) || '[]');
      const now = Date.now();
      const window = securityConfig.rateLimiting[action];
      
      // Limpiar intentos expirados
      const validAttempts = attempts.filter(time => now - time < window.window);
      
      return validAttempts.length < window.max;
    }

    // Registrar intento
    recordRateLimit(action, identifier) {
      const key = `rate_limit_${action}_${identifier}`;
      const attempts = JSON.parse(localStorage.getItem(key) || '[]');
      attempts.push(Date.now());
      localStorage.setItem(key, JSON.stringify(attempts));
    }

    // Llamada a API
    async apiCall(endpoint, data) {
      // Simulación de llamada API
      console.log('API Call:', endpoint, data);
      
      // Aquí iría la llamada real a tu backend
      return new Promise((resolve) => {
        setTimeout(() => {
          if (endpoint.includes('login')) {
            resolve({
              success: true,
              user: {
                id: '1',
                name: 'Usuario Test',
                email: data.email,
                tier: 'bronze'
              }
            });
          } else {
            resolve({ success: true });
          }
        }, 1000);
      });
    }

    // Mostrar error
    showError(message) {
      const error = document.createElement('div');
      error.className = 'error-toast';
      error.textContent = message;
      error.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
      `;
      
      document.body.appendChild(error);
      
      setTimeout(() => {
        error.remove();
      }, 5000);
    }
  }

  // Sistema de escalabilidad
  class ScalabilitySystem {
    constructor() {
      this.performanceMonitor = new PerformanceMonitor();
      this.cacheManager = new CacheManager();
      this.loadBalancer = new LoadBalancer();
      this.init();
    }

    init() {
      this.setupPerformanceMonitoring();
      this.setupCaching();
      this.setupLoadBalancing();
      this.setupResourceOptimization();
    }

    // Configurar monitoreo de rendimiento
    setupPerformanceMonitoring() {
      // Monitorear uso de memoria
      this.monitorMemoryUsage();
      
      // Monitorear tiempo de respuesta
      this.monitorResponseTimes();
      
      // Monitorear errores
      this.monitorErrors();
    }

    // Monitorear uso de memoria
    monitorMemoryUsage() {
      setInterval(() => {
        if (performance.memory) {
          const memoryUsage = {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit,
            percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
          };

          // Alertar si el uso es alto
          if (memoryUsage.percentage > 80) {
            this.optimizeMemory();
          }

          // Enviar a analytics
          if (window.MobileAnalytics) {
            window.MobileAnalytics.trackEvent('memory_usage', memoryUsage);
          }
        }
      }, 30000); // Cada 30 segundos
    }

    // Optimizar memoria
    optimizeMemory() {
      // Limpiar caché antigua
      this.cacheManager.cleanup();
      
      // Forzar garbage collection si está disponible
      if (window.gc) {
        window.gc();
      }
      
      // Limpiar event listeners no utilizados
      this.cleanupEventListeners();
    }

    // Monitorear tiempos de respuesta
    monitorResponseTimes() {
      const originalFetch = window.fetch;
      
      window.fetch = async (...args) => {
        const start = performance.now();
        
        try {
          const response = await originalFetch(...args);
          const duration = performance.now() - start;
          
          // Trackear tiempo de respuesta
          if (window.MobileAnalytics) {
            window.MobileAnalytics.trackEvent('api_response_time', {
              url: args[0],
              duration: duration,
              status: response.status
            });
          }
          
          return response;
        } catch (error) {
          const duration = performance.now() - start;
          
          // Trackear error
          if (window.MobileAnalytics) {
            window.MobileAnalytics.trackEvent('api_error', {
              url: args[0],
              duration: duration,
              error: error.message
            });
          }
          
          throw error;
        }
      };
    }

    // Monitorear errores
    monitorErrors() {
      window.addEventListener('error', (event) => {
        if (window.MobileAnalytics) {
          window.MobileAnalytics.trackEvent('javascript_error', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          });
        }
      });

      window.addEventListener('unhandledrejection', (event) => {
        if (window.MobileAnalytics) {
          window.MobileAnalytics.trackEvent('unhandled_rejection', {
            reason: event.reason
          });
        }
      });
    }

    // Configurar caché
    setupCaching() {
      // Caché de productos
      this.cacheManager.setCache('products', 3600000); // 1 hora
      
      // Caché de sesiones
      this.cacheManager.setCache('user_session', 1800000); // 30 minutos
      
      // Caché de configuración
      this.cacheManager.setCache('config', 86400000); // 24 horas
    }

    // Configurar balanceo de carga
    setupLoadBalancing() {
      // Simular múltiples endpoints
      this.loadBalancer.addEndpoint('https://api1.naturalbe.com.co');
      this.loadBalancer.addEndpoint('https://api2.naturalbe.com.co');
      this.loadBalancer.addEndpoint('https://api3.naturalbe.com.co');
    }

    // Configurar optimización de recursos
    setupResourceOptimization() {
      // Lazy loading de imágenes
      this.setupLazyLoading();
      
      // Preload de recursos críticos
      this.setupCriticalResourcePreloading();
      
      // Code splitting
      this.setupCodeSplitting();
    }

    // Configurar lazy loading
    setupLazyLoading() {
      const images = document.querySelectorAll('img[data-src]');
      
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }

    // Configurar preload de recursos críticos
    setupCriticalResourcePreloading() {
      const criticalResources = [
        '/static/css/main.min.css',
        '/static/img/logo.webp'
      ];

      criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        
        if (resource.endsWith('.css')) {
          link.as = 'style';
        } else if (resource.endsWith('.js')) {
          link.as = 'script';
        } else if (resource.endsWith('.webp')) {
          link.as = 'image';
        }
        
        document.head.appendChild(link);
      });
    }

    // Configurar code splitting
    setupCodeSplitting() {
      // Cargar módulos bajo demanda
      const loadModule = async (moduleName) => {
        try {
          const module = await import(`/static/js/modules/${moduleName}.js`);
          return module;
        } catch (error) {
          console.error(`Error loading module ${moduleName}:`, error);
          return null;
        }
      };

      // Exponer globalmente
      window.loadModule = loadModule;
    }

    // Limpiar event listeners
    cleanupEventListeners() {
      // Implementar limpieza de listeners no utilizados
      // Esto es complejo y requiere tracking de listeners
    }
  }

  // Monitor de rendimiento
  class PerformanceMonitor {
    constructor() {
      this.metrics = {};
      this.thresholds = {
        responseTime: 2000, // 2 segundos
        memoryUsage: 80, // 80%
        errorRate: 5 // 5%
      };
    }

    // Métrica de respuesta
    recordResponseTime(endpoint, duration) {
      if (!this.metrics[endpoint]) {
        this.metrics[endpoint] = [];
      }
      
      this.metrics[endpoint].push({
        duration: duration,
        timestamp: Date.now()
      });

      // Mantener solo últimas 100 mediciones
      if (this.metrics[endpoint].length > 100) {
        this.metrics[endpoint] = this.metrics[endpoint].slice(-100);
      }

      this.checkThresholds(endpoint);
    }

    // Verificar umbrales
    checkThresholds(endpoint) {
      const measurements = this.metrics[endpoint];
      if (!measurements.length) return;

      const avgDuration = measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length;
      
      if (avgDuration > this.thresholds.responseTime) {
        this.triggerAlert('slow_response', {
          endpoint: endpoint,
          averageDuration: avgDuration
        });
      }
    }

    // Disparar alerta
    triggerAlert(type, data) {
      console.warn(`Performance Alert: ${type}`, data);
      
      // Enviar a monitoring
      if (window.MobileAnalytics) {
        window.MobileAnalytics.trackEvent('performance_alert', {
          type: type,
          data: data
        });
      }
    }
  }

  // Gestor de caché
  class CacheManager {
    constructor() {
      this.cache = new Map();
      this.ttl = new Map();
    }

    // Establecer caché
    setCache(key, ttl) {
      this.ttl.set(key, ttl);
    }

    // Obtener de caché
    get(key) {
      const cached = this.cache.get(key);
      if (!cached) return null;

      const ttl = this.ttl.get(key);
      if (Date.now() - cached.timestamp > ttl) {
        this.cache.delete(key);
        return null;
      }

      return cached.data;
    }

    // Guardar en caché
    set(key, data) {
      this.cache.set(key, {
        data: data,
        timestamp: Date.now()
      });
    }

    // Limpiar caché
    cleanup() {
      const now = Date.now();
      
      for (const [key, cached] of this.cache.entries()) {
        const ttl = this.ttl.get(key);
        if (now - cached.timestamp > ttl) {
          this.cache.delete(key);
        }
      }
    }
  }

  // Balanceador de carga
  class LoadBalancer {
    constructor() {
      this.endpoints = [];
      this.currentIndex = 0;
    }

    // Agregar endpoint
    addEndpoint(endpoint) {
      this.endpoints.push(endpoint);
    }

    // Obtener siguiente endpoint
    getNextEndpoint() {
      if (this.endpoints.length === 0) {
        throw new Error('No endpoints available');
      }

      const endpoint = this.endpoints[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;
      return endpoint;
    }

    // Endpoint con fallback
    async fetchWithFallback(url, options) {
      const errors = [];

      for (let i = 0; i < this.endpoints.length; i++) {
        try {
          const endpoint = this.getNextEndpoint();
          const fullUrl = endpoint + url;
          
          const response = await fetch(fullUrl, options);
          
          if (response.ok) {
            return response;
          }
          
          errors.push(`${endpoint}: ${response.status} ${response.statusText}`);
        } catch (error) {
          errors.push(`${endpoint}: ${error.message}`);
        }
      }

      throw new Error(`All endpoints failed: ${errors.join(', ')}`);
    }
  }

  // Inicialización
  let secureAuth;
  let scalabilitySystem;

  function initSecurityScalability() {
    secureAuth = new SecureAuthSystem();
    scalabilitySystem = new ScalabilitySystem();

    // Exponer globalmente
    window.secureAuth = secureAuth;
    window.scalabilitySystem = scalabilitySystem;
  }

  // Exponer globalmente
  window.SecurityScalability = {
    auth: secureAuth,
    scalability: scalabilitySystem,
    init: initSecurityScalability
  };

  // Auto-inicializar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecurityScalability);
  } else {
    initSecurityScalability();
  }

})();
