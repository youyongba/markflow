import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Folder, GitGraph, Search, Tags, Settings, ChevronDown, ChevronRight, 
  FileText, Plus, AlignLeft, Trash2, Edit2
} from 'lucide-react';
import styles from '../../../pages/index.module.css';
import { 
  setActiveNavItem, toggleNodeExpansion, toggleLeftSidebar, 
  setPreferences, setTreeNodes, addTreeNodes, setBookmarks,
  setActiveDocument
} from '../../../store/slices/layoutSlice';
import * as api from '../../../services/api/sidebar';

export const LeftSidebar = () => {
  const dispatch = useDispatch();
  const { activeNavItem, expandedNodes, treeNodes, bookmarks, filesCount, tagsCount, activeDocument } = useSelector((state) => state.layout);
  
  const isExpanded = (nodeId) => expandedNodes.includes(nodeId);

  // 初始化拉取
  useEffect(() => {
    // 并行拉取基础数据
    Promise.all([
      api.fetchPreferences(),
      api.fetchTreeNodes(),
      api.fetchBookmarks()
    ]).then(([prefRes, treeRes, bookmarkRes]) => {
      if (bookmarkRes.code === 200 && bookmarkRes.data) {
        dispatch(setBookmarks(bookmarkRes.data));
      }
      
      if (treeRes.code === 200 && treeRes.data) {
        dispatch(setTreeNodes(treeRes.data));
      }

      if (prefRes.code === 200 && prefRes.data) {
        dispatch(setPreferences(prefRes.data));
        
        // 自动拉取已被持久化为“展开”状态的目录子节点
        const expanded = prefRes.data.expandedNodes || [];
        expanded.forEach(nodeId => {
          // 排除静态的非数据库节点 ID (如 doc-space, bookmarks 等)
          const isDbNode = typeof nodeId === 'number' || (typeof nodeId === 'string' && /^[0-9]+$/.test(nodeId));
          if (isDbNode) {
            api.fetchTreeNodes(nodeId).then(childRes => {
              if (childRes.code === 200 && childRes.data) {
                dispatch(addTreeNodes(childRes.data));
              }
            }).catch(err => console.error('Failed to fetch child nodes for expanded folder', err));
          }
        });
      }
    }).catch(err => console.error('Failed to fetch initial data', err));
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

  // 新建根目录
  const handleCreateFolder = async (e, parentId = null) => {
    e.stopPropagation(); // 防止触发折叠/展开
    const folderName = window.prompt('请输入新建目录的名称：');
    if (!folderName || !folderName.trim()) return;

    try {
      const res = await api.createFolder({ title: folderName.trim(), parentId: parentId });
      if (res.code === 200 && res.data) {
        dispatch(addTreeNodes([res.data]));
        
        // 如果是在某个父节点下新建的，确保该父节点处于展开状态
        if (parentId && !expandedNodes.includes(parentId)) {
          dispatch(toggleNodeExpansion(parentId));
          api.updatePreferences({ expandedNodes: [...expandedNodes, parentId] }).catch(err => console.error('Failed to update preferences', err));
        }
      } else {
        alert(res.message || '创建目录失败');
      }
    } catch (err) {
      console.error('Failed to create folder', err);
      alert('网络请求失败');
    }
  };

  // 重命名目录
  const handleEditFolder = async (e, node) => {
    e.stopPropagation();
    const newName = window.prompt('请输入新的目录名称：', node.title);
    if (!newName || !newName.trim() || newName.trim() === node.title) return;

    try {
      const res = await api.updateFolder(node.id, { title: newName.trim() });
      if (res.code === 200) {
        // 更新本地 Redux 状态
        const updatedNodes = treeNodes.map(n => n.id === node.id ? { ...n, title: newName.trim() } : n);
        dispatch(setTreeNodes(updatedNodes));
      } else {
        alert(res.message || '重命名失败');
      }
    } catch (err) {
      console.error('Failed to rename folder', err);
      alert('网络请求失败');
    }
  };

  // 删除目录
  const handleDeleteFolder = async (e, nodeId) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除该目录及其所有子内容吗？此操作不可恢复。')) return;

    try {
      const res = await api.deleteFolder(nodeId);
      if (res.code === 200) {
        // 更新本地 Redux 状态：过滤掉被删除的节点及其子节点
        const updatedNodes = treeNodes.filter(n => n.id !== nodeId && n.parentId !== nodeId);
        dispatch(setTreeNodes(updatedNodes));
      } else {
        alert(res.message || '删除失败');
      }
    } catch (err) {
      console.error('Failed to delete folder', err);
      alert('网络请求失败');
    }
  };

  // 删除文档
  const handleDeleteDocument = async (e, nodeId) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除该文档吗？')) return;

    try {
      const res = await api.deleteDocument(nodeId);
      if (res.code === 200) {
        // 更新本地 Redux 状态：过滤掉被删除的文档节点
        const updatedNodes = treeNodes.filter(n => n.id !== nodeId);
        dispatch(setTreeNodes(updatedNodes));
      } else {
        alert(res.message || '删除失败');
      }
    } catch (err) {
      console.error('Failed to delete document', err);
      alert('网络请求失败');
    }
  };

  // 递归渲染树节点
  const renderTree = (parentId = null, level = 0) => {
    const nodes = treeNodes.filter(n => n.parentId === parentId);
    return nodes.map(node => (
      <React.Fragment key={node.id}>
        <div
          className={`${styles.treeNode} ${level > 0 ? styles.level1 : ''} ${styles.treeNodeHoverable} ${activeDocument?.id === node.id ? styles.active : ''}`}
          style={{ paddingLeft: level > 0 ? `${level * 12 + 12}px` : undefined, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '16px', userSelect: 'none' }}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Tree node clicked:', node);
            if (node.type === 'folder') {
              handleToggleNode(node.id, node.hasChildren);
            } else if (node.type === 'document') {
              dispatch(setActiveDocument({
                id: node.id,
                title: node.title,
                status: node.status || 'draft',
              }));
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {node.type === 'folder' ? (
              <>
                {isExpanded(node.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />} 
                {node.title}
              </>
            ) : (
              <>
                <FileText size={14} color={node.status === 'review' ? '#3b82f6' : undefined} /> 
                {node.title}
              </>
            )}
          </div>
          
          {/* 右侧动作区 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {node.type === 'folder' && (
              <div className={styles.actionIconGroup} style={{ display: 'flex', gap: '4px' }}>
                <Plus 
                  size={14} 
                  style={{ color: '#94a3b8', cursor: 'pointer' }}
                  onClick={(e) => handleCreateFolder(e, node.id)} 
                  title="在此目录下新建文件夹"
                />
                <Edit2 
                  size={14} 
                  style={{ color: '#94a3b8', cursor: 'pointer' }}
                  onClick={(e) => handleEditFolder(e, node)} 
                  title="重命名目录"
                />
                <Trash2 
                  size={14} 
                  style={{ color: '#ef4444', cursor: 'pointer' }}
                  onClick={(e) => handleDeleteFolder(e, node.id)} 
                  title="删除目录"
                />
              </div>
            )}
            {node.type === 'document' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className={styles.actionIconGroup} style={{ display: 'flex', gap: '4px' }}>
                  <Trash2 
                    size={14} 
                    style={{ color: '#ef4444', cursor: 'pointer' }}
                    onClick={(e) => handleDeleteDocument(e, node.id)} 
                    title="删除文档"
                  />
                </div>
                {node.status && (
                  <span className={`${styles.statusBadge} ${styles[node.status] || ''}`}>
                    {node.status === 'review' ? '评审中' : node.status === 'final' ? '定稿' : '草稿'}
                  </span>
                )}
              </div>
            )}
          </div>
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
          <Plus size={14} style={{ cursor: 'pointer', color: '#64748b' }} onClick={(e) => handleCreateFolder(e, null)} title="新建根目录" />
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
