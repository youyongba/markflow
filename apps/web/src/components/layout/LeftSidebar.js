import React from 'react';
import { 
  Folder, GitGraph, Search, Tags, Settings, ChevronDown, ChevronRight, 
  FileText, Plus, Book, AlignLeft 
} from 'lucide-react';
import styles from '../../pages/index.module.css';

export const LeftSidebar = () => {
  return (
    <div className={styles.leftSidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logoArea}>
          <div style={{ width: 24, height: 24, backgroundColor: '#4f46e5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <span style={{ fontSize: 14, fontWeight: 'bold' }}>M</span>
          </div>
          MarkFlow
        </div>
        <AlignLeft size={18} color="#64748b" style={{ cursor: 'pointer' }} />
      </div>

      <div className={styles.sidebarSection}>
        <div className={styles.sidebarTitle}>
          <span>文档空间</span>
          <ChevronDown size={14} />
        </div>
        <div className={`${styles.navItem} ${styles.active}`}>
          <Folder size={16} /> 文档库 (Files) <span className={styles.navBadge}>24</span>
        </div>
        <div className={styles.navItem}>
          <GitGraph size={16} /> 关系图谱 (Graph)
        </div>
        <div className={styles.navItem}>
          <Search size={16} /> 全局搜索 (Search)
        </div>
        <div className={styles.navItem}>
          <Tags size={16} /> 知识标签 (Tags) <span className={styles.navBadge}>12</span>
        </div>
        <div className={styles.navItem}>
          <Settings size={16} /> 系统设置 (Settings)
        </div>
      </div>

      <div className={styles.sidebarSection} style={{ flex: 1, overflow: 'auto' }}>
        <div className={styles.sidebarTitle}>
          <span>目录树结构</span>
          <Plus size={14} />
        </div>
        <div className={styles.treeNode}>
          <ChevronDown size={14} /> 架构设计 (Architecture)
        </div>
        <div className={`${styles.treeNode} ${styles.level1}`} style={{ backgroundColor: '#e2e8f0' }}>
          <FileText size={14} color="#3b82f6" /> ADR-004-存储选型.md
          <span className={`${styles.statusBadge} ${styles.review}`}>评审中</span>
        </div>
        <div className={`${styles.treeNode} ${styles.level1}`}>
          <FileText size={14} /> 系统拓扑与容灾方案.md
          <span className={`${styles.statusBadge} ${styles.final}`}>定稿</span>
        </div>
        
        <div className={styles.treeNode}>
          <ChevronDown size={14} /> API 规范 (Specifications)
        </div>
        <div className={`${styles.treeNode} ${styles.level1}`}>
          <FileText size={14} /> v2.4-REST-接口文档.md
          <span className={`${styles.statusBadge} ${styles.final}`}>定稿</span>
        </div>
        <div className={`${styles.treeNode} ${styles.level1}`}>
          <FileText size={14} /> WebSocket-事件订阅.md
          <span className={styles.statusBadge}>草稿</span>
        </div>

        <div className={styles.treeNode}>
          <ChevronRight size={14} /> 运维手册 (DevOps)
        </div>
      </div>

      <div className={styles.sidebarSection} style={{ borderTop: '1px solid #e2e8f0' }}>
        <div className={styles.sidebarTitle}>
          <span>常驻书签 (BOOKMARKS)</span>
          <Book size={14} />
        </div>
        <div className={styles.treeNode}>
          <span style={{ color: '#f59e0b' }}>★</span> 快速指引: 研发规范.md
        </div>
      </div>
    </div>
  );
};
