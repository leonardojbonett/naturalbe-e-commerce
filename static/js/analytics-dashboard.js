// Dashboard de Métricas para Natural Be Colombia
// Monitoreo de KPIs para medir impacto de las implementaciones

(function() {
  'use strict';

  // KPIs a medir
  const kpis = {
    // Métricas de negocio
    business: {
      conversionRate: {
        name: 'Tasa de Conversión',
        target: 3.5, // 3.5% target
        current: 0,
        unit: '%',
        improvement: '+45%'
      },
      averageOrderValue: {
        name: 'Valor Promedio de Pedido',
        target: 150000, // $150.000 COP
        current: 0,
        unit: 'COP',
        improvement: '+35%'
      },
      customerRetention: {
        name: 'Retención de Clientes',
        target: 40, // 40%
        current: 0,
        unit: '%',
        improvement: '+60%'
      },
      repeatPurchaseRate: {
        name: 'Tasa de Compra Repetida',
        target: 25, // 25%
        current: 0,
        unit: '%',
        improvement: '+80%'
      }
    },

    // Métricas de tráfico
    traffic: {
      organicSearchGrowth: {
        name: 'Crecimiento Búsqueda Orgánica',
        target: 300, // 300%
        current: 0,
        unit: '%',
        improvement: '+300%'
      },
      mobileConversionRate: {
        name: 'Conversión Móvil',
        target: 2.8, // 2.8%
        current: 0,
        unit: '%',
        improvement: '+40%'
      },
      pageLoadTime: {
        name: 'Tiempo de Carga',
        target: 2.0, // 2 segundos
        current: 0,
        unit: 's',
        improvement: '-60%'
      },
      bounceRate: {
        name: 'Tasa de Rebote',
        target: 35, // 35%
        current: 0,
        unit: '%',
        improvement: '-25%'
      }
    },

    // Métricas de engagement
    engagement: {
      recommendationCTR: {
        name: 'CTR Recomendaciones',
        target: 15, // 15%
        current: 0,
        unit: '%',
        improvement: '+25%'
      },
      loyaltyProgramAdoption: {
        name: 'Adopción Programa Lealtad',
        target: 60, // 60%
        current: 0,
        unit: '%',
        improvement: '+70%'
      },
      cartAbandonmentRate: {
        name: 'Abandono de Carrito',
        target: 25, // 25%
        current: 0,
        unit: '%',
        improvement: '-30%'
      },
      averageSessionDuration: {
        name: 'Duración Promedio de Sesión',
        target: 240, // 4 minutos
        current: 0,
        unit: 's',
        improvement: '+35%'
      }
    },

    // Métricas locales colombianas
    local: {
      bogotaSales: {
        name: 'Ventas Bogotá',
        target: 35, // 35% del total
        current: 0,
        unit: '%',
        improvement: '+50%'
      },
      medellinSales: {
        name: 'Ventas Medellín',
        target: 25, // 25% del total
        current: 0,
        unit: '%',
        improvement: '+40%'
      },
      caliSales: {
        name: 'Ventas Cali',
        target: 15, // 15% del total
        current: 0,
        unit: '%',
        improvement: '+30%'
      },
      barranquillaSales: {
        name: 'Ventas Barranquilla',
        target: 10, // 10% del total
        current: 0,
        unit: '%',
        improvement: '+35%'
      }
    }
  };

  // Dashboard de analytics
  class AnalyticsDashboard {
    constructor() {
      this.data = {};
      this.charts = {};
      this.init();
    }

    init() {
      this.createDashboard();
      this.loadData();
      this.setupRealTimeUpdates();
      this.bindEvents();
    }

    // Crear dashboard
    createDashboard() {
      const dashboard = document.createElement('div');
      dashboard.className = 'analytics-dashboard';
      dashboard.innerHTML = `
        <div class="dashboard-header">
          <h2>📊 Dashboard Natural Be Colombia</h2>
          <div class="dashboard-controls">
            <select id="timeRange">
              <option value="7">Últimos 7 días</option>
              <option value="30" selected>Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
            </select>
            <button id="exportData" class="btn-primary">Exportar Datos</button>
          </div>
        </div>
        
        <div class="dashboard-content">
          <!-- KPIs Principales -->
          <div class="kpi-grid" id="kpiGrid">
            <!-- Aquí se cargarán los KPIs -->
          </div>
          
          <!-- Gráficos -->
          <div class="charts-container">
            <div class="chart-section">
              <h3>Tendencia de Ventas</h3>
              <canvas id="salesChart"></canvas>
            </div>
            <div class="chart-section">
              <h3>Conversión por Canal</h3>
              <canvas id="conversionChart"></canvas>
            </div>
          </div>
          
          <!-- Métricas Detalladas -->
          <div class="metrics-tabs">
            <div class="tab-nav">
              <button class="tab-btn active" data-tab="business">Negocio</button>
              <button class="tab-btn" data-tab="traffic">Tráfico</button>
              <button class="tab-btn" data-tab="engagement">Engagement</button>
              <button class="tab-btn" data-tab="local">Local Colombia</button>
            </div>
            <div class="tab-content">
              <div class="tab-pane active" id="business-tab">
                <!-- Métricas de negocio -->
              </div>
              <div class="tab-pane" id="traffic-tab">
                <!-- Métricas de tráfico -->
              </div>
              <div class="tab-pane" id="engagement-tab">
                <!-- Métricas de engagement -->
              </div>
              <div class="tab-pane" id="local-tab">
                <!-- Métricas locales -->
              </div>
            </div>
          </div>
        </div>
      `;

      // Agregar estilos
      this.addDashboardStyles();

      // Agregar al DOM
      document.body.appendChild(dashboard);

      // Crear botón flotante para abrir dashboard
      this.createFloatingButton();
    }

    // Agregar estilos del dashboard
    addDashboardStyles() {
      if (document.getElementById('dashboard-styles')) return;

      const styles = document.createElement('style');
      styles.id = 'dashboard-styles';
      styles.textContent = `
        .analytics-dashboard {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #f8fafc;
          z-index: 10000;
          overflow-y: auto;
          display: none;
        }
        .analytics-dashboard.active {
          display: block;
        }
        .dashboard-header {
          background: white;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .dashboard-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .dashboard-content {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        .kpi-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        .kpi-card:hover {
          transform: translateY(-2px);
        }
        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .kpi-title {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }
        .kpi-improvement {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
        .kpi-improvement.positive {
          background: #dcfce7;
          color: #16a34a;
        }
        .kpi-improvement.negative {
          background: #fee2e2;
          color: #dc2626;
        }
        .kpi-value {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .kpi-target {
          font-size: 12px;
          color: #9ca3af;
        }
        .kpi-progress {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 12px;
        }
        .kpi-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          transition: width 0.3s ease;
        }
        .charts-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        .chart-section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .chart-section h3 {
          margin-bottom: 20px;
          color: #1f2937;
        }
        .metrics-tabs {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .tab-nav {
          display: flex;
          background: #f3f4f6;
          border-bottom: 1px solid #e5e7eb;
        }
        .tab-btn {
          padding: 16px 24px;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: white;
          color: #3b82f6;
          border-bottom: 2px solid #3b82f6;
        }
        .tab-content {
          padding: 24px;
        }
        .tab-pane {
          display: none;
        }
        .tab-pane.active {
          display: block;
        }
        .metric-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .metric-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
        }
        .metric-label {
          font-weight: 500;
          color: #374151;
        }
        .metric-value {
          font-weight: bold;
          color: #1f2937;
        }
        .dashboard-trigger {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 50%;
          width: 56px;
          height: 56px;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          z-index: 9999;
          transition: transform 0.2s;
        }
        .dashboard-trigger:hover {
          transform: scale(1.1);
        }
        .dashboard-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 20px;
          cursor: pointer;
          z-index: 11;
        }
      `;
      document.head.appendChild(styles);
    }

    // Crear botón flotante
    createFloatingButton() {
      const trigger = document.createElement('button');
      trigger.className = 'dashboard-trigger';
      trigger.innerHTML = '📊';
      trigger.title = 'Abrir Dashboard';
      
      trigger.addEventListener('click', () => {
        document.querySelector('.analytics-dashboard').classList.add('active');
        this.refreshData();
      });

      document.body.appendChild(trigger);

      // Botón de cerrar
      const closeBtn = document.createElement('button');
      closeBtn.className = 'dashboard-close';
      closeBtn.innerHTML = '×';
      closeBtn.addEventListener('click', () => {
        document.querySelector('.analytics-dashboard').classList.remove('active');
      });

      document.querySelector('.dashboard-header').appendChild(closeBtn);
    }

    // Cargar datos
    async loadData() {
      try {
        // Simular carga de datos desde analytics
        this.data = await this.fetchAnalyticsData();
        this.renderKPIs();
        this.renderCharts();
        this.renderDetailedMetrics();
      } catch (error) {
        console.error('Error loading analytics data:', error);
      }
    }

    // Obtener datos de analytics (simulado)
    async fetchAnalyticsData() {
      // En producción, esto vendría de tu backend o Google Analytics API
      return {
        conversionRate: 2.8,
        averageOrderValue: 125000,
        customerRetention: 28,
        repeatPurchaseRate: 18,
        organicSearchGrowth: 180,
        mobileConversionRate: 2.1,
        pageLoadTime: 3.2,
        bounceRate: 42,
        recommendationCTR: 11,
        loyaltyProgramAdoption: 35,
        cartAbandonmentRate: 35,
        averageSessionDuration: 165,
        bogotaSales: 28,
        medellinSales: 18,
        caliSales: 12,
        barranquillaSales: 7,
        salesData: this.generateSalesData(),
        conversionData: this.generateConversionData()
      };
    }

    // Generar datos de ventas simulados
    generateSalesData() {
      const days = 30;
      const data = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        data.push({
          date: date.toISOString().split('T')[0],
          sales: Math.floor(Math.random() * 500000) + 100000,
          orders: Math.floor(Math.random() * 50) + 10
        });
      }
      
      return data;
    }

    // Generar datos de conversión simulados
    generateConversionData() {
      return [
        { channel: 'Búsqueda Orgánica', rate: 3.2 },
        { channel: 'Directo', rate: 4.1 },
        { channel: 'Social Media', rate: 2.1 },
        { channel: 'Email', rate: 5.8 },
        { channel: 'WhatsApp', rate: 8.2 },
        { channel: 'Pago Click', rate: 1.8 }
      ];
    }

    // Renderizar KPIs
    renderKPIs() {
      const kpiGrid = document.getElementById('kpiGrid');
      if (!kpiGrid) return;

      const mainKPIs = [
        { key: 'conversionRate', category: 'business' },
        { key: 'averageOrderValue', category: 'business' },
        { key: 'organicSearchGrowth', category: 'traffic' },
        { key: 'recommendationCTR', category: 'engagement' }
      ];

      kpiGrid.innerHTML = mainKPIs.map(kpi => {
        const kpiData = kpis[kpi.category][kpi.key];
        const currentValue = this.data[kpi.key] || 0;
        const progress = (currentValue / kpiData.target) * 100;
        const isPositive = kpiData.improvement.startsWith('+');

        return `
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">${kpiData.name}</span>
              <span class="kpi-improvement ${isPositive ? 'positive' : 'negative'}">
                ${kpiData.improvement}
              </span>
            </div>
            <div class="kpi-value">
              ${kpiData.unit === 'COP' ? 
                new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(currentValue) :
                currentValue.toLocaleString('es-CO') + kpiData.unit}
            </div>
            <div class="kpi-target">
              Target: ${kpiData.unit === 'COP' ? 
                new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(kpiData.target) :
                kpiData.target.toLocaleString('es-CO') + kpiData.unit}
            </div>
            <div class="kpi-progress">
              <div class="kpi-progress-bar" style="width: ${Math.min(progress, 100)}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Renderizar gráficos
    renderCharts() {
      this.renderSalesChart();
      this.renderConversionChart();
    }

    // Renderizar gráfico de ventas
    renderSalesChart() {
      const canvas = document.getElementById('salesChart');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const salesData = this.data.salesData;

      // Gráfico simple (en producción usar Chart.js o similar)
      canvas.width = canvas.offsetWidth;
      canvas.height = 300;

      // Dibujar gráfico de líneas básico
      const padding = 40;
      const width = canvas.width - padding * 2;
      const height = canvas.height - padding * 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ejes
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, canvas.height - padding);
      ctx.lineTo(canvas.width - padding, canvas.height - padding);
      ctx.stroke();

      // Línea de ventas
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const maxSales = Math.max(...salesData.map(d => d.sales));
      const xStep = width / (salesData.length - 1);

      salesData.forEach((data, index) => {
        const x = padding + (index * xStep);
        const y = canvas.height - padding - ((data.sales / maxSales) * height);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Renderizar gráfico de conversión
    renderConversionChart() {
      const canvas = document.getElementById('conversionChart');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const conversionData = this.data.conversionData;

      canvas.width = canvas.offsetWidth;
      canvas.height = 300;

      // Gráfico de barras básico
      const padding = 40;
      const width = canvas.width - padding * 2;
      const height = canvas.height - padding * 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = width / conversionData.length;
      const maxRate = Math.max(...conversionData.map(d => d.rate));

      conversionData.forEach((data, index) => {
        const x = padding + (index * barWidth);
        const barHeight = (data.rate / maxRate) * height;
        const y = canvas.height - padding - barHeight;

        // Barra
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(x + 10, y, barWidth - 20, barHeight);

        // Etiqueta
        ctx.fillStyle = '#374151';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(data.channel, x + barWidth / 2, canvas.height - 20);
        ctx.fillText(data.rate + '%', x + barWidth / 2, y - 5);
      });
    }

    // Renderizar métricas detalladas
    renderDetailedMetrics() {
      Object.keys(kpis).forEach(category => {
        const tabPane = document.getElementById(`${category}-tab`);
        if (!tabPane) return;

        const metrics = Object.entries(kpis[category]).map(([key, data]) => {
          const currentValue = this.data[key] || 0;
          const progress = (currentValue / data.target) * 100;
          const isPositive = data.improvement.startsWith('+');

          return `
            <div class="metric-row">
              <div class="metric-item">
                <span class="metric-label">${data.name}</span>
                <span class="metric-value">
                  ${data.unit === 'COP' ? 
                    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(currentValue) :
                    currentValue.toLocaleString('es-CO') + data.unit}
                </span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Target</span>
                <span class="metric-value">
                  ${data.unit === 'COP' ? 
                    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(data.target) :
                    data.target.toLocaleString('es-CO') + data.unit}
                </span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Mejora</span>
                <span class="kpi-improvement ${isPositive ? 'positive' : 'negative'}">
                  ${data.improvement}
                </span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Progreso</span>
                <div style="flex: 1; margin-left: 12px;">
                  <div class="kpi-progress">
                    <div class="kpi-progress-bar" style="width: ${Math.min(progress, 100)}%"></div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');

        tabPane.innerHTML = metrics;
      });
    }

    // Configurar actualizaciones en tiempo real
    setupRealTimeUpdates() {
      // Actualizar cada 5 minutos
      setInterval(() => {
        this.refreshData();
      }, 300000);

      // Escuchar eventos de analytics
      document.addEventListener('analytics-event', (e) => {
        this.handleRealTimeEvent(e.detail);
      });
    }

    // Manejar eventos en tiempo real
    handleRealTimeEvent(event) {
      // Actualizar KPIs relevantes
      if (event.type === 'purchase') {
        this.updateRealTimeKPI('conversionRate');
        this.updateRealTimeKPI('averageOrderValue');
      }
    }

    // Actualizar KPI en tiempo real
    updateRealTimeKPI(kpiKey) {
      // Recalcular valor
      const newValue = this.calculateRealTimeKPI(kpiKey);
      this.data[kpiKey] = newValue;

      // Actualizar UI
      this.renderKPIs();
    }

    // Calcular KPI en tiempo real
    calculateRealTimeKPI(kpiKey) {
      // Lógica para calcular KPIs en tiempo real
      switch (kpiKey) {
        case 'conversionRate':
          return this.calculateConversionRate();
        case 'averageOrderValue':
          return this.calculateAOV();
        default:
          return this.data[kpiKey] || 0;
      }
    }

    // Calcular tasa de conversión
    calculateConversionRate() {
      const sessions = this.getSessionsCount();
      const orders = this.getOrdersCount();
      return sessions > 0 ? (orders / sessions) * 100 : 0;
    }

    // Calcular AOV
    calculateAOV() {
      const orders = this.getOrdersCount();
      const revenue = this.getTotalRevenue();
      return orders > 0 ? revenue / orders : 0;
    }

    // Obtener conteo de sesiones (simulado)
    getSessionsCount() {
      return Math.floor(Math.random() * 1000) + 500;
    }

    // Obtener conteo de órdenes (simulado)
    getOrdersCount() {
      return Math.floor(Math.random() * 50) + 10;
    }

    // Obtener revenue total (simulado)
    getTotalRevenue() {
      return Math.floor(Math.random() * 5000000) + 1000000;
    }

    // Refrescar datos
    async refreshData() {
      try {
        this.data = await this.fetchAnalyticsData();
        this.renderKPIs();
        this.renderCharts();
        this.renderDetailedMetrics();
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    }

    // Bind events
    bindEvents() {
      // Tabs
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tabName = e.target.dataset.tab;
          
          // Actualizar botones
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          
          // Actualizar paneles
          document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
          document.getElementById(`${tabName}-tab`).classList.add('active');
        });
      });

      // Exportar datos
      document.getElementById('exportData')?.addEventListener('click', () => {
        this.exportData();
      });

      // Cambio de rango de tiempo
      document.getElementById('timeRange')?.addEventListener('change', (e) => {
        this.changeTimeRange(e.target.value);
      });
    }

    // Exportar datos
    exportData() {
      const csvContent = this.generateCSV();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `natural-be-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      window.URL.revokeObjectURL(url);
    }

    // Generar CSV
    generateCSV() {
      const headers = ['Métrica', 'Valor Actual', 'Target', 'Mejora', 'Progreso'];
      const rows = [headers];

      Object.keys(kpis).forEach(category => {
        Object.entries(kpis[category]).forEach(([key, data]) => {
          const currentValue = this.data[key] || 0;
          const progress = ((currentValue / data.target) * 100).toFixed(1);
          
          rows.push([
            data.name,
            currentValue,
            data.target,
            data.improvement,
            progress + '%'
          ]);
        });
      });

      return rows.map(row => row.join(',')).join('\n');
    }

    // Cambiar rango de tiempo
    changeTimeRange(days) {
      // En producción, esto filtraría los datos por rango
      console.log(`Changing time range to ${days} days`);
      this.refreshData();
    }
  }

  // Inicialización
  let analyticsDashboard;

  function initAnalyticsDashboard() {
    analyticsDashboard = new AnalyticsDashboard();
  }

  // Exponer globalmente
  window.AnalyticsDashboard = {
    dashboard: analyticsDashboard,
    init: initAnalyticsDashboard,
    trackEvent: (type, data) => {
      // Emitir evento para actualización en tiempo real
      document.dispatchEvent(new CustomEvent('analytics-event', {
        detail: { type, data }
      }));
    }
  };

  // Auto-inicializar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalyticsDashboard);
  } else {
    initAnalyticsDashboard();
  }

})();
