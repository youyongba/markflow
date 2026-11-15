const getBaiduQueue = () => {
  if (typeof window === 'undefined') return null;
  window._hmt = window._hmt || [];
  return window._hmt;
};

export const trackPageview = (path) => {
  const queue = getBaiduQueue();
  if (queue) queue.push(['_trackPageview', path]);
};

export const trackEvent = (category, action, label = '') => {
  const queue = getBaiduQueue();
  if (queue) queue.push(['_trackEvent', category, action, label]);
};
