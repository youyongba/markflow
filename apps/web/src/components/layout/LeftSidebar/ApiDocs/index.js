import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import styles from '../../../../pages/index.module.css';
import { toggleNodeExpansion } from '../../../../store/slices/layoutSlice';

export const ApiDocs = () => {
  const dispatch = useDispatch();
  const { expandedNodes } = useSelector((state) => state.layout);
  
  const isExpanded = (nodeId) => expandedNodes.includes(nodeId);

  return (
    <>
      <div className={styles.treeNode} onClick={() => dispatch(toggleNodeExpansion('api-specs'))}>
        {isExpanded('api-specs') ? <ChevronDown size={14} /> : <ChevronRight size={14} />} API 规范 (Specifications)
      </div>
      {isExpanded('api-specs') && (
        <>
          <div className={`${styles.treeNode} ${styles.level1}`}>
            <FileText size={14} /> v2.4-REST-接口文档.md
            <span className={`${styles.statusBadge} ${styles.final}`}>定稿</span>
          </div>
          <div className={`${styles.treeNode} ${styles.level1}`}>
            <FileText size={14} /> WebSocket-事件订阅.md
            <span className={styles.statusBadge}>草稿</span>
          </div>
        </>
      )}
    </>
  );
};
