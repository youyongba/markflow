import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCcw
} from 'lucide-react';
import styles from './reset.module.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logoutOther, setLogoutOther] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [strength, setStrength] = useState({ score: 0, text: '', color: '' });
  const [isMatched, setIsMatched] = useState(false);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, text: '', color: '#e2e8f0' });
      return;
    }
    
    let score = 0;
    if (password.length > 7) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) setStrength({ score: 1, text: '极弱', color: '#ef4444' });
    else if (score === 2) setStrength({ score: 2, text: '一般', color: '#f59e0b' });
    else if (score === 3) setStrength({ score: 3, text: '良好', color: '#10b981' });
    else setStrength({ score: 4, text: '极佳', color: '#059669' });
  }, [password]);

  // Check if passwords match
  useEffect(() => {
    if (confirmPassword && password === confirmPassword) {
      setIsMatched(true);
    } else {
      setIsMatched(false);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMatched || strength.score < 2) {
      setError('请检查密码强度或是否一致');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 模拟加密传输 (与登录一致，实际应使用 RSA 公钥加密)
      const mockEncryptedPassword = btoa(unescape(encodeURIComponent(password)));
      // 假设页面 URL 中自带了 token (例如: ?token=xyz)
      const urlParams = new URLSearchParams(window.location.search);
      const resetToken = urlParams.get('token') || 'mock-token-123';

      const res = await fetch('https://mock.24os.cn/b5899d0d-a777-4b5f-a4e4-e73dcb2fca19/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resetToken,
          newPassword: mockEncryptedPassword,
          logoutOther
        })
      });

      const data = await res.json();

      if (data.code === 200) {
        alert('密码重置成功，正在跳转登录...');
        window.location.href = '/auth/login';
      } else {
        setError(data.message || '重置失败，请稍后重试');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('网络请求失败，请检查您的网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>重设密码 - MarkFlow</title>
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
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <RefreshCcw size={24} />
          </div>
          
          <h1 className={styles.title}>重设密码</h1>
          <p className={styles.subtitle}>
            请输入您的新密码并确认以完成更新。
          </p>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>新密码</label>
                {password && (
                  <span className={styles.labelRight} style={{ color: strength.color }}>
                    密码强度：{strength.text}
                  </span>
                )}
              </div>
              <div className={styles.inputWrapper}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className={styles.input} 
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <div className={styles.inputRightIcon} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </div>
              </div>
              
              <div className={styles.strengthMeter}>
                {[1, 2, 3, 4].map(level => (
                  <div 
                    key={level} 
                    className={styles.strengthBar}
                    style={{ backgroundColor: strength.score >= level ? strength.color : '#e2e8f0' }}
                  />
                ))}
              </div>
              <div className={styles.helperText}>至少包含 8 个字符，建议混合字母、数字和符号</div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>确认新密码</label>
                {isMatched && (
                  <span className={styles.labelRight} style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> 密码匹配
                  </span>
                )}
              </div>
              <div className={styles.inputWrapper}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className={styles.input} 
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                {isMatched && (
                  <div className={`${styles.inputRightIcon} ${styles.success}`}>
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>
            </div>

            <label className={styles.checkboxRow}>
              <input 
                type="checkbox" 
                className={styles.checkbox}
                checked={logoutOther}
                onChange={e => setLogoutOther(e.target.checked)}
              />
              <span className={styles.checkboxLabel}>登出其他所有已登录设备</span>
            </label>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={loading || !isMatched || strength.score < 2}
            >
              {loading ? '更新中...' : '重置密码并登录'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <a href="/auth/login" className={styles.backLink}>
            <ArrowLeft size={16} /> 返回登录
          </a>
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
