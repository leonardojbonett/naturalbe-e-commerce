(() => {
  const MAX_EVENTS = 200;
  const STORAGE_KEY = 'nb_play_events';

  const state = {
    gameId: 'unknown',
    gameName: 'Unknown Game'
  };

  function getStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function setStore(events) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
    } catch (err) {
      // noop
    }
  }

  function track(eventName, payload = {}) {
    const event = {
      name: eventName,
      gameId: state.gameId,
      gameName: state.gameName,
      ts: Date.now(),
      payload
    };

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...event });
    }

    const events = getStore();
    events.push(event);
    setStore(events);
  }

  function init(config = {}) {
    state.gameId = config.gameId || state.gameId;
    state.gameName = config.gameName || state.gameName;
    track('sdk_init', { version: '1.0.0' });
  }

  window.NBPlayAnalytics = {
    init,
    track
  };
})();
