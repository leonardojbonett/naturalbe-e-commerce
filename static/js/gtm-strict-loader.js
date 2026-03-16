(function loadNaturalBeGtmStrict() {
  var w = window;
  var d = document;
  var l = 'dataLayer';
  var i = 'GTM-M7MF395K';
  w[l] = w[l] || [];
  var loaded = false;

  function loadGtm() {
    if (loaded) return;
    loaded = true;
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = d.createElement('script');
    var dl = l !== 'dataLayer' ? '&l=' + l : '';
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    d.head.appendChild(s);
  }

  ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(function (evt) {
    w.addEventListener(evt, loadGtm, { once: true, passive: true });
  });
})();
