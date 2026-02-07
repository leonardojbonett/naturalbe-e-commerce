(() => {
let lastFocusedElement = null;

function setMenuA11yState(menu, overlay, toggle, isOpen) {
    menu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function logMenuEvent(state, source) {
    if (typeof logEvent !== 'function') return;
    logEvent('menu_toggle', {
        state,
        source: source || 'hamburger'
    });
}

function trapFocusInMenu(menu, event) {
    if (!menu.classList.contains('open') || event.key !== 'Tab') return;
    const focusables = menu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function toggleMobileMenu(forceClose = false) {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('menuOverlay');
    const toggle = document.getElementById('menuToggle');
    if (!menu || !overlay || !toggle) return;

    const isOpen = menu.classList.contains('open');
    const shouldOpen = forceClose ? false : !isOpen;

    if (shouldOpen) {
        lastFocusedElement = document.activeElement;
        menu.classList.add('open');
        overlay.classList.add('visible');
        document.body.classList.add('no-scroll');
        setMenuA11yState(menu, overlay, toggle, true);
        const firstLink = menu.querySelector('a');
        if (firstLink) firstLink.focus();
        logMenuEvent('open', 'hamburger');
    } else {
        menu.classList.remove('open');
        overlay.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        setMenuA11yState(menu, overlay, toggle, false);
        if (lastFocusedElement) lastFocusedElement.focus();
        logMenuEvent('close', forceClose ? 'overlay_or_link' : 'hamburger');
    }
}

function setupNav() {
    const toggle = document.getElementById('menuToggle');
    const overlay = document.getElementById('menuOverlay');
    const menu = document.getElementById('mobileMenu');
    if (!toggle || !overlay || !menu) return;

    setMenuA11yState(menu, overlay, toggle, false);

    toggle.addEventListener('click', () => toggleMobileMenu());
    overlay.addEventListener('click', () => toggleMobileMenu(true));
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => toggleMobileMenu(true));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('open')) {
            toggleMobileMenu(true);
        }
    });

    menu.addEventListener('keydown', (e) => trapFocusInMenu(menu, e));

    // Shrink header on scroll (desktop + mobile)
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
        const y = window.scrollY;
        const goingDown = y > lastY && y > 20;
        document.body.classList.toggle('nb-scroll-down', goingDown);
        lastY = y;
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(onScroll);
    }, { passive: true });
}

document.addEventListener('DOMContentLoaded', setupNav);

window.setupNav = setupNav;
window.toggleMobileMenu = toggleMobileMenu;
})();
