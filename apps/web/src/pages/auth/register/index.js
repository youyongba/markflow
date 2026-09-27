import React, { useState } from 'react';
import Head from 'next/head';

export default function Register() {
  const [loading, setLoading] = useState(false);

  const handleRegister = (e) => {
    e.preventDefault();
    setLoading(true);
    // 模拟注册请求
    setTimeout(() => {
      setLoading(false);
      alert('注册成功，请登录（模拟）');
      window.location.href = '/auth/login';
    }, 1000);
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto' }}>
      <Head>
        <title>用户注册</title>
      </Head>
      
      <h2>📝 用户注册</h2>
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 5 }}>账号:</label>
          <input type="text" placeholder="请输入想要注册的账号" required style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 5 }}>密码:</label>
          <input type="password" placeholder="请输入密码" required style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 5 }}>确认密码:</label>
          <input type="password" placeholder="请再次输入密码" required style={{ width: '100%', padding: 8 }} />
        </div>
        
        <button type="submit" disabled={loading} style={{ padding: 10, backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <a href="/auth/login" style={{ color: 'blue', fontSize: 14 }}>已有账号？去登录</a>
        <br />
        <br />
        <a href="/home" style={{ color: 'gray', fontSize: 14 }}>返回首页</a>
      </div>
    </div>
  );
}
