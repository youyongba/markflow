import React, { useState } from 'react';
import Head from 'next/head';
import { useAppDispatch } from '../../../store/hooks';
import { setAuthUser } from '../../../store/actions/auth/login';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const dispatch = useAppDispatch();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // 模拟登录请求
    setTimeout(() => {
      setLoading(false);
      
      // 触发 Redux action，保存用户态
      dispatch(setAuthUser({ id: 1, name: username, role: 'admin' }));
      
      alert('登录成功（模拟）');
      window.location.href = '/dashboard';
    }, 1000);
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto' }}>
      <Head>
        <title>用户登录</title>
      </Head>
      
      <h2>🔐 用户登录</h2>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 5 }}>账号:</label>
          <input 
            type="text" 
            placeholder="请输入账号" 
            required 
            style={{ width: '100%', padding: 8 }} 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 5 }}>密码:</label>
          <input type="password" placeholder="请输入密码" required style={{ width: '100%', padding: 8 }} />
        </div>
        
        <button type="submit" disabled={loading} style={{ padding: 10, backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <a href="/auth/register" style={{ color: 'blue', fontSize: 14 }}>没有账号？去注册</a>
        <br />
        <br />
        <a href="/home" style={{ color: 'gray', fontSize: 14 }}>返回首页</a>
      </div>
    </div>
  );
}
