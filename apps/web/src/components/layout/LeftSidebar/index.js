import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Folder, GitGraph, Search, Tags, Settings, ChevronDown, ChevronRight, 
  FileText, Plus, AlignLeft 
} from 'lucide-react';
import styles from '../../../pages/index.module.css';
import { 
  setActiveNavItem, toggleNodeExpansion, toggleLeftSidebar, 
  setPreferences, setTreeNodes, addTreeNodes, setBookmarks 
} from '../../../store/slices/layoutSlice';
import * as api from '../../../services/api/sidebar';

export const LeftSidebar = () => {
  const dispatch = useDispatch();
  const { activeNavItem, expandedNodes, treeNodes, bookmarks, filesCount, tagsCount } = useSelector((state) => state.layout);
  
  const isExpanded = (nodeId) => expandedNodes.includes(nodeId);

  // 初始化拉取
  useEffect(() => {
    api.fetchPreferences().then(res => {
      if (res.code === 200 && res.data) dispatch(setPreferences(res.data));
    }).catch(err => console.error('Failed to fetch preferences', err));
    
    api.fetchTreeNodes().then(res => {
      if (res.code === 200 && res.data) dispatch(setTreeNodes(res.data));
    }).catch(err => console.error('Failed to fetch tree nodes', err));

    api.fetchBookmarks().then(res => {
      if (res.code === 200 && res.data) dispatch(setBookmarks(res.data));
    }).catch(err => console.error('Failed to fetch bookmarks', err));
  }, [dispatch]);

  // 展开/折叠处理，并增量同步
  const handleToggleNode = useCallback(async (nodeId, hasChildren) => {
    dispatch(toggleNodeExpansion(nodeId));
    
    // 计算更新后的状态
    const newExpanded = expandedNodes.includes(nodeId) 
      ? expandedNodes.filter(id => id !== nodeId)
      : [...expandedNodes, nodeId];
      
    // 懒加载子节点
    if (!expandedNodes.includes(nodeId) && hasChildren) {
      const isLoaded = treeNodes.some(n => n.parentId === nodeId);
      if (!isLoaded) {
        try {
          const res = await api.fetchTreeNodes(nodeId);
          if (res.code === 200 && res.data) dispatch(addTreeNodes(res.data));
        } catch (err) {
          console.error('Failed to fetch child nodes', err);
        }
      }
    }
    
    api.updatePreferences({ expandedNodes: newExpanded }).catch(err => console.error('Failed to update preferences', err));
  }, [dispatch, expandedNodes, treeNodes]);

  // 导航切换并增量同步
  const handleNavClick = (navId) => {
    dispatch(setActiveNavItem(navId));
    api.updatePreferences({ activeNavItem: navId }).catch(err => console.error('Failed to update preferences', err));
  };

  // 递归渲染树节点
  const renderTree = (parentId = null, level = 0) => {
    const nodes = treeNodes.filter(n => n.parentId === parentId);
    return nodes.map(node => (
      <React.Fragment key={node.id}>
        <div 
          className={`${styles.treeNode} ${level > 0 ? styles.level1 : ''}`} 
          style={{ paddingLeft: level > 0 ? `${level * 12 + 12}px` : undefined }}
          onClick={() => node.type === 'folder' ? handleToggleNode(node.id, node.hasChildren) : null}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded(node.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />} 
              {node.title}
            </>
          ) : (
            <>
              <FileText size={14} color={node.status === 'review' ? '#3b82f6' : undefined} /> 
              {node.title}
              {node.status && (
                <span className={`${styles.statusBadge} ${styles[node.status] || ''}`}>
                  {node.status === 'review' ? '评审中' : node.status === 'final' ? '定稿' : '草稿'}
                </span>
              )}
            </>
          )}
        </div>
        {node.type === 'folder' && isExpanded(node.id) && renderTree(node.id, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div className={styles.leftSidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logoArea}>
          <div style={{ width: 24, height: 24, backgroundColor: '#4f46e5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <span style={{ fontSize: 14, fontWeight: 'bold' }}>M</span>
          </div>
          MarkFlow
        </div>
        <AlignLeft size={18} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => dispatch(toggleLeftSidebar())} />
      </div>

      <div className={styles.sidebarSection}>
        <div className={styles.sidebarTitle} onClick={() => handleToggleNode('doc-space', false)} style={{ cursor: 'pointer' }}>
          <span>文档空间</span>
          {isExpanded('doc-space') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
        {isExpanded('doc-space') && (
          <>
            <div 
              className={`${styles.navItem} ${activeNavItem === 'files' ? styles.active : ''}`}
              onClick={() => handleNavClick('files')}
            >
              <Folder size={16} /> 文档库 (Files) {filesCount > 0 && <span className={styles.navBadge}>{filesCount}</span>}
            </div>
            <div 
              className={`${styles.navItem} ${activeNavItem === 'graph' ? styles.active : ''}`}
              onClick={() => handleNavClick('graph')}
            >
              <GitGraph size={16} /> 关系图谱 (Graph)
            </div>
            <div 
              className={`${styles.navItem} ${activeNavItem === 'search' ? styles.active : ''}`}
              onClick={() => handleNavClick('search')}
            >
              <Search size={16} /> 全局搜索 (Search)
            </div>
            <div 
              className={`${styles.navItem} ${activeNavItem === 'tags' ? styles.active : ''}`}
              onClick={() => handleNavClick('tags')}
            >
              <Tags size={16} /> 知识标签 (Tags) {tagsCount > 0 && <span className={styles.navBadge}>{tagsCount}</span>}
            </div>
            <div 
              className={`${styles.navItem} ${activeNavItem === 'settings' ? styles.active : ''}`}
              onClick={() => handleNavClick('settings')}
            >
              <Settings size={16} /> 系统设置 (Settings)
            </div>
          </>
        )}
      </div>

      <div className={styles.sidebarSection} style={{ flex: 1, overflow: 'auto' }}>
        <div className={styles.sidebarTitle}>
          <span>目录树结构</span>
          <Plus size={14} />
        </div>
        
        {renderTree(null, 0)}
      </div>

      <div className={styles.sidebarSection} style={{ borderTop: '1px solid #e2e8f0' }}>
        <div className={styles.sidebarTitle} onClick={() => handleToggleNode('bookmarks', false)} style={{ cursor: 'pointer' }}>
          <span>常驻书签 (BOOKMARKS)</span>
          {isExpanded('bookmarks') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
        {isExpanded('bookmarks') && bookmarks.map(bookmark => (
          <div className={styles.treeNode} key={bookmark.id}>
            <span style={{ color: bookmark.iconColor || '#f59e0b' }}>★</span> {bookmark.title}
          </div>
        ))}
      </div>
    </div>
  );
};
