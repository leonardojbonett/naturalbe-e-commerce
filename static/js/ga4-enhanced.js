// ============================================
// NATURAL BE - GOOGLE ANALYTICS 4 ENHANCED
// ============================================
// Tracking avanzado de eventos de e-commerce

(() => {
    'use strict';

    // Verificar que GA4 esté disponible
    if (typeof gtag === 'undefined') {
        console.warn('GA4 no está disponible');
        return;
    }

    // ============================================
    // 1. TRACKING DE SCROLL DEPTH
    // ============================================
    const scrollThresholds = [25, 50, 75, 90, 100];
    const scrollTracked = new Set();

    function trackScrollDepth() {
        const scrollPercent = Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );

        scrollThresholds.forEach(threshold => {
            if (scrollPercent >= threshold && !scrollTracked.has(threshold)) {
                scrollTracked.add(threshold);
                gtag('event', 'scroll_depth', {
                    depth: threshold,
                    page_path: window.location.pathname
                });
            }
        });
    }

    let scrollTimer;
    window.addEventListener('scroll', () => {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(trackScrollDepth, 500);
    }, { passive: true });

    // ============================================
    // 2. TRACKING DE TIEMPO EN PÁGINA
    // ============================================
    const pageStartTime = Date.now();

    window.addEventListener('beforeunload', () => {
        const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);
        gtag('event', 'time_on_page', {
            time_seconds: timeOnPage,
            page_path: window.location.pathname
        });
    });

    // ============================================
    // 3. TRACKING DE CLICKS EN WHATSAPP
    // ============================================
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href*="wa.me"]');
        if (link) {
            const href = link.getAttribute('href');
            const content = link.dataset.waContent || 'unknown';
            
            gtag('event', 'whatsapp_click', {
                link_url: href,
                content_type: content,
                page_path: window.location.pathname
            });
        }
    });

    // ============================================
    // 4. TRACKING DE BÚSQUEDAS
    // ============================================
    const searchInputs = document.querySelectorAll('input[type="search"]');
    
    searchInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = input.value.trim();
                if (searchTerm) {
                    gtag('event', 'search', {
                        search_term: searchTerm,
                        page_path: window.location.pathname
                    });
                }
            }
        });
    });

    // ============================================
    // 5. TRACKING DE FILTROS
    // ============================================
    document.addEventListener('click', (e) => {
        const filterBtn = e.target.closest('.filter-btn');
        if (filterBtn) {
            const category = filterBtn.dataset.category || 'unknown';
            gtag('event', 'filter_applied', {
                filter_type: 'category',
                filter_value: category,
                page_path: window.location.pathname
            });
        }
    });

    // ============================================
    // 6. TRACKING DE ENGAGEMENT
    // ============================================
    let engagementTimer;
    let isEngaged = false;

    function trackEngagement() {
        if (!isEngaged) {
            isEngaged = true;
            gtag('event', 'user_engagement', {
                engagement_time_msec: 10000,
                page_path: window.location.pathname
            });
        }
    }

    // Considerar engaged después de 10 segundos
    engagementTimer = setTimeout(trackEngagement, 10000);

    // ============================================
    // 7. TRACKING DE ERRORES
    // ============================================
    window.addEventListener('error', (e) => {
        gtag('event', 'exception', {
            description: e.message,
            fatal: false,
            page_path: window.location.pathname
        });
    });

    // ============================================
    // 8. TRACKING DE OUTBOUND LINKS
    // ============================================
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.hostname !== window.location.hostname) {
            gtag('event', 'click', {
                event_category: 'outbound',
                event_label: link.href,
                transport_type: 'beacon'
            });
        }
    });

    // ============================================
    // 9. TRACKING DE VIDEOS (si hay)
    // ============================================
    const videos = document.querySelectorAll('video');
    
    videos.forEach(video => {
        let tracked25 = false, tracked50 = false, tracked75 = false;
        
        video.addEventListener('play', () => {
            gtag('event', 'video_start', {
                video_title: video.title || 'unknown',
                page_path: window.location.pathname
            });
        });
        
        video.addEventListener('timeupdate', () => {
            const percent = (video.currentTime / video.duration) * 100;
            
            if (percent >= 25 && !tracked25) {
                tracked25 = true;
                gtag('event', 'video_progress', {
                    video_title: video.title || 'unknown',
                    video_percent: 25
                });
            }
            if (percent >= 50 && !tracked50) {
                tracked50 = true;
                gtag('event', 'video_progress', {
                    video_title: video.title || 'unknown',
                    video_percent: 50
                });
            }
            if (percent >= 75 && !tracked75) {
                tracked75 = true;
                gtag('event', 'video_progress', {
                    video_title: video.title || 'unknown',
                    video_percent: 75
                });
            }
        });
        
        video.addEventListener('ended', () => {
            gtag('event', 'video_complete', {
                video_title: video.title || 'unknown',
                page_path: window.location.pathname
            });
        });
    });

    // ============================================
    // 10. TRACKING DE FORMULARIOS
    // ============================================
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            const formId = form.id || 'unknown';
            gtag('event', 'form_submit', {
                form_id: formId,
                page_path: window.location.pathname
            });
        });
    });

    // ============================================
    // 11. TRACKING DE PRODUCTOS VISTOS (ENHANCED)
    // ============================================
    function trackProductView(product) {
        gtag('event', 'view_item', {
            currency: 'COP',
            value: product.price || 0,
            items: [{
                item_id: product.id,
                item_name: product.name || product.nombre,
                item_brand: product.brand || product.marca || 'Natural Be',
                item_category: product.category || product.categoria,
                item_category2: product.subcategory || product.subcategoria,
                price: product.price || product.precio,
                quantity: 1
            }]
        });
    }

    // ============================================
    // 12. TRACKING DE LISTA DE PRODUCTOS
    // ============================================
    function trackProductList(products, listName, listId) {
        const items = products.slice(0, 20).map((product, index) => ({
            item_id: product.id,
            item_name: product.name || product.nombre,
            item_brand: product.brand || product.marca || 'Natural Be',
            item_category: product.category || product.categoria,
            item_list_name: listName,
            item_list_id: listId,
            index: index + 1,
            price: product.price || product.precio,
            quantity: 1
        }));

        gtag('event', 'view_item_list', {
            item_list_id: listId,
            item_list_name: listName,
            items: items
        });
    }

    // ============================================
    // 13. TRACKING DE INTERACCIONES CON PRODUCTOS
    // ============================================
    document.addEventListener('click', (e) => {
        const productCard = e.target.closest('.product-card');
        if (productCard) {
            const productId = productCard.dataset.productId;
            const productName = productCard.querySelector('h3')?.textContent || 'unknown';
            
            gtag('event', 'select_item', {
                item_list_id: 'product_grid',
                item_list_name: 'Catálogo de productos',
                items: [{
                    item_id: productId,
                    item_name: productName
                }]
            });
        }
    });

    // ============================================
    // 14. TRACKING DE PERFORMANCE WEB VITALS
    // ============================================
    function trackWebVitals() {
        // Core Web Vitals
        if ('web-vital' in window) {
            import('https://unpkg.com/web-vitals@3/dist/web-vitals.js').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                getCLS((metric) => {
                    gtag('event', 'web_vital', {
                        name: metric.name,
                        value: Math.round(metric.value * 1000),
                        event_category: 'Web Vitals'
                    });
                });

                getFID((metric) => {
                    gtag('event', 'web_vital', {
                        name: metric.name,
                        value: Math.round(metric.value),
                        event_category: 'Web Vitals'
                    });
                });

                getFCP((metric) => {
                    gtag('event', 'web_vital', {
                        name: metric.name,
                        value: Math.round(metric.value),
                        event_category: 'Web Vitals'
                    });
                });

                getLCP((metric) => {
                    gtag('event', 'web_vital', {
                        name: metric.name,
                        value: Math.round(metric.value),
                        event_category: 'Web Vitals'
                    });
                });

                getTTFB((metric) => {
                    gtag('event', 'web_vital', {
                        name: metric.name,
                        value: Math.round(metric.value),
                        event_category: 'Web Vitals'
                    });
                });
            }).catch(() => {
                console.log('Web Vitals library not available');
            });
        }
    }

    // ============================================
    // 15. TRACKING DE SESIONES Y COHORTS
    // ============================================
    function trackSessionInfo() {
        const sessionStart = Date.now();
        const isReturning = localStorage.getItem('nb_returning_user') === 'true';
        
        if (!isReturning) {
            localStorage.setItem('nb_returning_user', 'true');
            gtag('event', 'first_visit', {
                page_path: window.location.pathname
            });
        }

        // Tracking de fuente de tráfico
        const referrer = document.referrer;
        const utmSource = new URLSearchParams(window.location.search).get('utm_source');
        
        if (utmSource) {
            gtag('event', 'campaign_visit', {
                campaign_source: utmSource,
                page_path: window.location.pathname
            });
        } else if (referrer) {
            const referrerDomain = new URL(referrer).hostname;
            gtag('event', 'referral_visit', {
                referrer_domain: referrerDomain,
                page_path: window.location.pathname
            });
        }
    }

    // ============================================
    // 16. TRACKING DE INTENCIÓN DE SALIDA
    // ============================================
    let exitIntentTracked = false;
    
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 0 && !exitIntentTracked) {
            exitIntentTracked = true;
            gtag('event', 'exit_intent', {
                page_path: window.location.pathname,
                time_on_page: Math.round((Date.now() - pageStartTime) / 1000)
            });
        }
    });

    // ============================================
    // FUNCIONES PÚBLICAS PARA USO EXTERNO
    // ============================================
    window.nbTrackProductView = trackProductView;
    window.nbTrackProductList = trackProductList;

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    document.addEventListener('DOMContentLoaded', () => {
        trackSessionInfo();
        trackWebVitals();
    });

    console.log('✓ GA4 Enhanced Tracking loaded');
})();
