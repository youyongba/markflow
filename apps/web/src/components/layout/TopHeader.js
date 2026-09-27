import React from 'react';
import { Folder, Search, Share, Plus, ChevronDown } from 'lucide-react';
import styles from '../../pages/index.module.css';

export const TopHeader = () => {
  return (
    <div className={styles.topHeader}>
      <div className={styles.breadcrumb}>
        <Folder size={16} color="#3b82f6" />
        <span>Engineering Wiki / main</span>
        <ChevronDown size={14} />
      </div>

      <div className={styles.searchBar}>
        <Search size={14} />
        <input type="text" placeholder="搜索文档、标签、代码片段..." />
        <span className={styles.searchShortcut}>⌘K</span>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.actionBtn}>
          <Share size={14} /> 分享
        </div>
        <div className={`${styles.actionBtn} ${styles.btnPrimary}`}>
          <Plus size={14} /> 新建文档
        </div>
        <div className={styles.avatar}>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" width="28" height="28" />
        </div>
      </div>
    </div>
  );
};
