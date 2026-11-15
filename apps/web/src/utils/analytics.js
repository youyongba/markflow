const getDataLayer = () => {
  if (typeof window === 'undefined') return null;
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
};

const getSafePagePath = (path) => {
  const pathname = String(path || '/').split('?')[0];
  return pathname.replace(/^\/s\/[^/]+\/?$/, '/s/[token]');
};

export const trackPageview = (path) => {
  const dataLayer = getDataLayer();
  if (dataLayer) {
    dataLayer.push({ event: 'page_view', page_path: getSafePagePath(path) });
  }
};

export const trackEvent = (category, action, label = '') => {
  const dataLayer = getDataLayer();
  if (dataLayer) {
    dataLayer.push({
      event: 'markflow_event',
      event_category: category,
      event_action: action,
      event_label: label,
      page_path: getSafePagePath(window.location.pathname)
    });
  }
};
