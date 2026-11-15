import React from 'react';
import Head from 'next/head';
import styles from '../../pages/index.module.css';
import { LeftSidebar } from './LeftSidebar/index';
import { TopHeader } from './TopHeader';
import { EditorArea } from './EditorArea';
import { GraphArea } from './GraphArea';
import { RightSidebar } from './RightSidebar';
import { useSelector } from 'react-redux';

export const MainLayout = () => {
  const { isLeftSidebarOpen, isRightSidebarOpen, activeNavItem } = useSelector(state => state.layout);

  return (
    <div className={styles.layout}>
      <Head>
        <title>Markdown 工作台 - MarkFlow</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      {/* Left Sidebar */}
      {isLeftSidebarOpen && <LeftSidebar />}

      {/* Main Area */}
      <div className={styles.mainArea}>
        <TopHeader />
        {activeNavItem === 'graph' ? <GraphArea /> : <EditorArea />}
      </div>

      {/* Right Sidebar: 导航目录 + 文档属性 */}
      {isRightSidebarOpen && activeNavItem !== 'graph' && <RightSidebar />}
    </div>
  );
};
