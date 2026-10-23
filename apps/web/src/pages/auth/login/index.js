import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  ArrowRight,
  Terminal
} from 'lucide-react';
import { useAppDispatch } from '../../../store/hooks';
import { setAuthUser } from '../../../store/actions/auth/login';
import styles from './login.module.css';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. 获取公钥 (模拟非对称加密流程)
      const pkRes = await fetch('/v2.4/auth/public-key');
      const pkData = await pkRes.json();
      
      // 2. 将用户名和密码作为一个整体 Payload 进行加密
      // 注: 实际项目中这里应使用 JSEncrypt 等库结合 pkData.data.publicKey 进行 RSA 加密
      // 这里使用 Base64 模拟加密后的密文进行传输
      const payloadObj = { email, password };
      const mockEncryptedPayload = btoa(unescape(encodeURIComponent(JSON.stringify(payloadObj))));

      // 3. 发送登录请求
      const loginRes = await fetch('/v2.4/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payload: mockEncryptedPayload
        })
      });

      const loginData = await loginRes.json();

      if (loginData.code === 200 && loginData.data) {
        // 保存 Token 到本地
        localStorage.setItem('token', loginData.data.token);
        
        // 触发 Redux action，保存用户态
        dispatch(setAuthUser({ 
          id: loginData.data.user.id, 
          name: loginData.data.user.name, 
          email: loginData.data.user.email,
          role: loginData.data.user.role,
          avatarUrl: loginData.data.user.avatarUrl
        }));
        
        // 跳转到首页或重定向地址
        const { redirect } = router.query;
        if (redirect) {
          window.location.href = redirect;
        } else {
          window.location.href = '/';
        }
      } else {
        setError(loginData.message || '邮箱或访问凭据错误，请重试');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('网络请求失败，请检查您的网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>欢迎登录 MarkFlow - 工程文档系统</title>
      </Head>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '4px', borderRadius: '4px', marginRight: '8px' }}>
            <Zap size={16} fill="white" />
          </div>
          MarkFlow
          <span className={styles.versionBadge} style={{ marginLeft: '8px' }}>V2.4-CORE</span>
        </div>
        <div className={styles.navRight}>
          <Terminal size={16} />
          <span>CLI Documentation</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.contentWrapper}>
          
          {/* Left Column */}
          <div className={styles.leftCol}>
            <div className={styles.brandSubtitle}>Brand Documentation as Code</div>
            <h1 className={styles.brandTitle}>MarkFlow</h1>
            <h2 className={styles.heroText}>文件优先 · 本地主权 · 现代工程文档系统</h2>
            <p className={styles.heroDesc}>
              专为研发架构师与工程团队设计的无锁死 Markdown 协作基座，兼顾纯粹本地私密性与双向链接拓扑。
            </p>

            <div className={styles.statBox} style={{ marginTop: '48px' }}>
              <div className={styles.statAvatars}>
                <div className={styles.statAvatar} style={{ backgroundColor: '#1e3a8a', zIndex: 3 }}>RD</div>
                <div className={styles.statAvatar} style={{ backgroundColor: '#4338ca', zIndex: 2 }}>QA</div>
                <div className={styles.statAvatar} style={{ backgroundColor: '#0f172a', zIndex: 1 }}>PM</div>
              </div>
              <div className={styles.statText}>
                轻量级的研发团队文档基座
                <div className={styles.statSub}>支持微服务架构设计、API 治理与日常技术沉淀</div>
              </div>
            </div>

            <div className={styles.networkStatus}>
              <div className={styles.statusDot}></div>
              <span>系统服务运转正常</span>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.rightCol}>
            <div className={styles.loginCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>欢迎登录 MarkFlow</h3>
                <span className={styles.cardVersion}>v2.4.1-STABLE</span>
              </div>
              <p className={styles.cardSub}>输入您的工作邮箱与访问凭据以进行身份验证</p>

              <form onSubmit={handleLogin}>
                <div className={styles.formGroup}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>工作邮箱 (Work Email)</label>
                    <span className={styles.labelRight}>需具备组织读写权</span>
                  </div>
                  <div className={styles.inputWrapper}>
                    <Mail className={styles.inputIcon} size={16} />
                    <input 
                      type="email" 
                      className={styles.input} 
                      placeholder="developer@company.internal"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>访问凭据 (Password / PAT)</label>
                    <span 
                      className={styles.labelRight} 
                      style={{ color: '#3b82f6', cursor: 'pointer' }}
                      onClick={() => window.location.href = '/auth/forgot-password'}
                    >
                      忘记密码？
                    </span>
                  </div>
                  <div className={styles.inputWrapper}>
                    <Lock className={styles.inputIcon} size={16} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className={styles.input} 
                      placeholder="输入访问密钥或系统口令"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <div className={styles.inputRightIcon} onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </div>
                  </div>
                </div>

                {error && (
                  <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                    {error}
                  </div>
                )}

                <button type="submit" className={styles.submitBtn} disabled={loading} style={{ marginTop: '24px' }}>
                  {loading ? '身份验证中...' : '登录工作空间'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div>© 2025 MarkFlow Systems Inc. • Documentation-as-Code Engine</div>
        <div className={styles.footerRight}>
          <span>Security Protocol</span>
          <span>Architecture Status</span>
          <span>Zero-Telemetry Spec</span>
        </div>
      </footer>
    </div>
  );
}
