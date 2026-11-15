const getHmt = () => {
  if (typeof window === 'undefined') return null;
  window._hmt = window._hmt || [];
  return window._hmt;
};

const getSafePagePath = (path) => {
  const pathname = String(path || '/').split('?')[0];
  return pathname.replace(/^\/s\/[^/]+\/?$/, '/s/[token]');
};

export const trackPageview = (path) => {
  const hmt = getHmt();
  if (hmt) {
    hmt.push(['_trackPageview', getSafePagePath(path)]);
  }
};

export const trackEvent = (category, action, label = '') => {
  const hmt = getHmt();
  if (hmt) {
    hmt.push(['_trackEvent', category, action, label]);
  }
};
