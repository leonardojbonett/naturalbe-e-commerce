// Runtime optimizations to reduce mobile DOM/styling cost.
(function () {
  window.NaturalBe = window.NaturalBe || {};

  function pruneNonCriticalMobileUI() {
    if (!window.matchMedia || !window.matchMedia("(max-width: 900px)").matches) return;
    // Keep header/menu DOM stable to avoid CLS in main content.
    const emailGuideBanner = document.getElementById("emailGuideBanner");
    if (emailGuideBanner) emailGuideBanner.remove();
  }

  function runOptimizations() {
    pruneNonCriticalMobileUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runOptimizations, { once: true });
  } else {
    runOptimizations();
  }
})();
