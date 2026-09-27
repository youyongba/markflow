import React, { useEffect } from 'react';
import Head from 'next/head';
import { BUSINESS_NAME } from 'shared-constants';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setHomeData } from '../../store/actions/home';

export default function Home({ serverTime }) {
  const dispatch = useAppDispatch();
  const { message, visitCount } = useAppSelector((state) => state.home);

  useEffect(() => {
    // 模拟挂载时触发 Redux Action
    dispatch(setHomeData({ visitCount: visitCount + 1 }));
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <Head>
        <title>首页 - {BUSINESS_NAME}</title>
      </Head>
      
      <h1>🏠 首页 (Home)</h1>
      <p>欢迎来到 {BUSINESS_NAME} 的主页。</p>
      
      <div style={{ marginTop: 20, padding: 15, backgroundColor: '#e6f7ff', borderRadius: 8 }}>
        <strong>来自 Redux Store 的状态：</strong>
        <p>Message: {message}</p>
        <p>页面访问次数(Redux): {visitCount}</p>
      </div>
      
      <div style={{ marginTop: 20, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
        <strong>来自 SSG (getStaticProps) 的数据：</strong>
        <p>服务器生成时间：{serverTime}</p>
      </div>

      <nav style={{ marginTop: 30, display: 'flex', gap: '15px' }}>
        <a href="/about" style={{ color: 'blue' }}>关于我们</a>
        <a href="/auth/login" style={{ color: 'blue' }}>登录</a>
        <a href="/dashboard" style={{ color: 'blue' }}>控制台</a>
      </nav>
    </div>
  );
}

// 模拟 SSG
export async function getStaticProps() {
  return {
    props: {
      serverTime: new Date().toLocaleString(),
    },
    revalidate: 60 // ISR: 每 60 秒重新生成一次
  };
}
