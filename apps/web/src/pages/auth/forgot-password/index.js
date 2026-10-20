import React, { useState, useRef } from 'react';
import Head from 'next/head';
import { 
  Mail, 
  ShieldCheck, 
  ArrowLeft, 
  Info,
  Link as LinkIcon,
  CheckCircle2
} from 'lucide-react';
import styles from './forgot.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('https://mock.24os.cn/b5899d0d-a777-4b5f-a4e4-e73dcb2fca19/password/forgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.code === 200) {
        alert('重置链接已发送到您的邮箱，请注意查收！');
        window.location.href = '/auth/login';
      } else {
        setError(data.message || '发送失败，请稍后重试');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('网络请求失败，请检查您的网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>找回登录口令 - MarkFlow</title>
      </Head>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div style={{ backgroundColor: '#1e293b', color: 'white', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}>M</span>
          </div>
          MarkFlow
          <span className={styles.authBadge}>AUTH</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statusDot}></div>
          CORE SYS OK
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.cardWrapper}>
          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <Mail size={28} />
            </div>
            
            <div className={styles.badge}>
              <ShieldCheck size={14} color="#3b82f6" />
              SECURITY PROTOCOL V2.4
            </div>

            <h1 className={styles.title}>找回登录口令</h1>
            <p className={styles.subtitle}>
              输入您的注册工作邮箱，我们将发送重置验证凭据以恢复开发工作空间权限。
            </p>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label className={styles.label}>工作邮箱 (Work Email) <span style={{ color: '#ef4444' }}>*</span></label>
                  <span className={styles.labelRight}>LDAP / Cloud ID</span>
                </div>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={16} />
                  <input 
                      type="email" 
                      className={styles.input} 
                      placeholder="alex.chen@markflow.io"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '-12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                    {error}
                  </div>
                )}

                <button type="submit" className={styles.submitBtn} disabled={loading || !email}>
                  <ShieldCheck size={18} />
                  {loading ? '发送中...' : '发送重置链接'}
                </button>
              </form>

            <div className={styles.infoBox}>
              <Info className={styles.infoIcon} size={18} />
              <div className={styles.infoText}>
                重置安全凭据有效期为 <strong>15 分钟</strong>。若长时间未收悉，请检查垃圾箱或企业防火墙路由策略。
              </div>
            </div>

            <div className={styles.footerLinks}>
              <a href="/auth/login" className={styles.backLink}>
                <ArrowLeft size={16} /> 想起密码了？ <span>立即返回登录</span>
              </a>
              <div className={styles.ssoLink}>
                所属企业配置了 SSO / SAML？ <span>联系组织管理员</span>
              </div>
            </div>
          </div>
          
          {/* Node Bar below card */}
          <div className={styles.nodeBar}>
            <div className={styles.nodeLeft}>
              <div className={styles.nodeDot}></div>
              AUTH_NODE: sha256::tls1.3
            </div>
            <div>ID: 0x9AF4•••2B</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <ShieldCheck size={14} color="#64748b" />
          256-bit Hardware Keystore Protected
        </div>
        <div className={styles.footerRight}>
          <span>System: v2.4.1-rc</span>
          <span>•</span>
          <span>Security Policy</span>
          <span>•</span>
          <span>Help Center</span>
        </div>
      </footer>
    </div>
  );
}
