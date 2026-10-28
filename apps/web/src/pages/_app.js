import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
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
    }
    
    return response;
  };
}

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}
