import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Provider } from 'react-redux';
import { store } from '../store';
import { trackPageview } from '../utils/analytics';
import '../styles/globals.css';

if (typeof window !== 'undefined' && !window.__fetchPatched) {
  window.__fetchPatched = true;
  const originalFetch = window.fetch;
  window.fetch = async function () {
    let [resource, config] = arguments;
    const token = localStorage.getItem('token');
    
    if (typeof resource === 'string' && resource.startsWith('/v2.4') && !resource.startsWith('/v2.4/auth')) {
      config = config || {};
      config.headers = {
        ...config.headers,
        'Authorization': token ? `Bearer ${token}` : ''
      };
    }
    
    const response = await originalFetch(resource, config);
    
    // 如果返回 401 且不是在登录页，则跳转到登录页
    if (response.status === 401 && window.location.pathname !== '/auth/login') {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
      // 返回一个永远不 resolve 的 Promise，阻断后续执行，防止在跳转前触发 React 渲染报错
      return new Promise(() => {});
    }
    
    return response;
  };
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const initialPageviewTracked = useRef(false);

  useEffect(() => {
    if (!initialPageviewTracked.current) {
      trackPageview(router.pathname);
      initialPageviewTracked.current = true;
    }

    const handleRouteChange = (url) => trackPageview(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events, router.pathname]);

  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}
