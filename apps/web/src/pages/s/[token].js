import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ShareLinkAccept() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('正在处理分享链接，请稍候...');

  useEffect(() => {
    if (!token) return;

    const acceptShare = async () => {
      try {
        const jwtToken = localStorage.getItem('token');
        if (!jwtToken) {
          // 如果未登录，跳转到登录页，并带上 redirect
          router.push(`/auth/login?redirect=/s/${token}`);
          return;
        }

        const res = await fetch(`/v2.4/header/share-link/${token}/accept`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          }
        });

        const data = await res.json();
        if (data.code === 200) {
          setStatus('success');
          setMessage('已成功接收分享文档！即将跳转到工作区...');
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          setStatus('error');
          setMessage(data.message || '接收分享失败，链接可能已失效');
        }
      } catch (err) {
        setStatus('error');
        setMessage('网络请求失败，请稍后重试');
      }
    };

    acceptShare();
  }, [token, router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Head>
        <title>接收分享文档 - MarkFlow</title>
      </Head>
      
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          backgroundColor: status === 'loading' ? '#e0e7ff' : status === 'success' ? '#dcfce3' : '#fee2e2',
          color: status === 'loading' ? '#4f46e5' : status === 'success' ? '#16a34a' : '#ef4444'
        }}>
          {status === 'loading' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
          ) : status === 'success' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          )}
        </div>
        <h2 style={{ margin: '0 0 10px', color: '#1e293b', fontSize: '20px' }}>
          {status === 'loading' ? '正在加载' : status === 'success' ? '接收成功' : '接收失败'}
        </h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
          {message}
        </p>
        
        {status === 'error' && (
          <button 
            onClick={() => router.push('/')}
            style={{
              marginTop: '24px',
              padding: '8px 16px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            返回首页
          </button>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
