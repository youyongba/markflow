import React from 'react';
import { AlignLeft, ChevronDown, X, Link as LinkIcon, File, Clock } from 'lucide-react';
import styles from '../../pages/index.module.css';
import { useSelector, useDispatch } from 'react-redux';
import { updateDocumentTitle, updateDocumentStatus, removeDocumentTag } from '../../store/slices/layoutSlice';

export const RightSidebar = () => {
  const dispatch = useDispatch();
  const { activeDocument } = useSelector(state => state.layout);

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
        <div className={styles.propertySelect}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
          {activeDocument.status === 'In-Review' ? '评审中 (In-Review)' : activeDocument.status}
          <ChevronDown size={14} style={{ marginLeft: 'auto' }} />
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
          <div className={styles.addTag}>+ 添加标签</div>
        </div>
      </div>

      <div className={styles.propertyGroup}>
        <div className={styles.propertyLabel} style={{ display: 'flex', justifyContent: 'space-between' }}>
          关联前置文档 (DEPENDS_ON) <LinkIcon size={12} />
        </div>
        <div className={styles.docLink}>
          <div className={styles.docLinkIcon}><File size={14} /> ADR-001-架构总览.md</div>
          <X size={14} color="#94a3b8" style={{ cursor: 'pointer' }} />
        </div>
        <div className={styles.docLink}>
          <div className={styles.docLinkIcon}><File size={14} /> RFC-102-元数据同步.md</div>
          <X size={14} color="#94a3b8" style={{ cursor: 'pointer' }} />
        </div>
      </div>

      <div className={styles.propertyGroup} style={{ borderBottom: 'none', flex: 1 }}>
        <div className={styles.propertyLabel} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          GIT 版本归档日志 <Clock size={12} />
        </div>
        
        <div className={styles.historyItem}>
          <div className={styles.historyHeader}>
            <span className={styles.historyCommit}>commit 8f2b10a</span>
            <span style={{ fontSize: 12 }}>2 小时前</span>
          </div>
          <div className={styles.historyDesc}>docs(storage): 增补双可用区 Raft 一致性协议与专网容灾基线参数</div>
          <div className={styles.historyUser} style={{ marginTop: 4 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>AC</div>
            Alex Chen (陈希)
          </div>
        </div>
      </div>

      <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748b' }}>
        已同源同步至前端 YAML
        <div style={{ backgroundColor: '#1e40af', color: 'white', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>应用属性变更</div>
      </div>

    </div>
  );
};
