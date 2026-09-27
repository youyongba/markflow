import React from 'react';
import Head from 'next/head';

export default function About() {
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <Head>
        <title>关于我们</title>
      </Head>
      
      <h1>ℹ️ 关于我们 (About)</h1>
      <p>这是一个静态页面，没有任何外部数据依赖，将在构建时预渲染为 HTML。</p>
      
      <div style={{ marginTop: 30 }}>
        <a href="/home" style={{ color: 'blue' }}>← 返回首页</a>
      </div>
    </div>
  );
}
