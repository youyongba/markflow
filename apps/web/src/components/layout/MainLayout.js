import React from 'react';
import Head from 'next/head';
import styles from '../../pages/index.module.css';
import { LeftSidebar } from './LeftSidebar';
import { TopHeader } from './TopHeader';
import { EditorArea } from './EditorArea';
import { RightSidebar } from './RightSidebar';
import { useSelector } from 'react-redux';

export const MainLayout = () => {
  const { isLeftSidebarOpen, isRightSidebarOpen } = useSelector(state => state.layout);

  return (
    <div className={styles.layout}>
      <Head>
        <title>MarkFlow - Engineering Wiki</title>
      </Head>

      {/* Left Sidebar */}
      {isLeftSidebarOpen && <LeftSidebar />}

      {/* Main Area */}
      <div className={styles.mainArea}>
        <TopHeader />
        <EditorArea />
      </div>

      {/* Right Sidebar */}
      {isRightSidebarOpen && <RightSidebar />}
    </div>
  );
};
