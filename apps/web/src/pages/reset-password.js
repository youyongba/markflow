import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ResetPasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      // 提取 URL 上的 token 参数并重定向到真实的 auth 页面
      const { token } = router.query;
      if (token) {
        router.replace(`/auth/reset-password?token=${token}`);
      } else {
        router.replace('/auth/reset-password');
      }
    }
  }, [router.isReady, router.query, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#666' }}>
      正在跳转到重置密码页面...
    </div>
  );
}
