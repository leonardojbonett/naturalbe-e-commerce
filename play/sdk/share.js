(() => {
  function shareText({ title, text, url }) {
    if (navigator.share) {
      return navigator.share({ title, text, url });
    }
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text || url || '').then(() => true);
    }
    return Promise.resolve(false);
  }

  window.NBPlayShare = {
    shareText
  };
})();
