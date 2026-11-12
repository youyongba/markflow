import React, { useState, useEffect, useMemo } from 'react';
import { AlignLeft, List } from 'lucide-react';
import styles from '../../pages/index.module.css';
import { useSelector, useDispatch } from 'react-redux';
import { navigateToHeading, toggleRightSidebar } from '../../store/slices/layoutSlice';

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

export const RightSidebar = () => {
  const dispatch = useDispatch();
  const { activeDocument, documentSource, activeTab } = useSelector(state => state.layout);
  const currentDocId = activeDocument?.id;

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
          <p style={{ fontSize: 13 }}>选择文档后可查看文档结构</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.rightSidebar}>
      <div className={styles.rightSidebarHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlignLeft
            size={16}
            color="#64748b"
            style={{ cursor: 'pointer' }}
            title="隐藏导航目录"
            onClick={() => dispatch(toggleRightSidebar())}
          />
          导航目录 
        </div>
        <div style={{ backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>
          {headings.length} 个标题
        </div>
      </div>

      {/* 导航目录：浏览文档结构，点击跳转到对应标题 */}
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
    </div>
  );
};
