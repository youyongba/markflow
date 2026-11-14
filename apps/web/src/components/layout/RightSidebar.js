import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlignLeft, List, History, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import styles from '../../pages/index.module.css';
import { useSelector, useDispatch } from 'react-redux';
import { navigateToHeading, toggleRightSidebar } from '../../store/slices/layoutSlice';
import { fetchActivities } from '../../services/api/right-sidebar';

// 从 Markdown 源码中提取标题大纲，跳过 YAML Frontmatter 和代码块
const parseHeadings = (source) => {
  if (!source) return [];
  const lines = source.split('\n');
  const result = [];
  let inCodeBlock = false;
  let inFrontmatter = false;

  lines.forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (lineIndex === 0 && line === '---') {
      inFrontmatter = true;
      return;
    }
    if (inFrontmatter) {
      if (line === '---' || line === '...') inFrontmatter = false;
      return;
    }
    if (/^(```|~~~)/.test(line)) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) return;

    const match = /^(#{1,6})\s+(.+)$/.exec(line);
    if (match) {
      const text = match[2]
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接只保留文字
        .replace(/[*_`~]/g, '')
        .replace(/\s+#+\s*$/, '') // 去掉结尾的闭合 #
        .trim();
      result.push({ level: match[1].length, text, line: lineIndex, index: result.length });
    }
  });
  return result;
};

