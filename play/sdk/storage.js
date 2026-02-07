(() => {
  const POINTS_KEY = 'nb_play_points';
  const COUPON_KEY = 'nb_play_coupon';

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function getPoints() {
    return safeGet(POINTS_KEY, 0);
  }

  function addPoints(value) {
    const points = Math.max(0, Number(value) || 0);
    const next = getPoints() + points;
    safeSet(POINTS_KEY, next);
    return next;
  }

  function generateCoupon() {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `PLAY-${suffix}`;
  }

  function getCoupon() {
    return safeGet(COUPON_KEY, '');
  }

  function getOrCreateCoupon() {
    let coupon = getCoupon();
    if (!coupon) {
      coupon = generateCoupon();
      safeSet(COUPON_KEY, coupon);
    }
    return coupon;
  }

  window.NBPlayStorage = {
    getPoints,
    addPoints,
    getOrCreateCoupon,
    safeGet,
    safeSet
  };
})();
