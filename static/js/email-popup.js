// Email Popup Logic (behavior-aware, accessible, and non-aggressive)
(() => {
  const DISMISS_KEY = "emailPopupDismissedAt";
  const SUBMITTED_KEY = "emailPopupSubmittedAt";
  const SESSION_SHOWN_KEY = "emailPopupShownSession";
  const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 dias
  const SUBMIT_COOLDOWN_MS = 180 * 24 * 60 * 60 * 1000; // 180 dias
  const EXIT_INTENT_MIN_MS = 20000; // 20s
  const ENABLE_TIME_TRIGGER = false;
  const ENABLE_SCROLL_TRIGGER = false;
  const ENABLE_EXIT_INTENT = false;

  let hasShownPopup = false;
  let lastActiveElement = null;
  let timeTriggerTimeout = null;
  let hasScrollTriggered = false;
  let hasExitIntentTriggered = false;

  function now() {
    return Date.now();
  }

  function getInt(storage, key) {
    try {
      const value = storage.getItem(key);
      if (!value) return 0;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch (_) {
      return 0;
    }
  }

  function setValue(storage, key, value) {
    try {
      storage.setItem(key, String(value));
    } catch (_) {
      // noop
    }
  }

  function canShowPopup() {
    if (hasShownPopup) return false;
    if (window.innerWidth < 1024) return false;

    const dismissedAt = getInt(localStorage, DISMISS_KEY);
    const submittedAt = getInt(localStorage, SUBMITTED_KEY);
    const shownThisSession = getInt(sessionStorage, SESSION_SHOWN_KEY);
    const elapsed = now();

    if (shownThisSession) return false;
    if (submittedAt && elapsed - submittedAt < SUBMIT_COOLDOWN_MS) return false;
    if (dismissedAt && elapsed - dismissedAt < DISMISS_COOLDOWN_MS) return false;
    return true;
  }

  function shouldPausePopup() {
    const cartModal = document.getElementById("cartModal");
    const isCartOpen = !!(cartModal && cartModal.classList.contains("show"));
    return isCartOpen;
  }

  function emitPopupEvent(eventName, extra = {}) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, {
        page_path: window.location.pathname,
        ...extra
      });
    }
  }

  function focusFirstField() {
    const modal = document.getElementById("emailPopupModal");
    const firstField = modal?.querySelector('input[type="email"]');
    firstField?.focus();
  }

  function showEmailPopup(source = "unknown") {
    if (!canShowPopup() || shouldPausePopup()) return;

    const modal = document.getElementById("emailPopupModal");
    if (!modal) return;

    lastActiveElement = document.activeElement;
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    hasShownPopup = true;
    setValue(sessionStorage, SESSION_SHOWN_KEY, now());

    if (timeTriggerTimeout) {
      clearTimeout(timeTriggerTimeout);
      timeTriggerTimeout = null;
    }

    emitPopupEvent("popup_shown", {
      popup_name: "email_guide",
      popup_source: source,
      time_on_page_seconds: Math.round((performance.now ? performance.now() : 0) / 1000)
    });

    focusFirstField();
  }

  function closeEmailPopup(reason = "dismiss") {
    const modal = document.getElementById("emailPopupModal");
    if (!modal) return;

    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (reason !== "submit_success") {
      setValue(localStorage, DISMISS_KEY, now());
      emitPopupEvent("popup_dismissed", {
        popup_name: "email_guide",
        dismiss_reason: reason
      });
    }

    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
      lastActiveElement.focus();
    }
  }

  function handleEscClose(event) {
    if (event.key !== "Escape") return;
    const modal = document.getElementById("emailPopupModal");
    if (modal && modal.style.display === "flex") {
      closeEmailPopup("esc");
    }
  }

  function handleFocusTrap(event) {
    if (event.key !== "Tab") return;
    const modal = document.getElementById("emailPopupModal");
    if (!modal || modal.style.display !== "flex") return;

    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  window.showEmailPopup = showEmailPopup;
  window.closeEmailPopup = closeEmailPopup;

  const banner = document.getElementById("emailGuideBanner");
  const openBtn = document.getElementById("openEmailPopupBtn");
  const dismissBannerBtn = document.getElementById("dismissEmailGuideBanner");
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      if (window.innerWidth < 1024) {
        window.open("https://wa.me/573137212923?text=" + encodeURIComponent("Hola, quiero recibir la guia gratuita de Natural Be."), "_blank", "noopener");
        return;
      }
      showEmailPopup("banner_click");
      if (banner) banner.style.display = "none";
    });
  }
  if (dismissBannerBtn && banner) {
    dismissBannerBtn.addEventListener("click", () => {
      banner.style.display = "none";
    });
  }

  if (!canShowPopup()) return;

  if (ENABLE_TIME_TRIGGER) {
    timeTriggerTimeout = setTimeout(() => {
      showEmailPopup("time_trigger");
    }, 60000);
  }

  const modal = document.getElementById("emailPopupModal");
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeEmailPopup("outside_click");
  });

  document.addEventListener("keydown", handleEscClose);
  document.addEventListener("keydown", handleFocusTrap);

  if (ENABLE_SCROLL_TRIGGER) {
    window.addEventListener("scroll", () => {
      if (hasScrollTriggered || hasShownPopup || !canShowPopup()) return;
      const doc = document.documentElement;
      const maxScrollable = doc.scrollHeight - window.innerHeight;
      if (maxScrollable <= 0) return;

      const percent = (window.scrollY / maxScrollable) * 100;
      if (percent >= 50) {
        hasScrollTriggered = true;
        showEmailPopup("scroll_trigger");
      }
    }, { passive: true });
  }

  if (ENABLE_EXIT_INTENT) {
    document.addEventListener("mouseleave", (e) => {
      if (hasExitIntentTriggered || hasShownPopup || !canShowPopup()) return;
      const elapsed = performance.now ? performance.now() : 0;
      if (e.clientY <= 10 && elapsed >= EXIT_INTENT_MIN_MS) {
        hasExitIntentTriggered = true;
        showEmailPopup("exit_intent");
      }
    });
  }

  const form = document.getElementById("popupEmailForm");
  const msgEl = document.getElementById("popupEmailMessage");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const email = form.querySelector('input[type="email"]')?.value?.trim() || "";
    const phone = form.querySelector('input[type="tel"]')?.value?.trim() || "";
    const endpoint = window.NB_NEWSLETTER_ENDPOINT;

    if (!endpoint) {
      if (msgEl) msgEl.textContent = "No pudimos enviar ahora. Escríbenos por WhatsApp y te compartimos la guía.";
      emitPopupEvent("popup_submit_error", { popup_name: "email_guide", error_reason: "missing_endpoint" });
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (msgEl) msgEl.textContent = "Enviando...";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone })
      });

      if (!response.ok) {
        throw new Error(`Newsletter request failed: ${response.status}`);
      }

      setValue(localStorage, SUBMITTED_KEY, now());
      emitPopupEvent("popup_submit_success", { popup_name: "email_guide" });
      closeEmailPopup("submit_success");
      alert("¡Gracias! Revisa tu correo en unos segundos.");
      form.reset();
    } catch (_) {
      if (msgEl) msgEl.textContent = "No pudimos enviar tu guía ahora. Intenta de nuevo o escríbenos por WhatsApp.";
      emitPopupEvent("popup_submit_error", {
        popup_name: "email_guide",
        error_reason: "request_failed"
      });
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();
