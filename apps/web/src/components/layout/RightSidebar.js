import React, { useState, useEffect } from 'react';
import { AlignLeft, ChevronDown, X, Link as LinkIcon, File, Clock } from 'lucide-react';
import styles from '../../pages/index.module.css';
import { useSelector, useDispatch } from 'react-redux';
import { updateDocumentTitle, updateDocumentStatus, removeDocumentTag, addDocumentTag, setActiveDocument } from '../../store/slices/layoutSlice';
import * as api from '../../services/api/right-sidebar';

export const RightSidebar = () => {
  const dispatch = useDispatch();
  const { activeDocument } = useSelector(state => state.layout);
  const currentDocId = 'doc_current'; // 假设当前正在编辑的文档 ID

  // 从接口动态拉取的状态
  const [dependencies, setDependencies] = useState([]);
  const [commits, setCommits] = useState([]);

  // 初始化数据拉取
  useEffect(() => {
    // 1. 拉取文档基础属性 (Frontmatter)
    api.fetchDocProperties(currentDocId).then(res => {
      if (res.code === 200 && res.data) {
        dispatch(setActiveDocument(res.data));
      }
    }).catch(err => console.error('Failed to fetch doc properties', err));

    // 2. 拉取关联文档
    api.fetchDependencies(currentDocId).then(res => {
      if (res.code === 200 && res.data) {
        setDependencies(res.data);
      }
    }).catch(err => console.error('Failed to fetch dependencies', err));

    // 3. 拉取 Git 提交记录
    api.fetchCommits(currentDocId).then(res => {
      if (res.code === 200 && res.data) {
        setCommits(res.data);
      }
    }).catch(err => console.error('Failed to fetch commits', err));
  }, [dispatch]);

  // 新增标签和依赖的交互状态
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const [isAddingDep, setIsAddingDep] = useState(false);
  const [newDep, setNewDep] = useState('');

  // 展开更多 Git 日志状态
  const [isCommitsExpanded, setIsCommitsExpanded] = useState(false);

  // 模拟应用属性保存状态
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('已同源同步至前端 YAML');

  const handleAddTag = () => {
    if (newTag.trim()) {
      dispatch(addDocumentTag(newTag.trim()));
    }
    setNewTag('');
    setIsAddingTag(false);
  };

  const handleRemoveDep = (id) => {
    setDependencies(prev => prev.filter(dep => dep.id !== id));
  };

  const handleAddDep = () => {
    if (newDep.trim()) {
      const newId = `doc_new_${Math.random().toString(36).substr(2, 6)}`;
      let title = newDep.trim();
      if (!title.toLowerCase().endsWith('.md')) title += '.md';
      setDependencies(prev => [...prev, { id: newId, title }]);
    }
    setNewDep('');
    setIsAddingDep(false);
  };

  const handleApplyChanges = async () => {
    setIsSaving(true);
    setSaveMessage('正在写入 YAML 头...');
    
    try {
      // 提交到后端 PATCH 接口
      const payload = {
        title: activeDocument.title,
        status: activeDocument.status,
        tags: activeDocument.tags
      };
      const res = await api.updateDocProperties(currentDocId, payload);
      
      if (res.code === 200) {
        setSaveMessage('✅ ' + (res.message || '属性已成功保存至文档'));
      } else {
        setSaveMessage('❌ 保存失败');
      }
    } catch (err) {
      console.error('Update properties failed', err);
      setSaveMessage('❌ 网络请求失败');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage('已同源同步至前端 YAML'), 3000);
    }
  };

  // 决定显示的提交记录数量
  const visibleCommits = isCommitsExpanded ? commits : commits.slice(0, 1);

  return (
    <div className={styles.rightSidebar}>
      <div className={styles.rightSidebarHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlignLeft size={16} /> 文档属性
        </div>
        <div style={{ backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>YAML</div>
      </div>

      <div className={styles.propertyGroup}>
        <div className={styles.propertyLabel}>文档标题 (TITLE)</div>
        <input 
          type="text" 
          className={styles.propertyInput} 
          value={activeDocument.title}
          onChange={(e) => dispatch(updateDocumentTitle(e.target.value))} 
        />
      </div>

      <div className={styles.propertyGroup}>
        <div className={styles.propertyLabel}>评审状态 (STATUS)</div>
        <div className={styles.propertySelect} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: activeDocument.status === 'Final' ? '#10b981' : activeDocument.status === 'Draft' ? '#94a3b8' : '#f59e0b', position: 'absolute', left: 12 }}></div>
          <select 
            value={activeDocument.status}
            onChange={(e) => dispatch(updateDocumentStatus(e.target.value))}
            style={{ width: '100%', appearance: 'none', border: 'none', backgroundColor: 'transparent', padding: '8px 24px 8px 28px', fontSize: 13, color: '#334155', outline: 'none', cursor: 'pointer' }}
          >
            <option value="Draft">草稿 (Draft)</option>
            <option value="In-Review">评审中 (In-Review)</option>
            <option value="Final">定稿 (Final)</option>
          </select>
          <ChevronDown size={14} color="#94a3b8" style={{ position: 'absolute', right: 12, pointerEvents: 'none' }} />
        </div>
      </div>

      <div className={styles.propertyGroup}>
        <div className={styles.propertyLabel}>标签 (TAGS)</div>
        <div className={styles.tagsContainer}>
          {activeDocument.tags.map((tag) => (
            <div key={tag} className={styles.tag}>
              #{tag} 
              <X 
                size={12} 
                className={styles.tagClose} 
                onClick={() => dispatch(removeDocumentTag(tag))}
              />
            </div>
          ))}
          {isAddingTag ? (
            <input 
              autoFocus
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onBlur={handleAddTag}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="输入标签..."
              style={{ padding: '2px 8px', fontSize: 12, borderRadius: 12, border: '1px solid #3b82f6', outline: 'none', width: 80 }}
            />
          ) : (
            <div className={styles.addTag} onClick={() => setIsAddingTag(true)}>+ 添加标签</div>
          )}
        </div>
      </div>

      <div className={styles.propertyGroup}>
        <div className={styles.propertyLabel} style={{ display: 'flex', justifyContent: 'space-between' }}>
          关联前置文档 (DEPENDS_ON) <LinkIcon size={12} />
        </div>
        {dependencies.map(dep => (
          <div key={dep.id} className={styles.docLink}>
            <div className={styles.docLinkIcon}><File size={14} /> {dep.title}</div>
            <X size={14} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => handleRemoveDep(dep.id)} />
          </div>
        ))}
        {isAddingDep ? (
          <input 
            autoFocus
            type="text"
            placeholder="输入关联文档名称并回车..."
            value={newDep}
            onChange={(e) => setNewDep(e.target.value)}
            onBlur={handleAddDep}
            onKeyDown={(e) => e.key === 'Enter' && handleAddDep()}
            style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #3b82f6', outline: 'none', width: '100%', marginTop: 8 }}
          />
        ) : (
          <div style={{ fontSize: 12, color: '#3b82f6', cursor: 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setIsAddingDep(true)}>
            + 添加关联文档
          </div>
        )}
      </div>

      <div className={styles.propertyGroup} style={{ borderBottom: 'none', flex: 1 }}>
        <div className={styles.propertyLabel} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          GIT 版本归档日志 <Clock size={12} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visibleCommits.map(commit => (
            <div key={commit.hash} className={styles.historyItem}>
              <div className={styles.historyHeader}>
                <span className={styles.historyCommit}>commit {commit.hash}</span>
                <span style={{ fontSize: 12 }}>{commit.timeAgo}</span>
              </div>
              <div className={styles.historyDesc}>{commit.message}</div>
              <div className={styles.historyUser} style={{ marginTop: 4 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: commit.author.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>{commit.author.initials}</div>
                {commit.author.name}
              </div>
            </div>
          ))}
        </div>
        {commits.length > 1 && (
          <div 
            onClick={() => setIsCommitsExpanded(!isCommitsExpanded)}
            style={{ textAlign: 'center', fontSize: 12, color: '#3b82f6', marginTop: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            {isCommitsExpanded ? '收起历史记录' : `查看全部 ${commits.length} 条记录`}
            <ChevronDown size={14} style={{ transform: isCommitsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        )}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748b' }}>
        <span style={{ color: saveMessage.includes('✅') ? '#10b981' : '#64748b', transition: 'color 0.3s' }}>
          {saveMessage}
        </span>
        <button 
          onClick={handleApplyChanges}
          disabled={isSaving}
          style={{ 
            backgroundColor: isSaving ? '#94a3b8' : '#1e40af', 
            color: 'white', 
            padding: '6px 12px', 
            borderRadius: 4, 
            cursor: isSaving ? 'not-allowed' : 'pointer',
            border: 'none',
            fontSize: 12,
            fontWeight: 500,
            transition: 'background-color 0.2s'
          }}
        >
          {isSaving ? '保存中...' : '应用属性变更'}
        </button>
      </div>

    </div>
  );
};