// 向上查找可滚动的祖先容器
const getScrollParent = (node) => {
  let current = node.parentElement;
  while (current) {
    const { overflowY } = window.getComputedStyle(current);
    if ((overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};

const ActivityPanel = ({ documentId, refreshSignal }) => {
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);
  const lastRefreshRef = useRef(refreshSignal?.nonce);

  useEffect(() => {
    setDate('');
    setPage(1);
    setItems([]);
    setPagination({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
    setError('');
  }, [documentId]);

  useEffect(() => {
    if (!refreshSignal || String(refreshSignal.documentId) !== String(documentId)) return;
    if (refreshSignal.nonce === lastRefreshRef.current) return;
    lastRefreshRef.current = refreshSignal.nonce;
    setPage(1);
    setReloadKey(key => key + 1);
  }, [refreshSignal, documentId]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');

    fetchActivities(documentId, { date, page, pageSize: 10 }, { signal: controller.signal })
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        setItems(res.data.items || []);
        setPagination(res.data.pagination);
      })
      .catch((err) => {
        if (err.name === 'AbortError' || requestId !== requestIdRef.current) return;
        setError(err.message || '跟进记录加载失败');
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });

    return () => controller.abort();
  }, [documentId, date, page, reloadKey]);

  const formatDateTime = (value) => {
    const dateTime = new Date(value);
    if (Number.isNaN(dateTime.getTime())) return value;
    return dateTime.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  };

  return (
    <div className={styles.activityPanel}>
      <div className={styles.activityFilters}>
        <input
          type="date"
          className={styles.activityDateInput}
          value={date}
          aria-label="按日期筛选跟进记录"
          onChange={(event) => {
            setDate(event.target.value);
            setPage(1);
          }}
        />
        {date && (
          <button type="button" className={styles.activityClearButton} onClick={() => { setDate(''); setPage(1); }}>
            清除
          </button>
        )}
        <span className={styles.activityTotal}>共 {pagination.total} 条</span>
      </div>

      <div className={styles.activityList}>
        {loading ? (
          <div className={styles.activityStatus}>正在加载跟进记录...</div>
        ) : error ? (
          <div className={styles.activityStatus}>
            <div className={styles.activityError}>{error}</div>
            <button type="button" className={styles.activityRetryButton} onClick={() => setReloadKey(key => key + 1)}>
              <RefreshCw size={13} /> 重试
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.activityStatus}>
            {date ? '所选日期暂无跟进记录' : '暂无跟进记录，保存或重命名文档后会显示在这里'}
          </div>
        ) : (
          items.map((item) => (
            <div className={styles.activityItem} key={item.id}>
              <span className={styles.activityDot} />
              <div className={styles.activityContent}>
                <div className={styles.activityAction}>
                  <strong>{item.actor.name}</strong>
                  <span>{item.actionLabel}</span>
                </div>
                <time className={styles.activityTime}>{formatDateTime(item.createdAt)}</time>
                {item.action === 'title_updated' && item.details && (
                  <div className={styles.activityDetails} title={`${item.details.from} → ${item.details.to}`}>
                    {item.details.from} → {item.details.to}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && !error && pagination.total > 0 && (
        <div className={styles.activityPagination}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(current => Math.max(1, current - 1))}
          >
            <ChevronLeft size={14} /> 上一页
          </button>
          <span>第 {page} / {pagination.totalPages || 1} 页</span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(current => current + 1)}
          >
            下一页 <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export const RightSidebar = () => {
  const dispatch = useDispatch();
  const { activeDocument, documentSource, activeTab, activityRefresh } = useSelector(state => state.layout);
  const currentDocId = activeDocument?.id;
  const [activePanel, setActivePanel] = useState('outline');

  // 导航目录：实时解析当前文档的标题结构
  const headings = useMemo(() => parseHeadings(documentSource), [documentSource]);
  const [activeHeading, setActiveHeading] = useState(null);

  // 切换文档时重置高亮
  useEffect(() => {
    setActiveHeading(null);
  }, [currentDocId]);

  const handleHeadingClick = (heading) => {
    setActiveHeading(heading.index);
    dispatch(navigateToHeading({ line: heading.line, index: heading.index, nonce: Date.now() }));
  };

  // 预览滚动时同步高亮当前阅读位置所在的标题
  useEffect(() => {
    if (activeTab !== 'preview' && activeTab !== 'split') return;
    const body = document.querySelector('.markdown-body');
    if (!body) return;
    const headingEls = body.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headingEls.length === 0) return;
    const scroller = getScrollParent(body);
    if (!scroller) return;

    const onScroll = () => {
      // 每次滚动都重新查询标题节点：预览的自定义渲染组件会在 re-render 时重建 DOM，
      // 缓存的 NodeList 会失效（节点被替换后位置信息全为 0），导致高亮错乱
      const currentBody = document.querySelector('.markdown-body');
      if (!currentBody) return;
      const headingEls = currentBody.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const scrollerTop = scroller.getBoundingClientRect().top;
      let current = 0;
      headingEls.forEach((el, i) => {
        if (el.getBoundingClientRect().top - scrollerTop <= 80) current = i;
      });
      setActiveHeading(current);
    };
    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [activeTab, currentDocId, documentSource]);

  if (!currentDocId) {
    return (
      <div className={styles.rightSidebar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13 }}>选择文档后可查看文档结构和跟进记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.rightSidebar}>
      <div className={styles.rightSidebarHeader}>
        <AlignLeft
          size={16}
          color="#64748b"
          style={{ cursor: 'pointer', flexShrink: 0 }}
          title="隐藏右侧面板"
          onClick={() => dispatch(toggleRightSidebar())}
        />
        <div className={styles.rightPanelTabs}>
          <button
            type="button"
            className={`${styles.rightPanelTab} ${activePanel === 'outline' ? styles.rightPanelTabActive : ''}`}
            aria-pressed={activePanel === 'outline'}
            onClick={() => setActivePanel('outline')}
          >
            <List size={13} /> 导航目录
          </button>
          <button
            type="button"
            className={`${styles.rightPanelTab} ${activePanel === 'activity' ? styles.rightPanelTabActive : ''}`}
            aria-pressed={activePanel === 'activity'}
            onClick={() => setActivePanel('activity')}
          >
            <History size={13} /> 跟进记录
          </button>
        </div>
        {activePanel === 'outline' && (
          <div style={{ backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 'bold', flexShrink: 0 }}>
            {headings.length} 个标题
          </div>
        )}
      </div>

      {activePanel === 'outline' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', minHeight: 0 }}>
        {headings.length === 0 ? (
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
            文档中暂无标题，使用 # ~ ###### 创建大纲
          </div>
        ) : (
          headings.map(heading => {
            const isActive = activeHeading === heading.index;
            return (
              <div
                key={`${heading.line}-${heading.index}`}
                onClick={() => handleHeadingClick(heading)}
                title={heading.text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 8px',
                  paddingLeft: 8 + (heading.level - 1) * 14,
                  fontSize: heading.level === 1 ? 13 : 12.5,
                  cursor: 'pointer',
                  borderRadius: 6,
                  color: isActive ? '#d97706' : heading.level === 1 ? '#1e293b' : '#475569',
                  fontWeight: heading.level === 1 || isActive ? 600 : 400,
                  backgroundColor: isActive ? '#fffbeb' : 'transparent',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ width: isActive ? 6 : 4, height: isActive ? 6 : 4, borderRadius: '50%', backgroundColor: isActive ? '#f59e0b' : '#cbd5e1', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{heading.text}</span>
              </div>
            );
          })
        )}
        </div>
      ) : (
        <ActivityPanel documentId={currentDocId} refreshSignal={activityRefresh} />
      )}
    </div>
  );
};
