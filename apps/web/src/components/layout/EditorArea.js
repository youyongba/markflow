import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileText, Bold, Italic, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Code, Link as LinkIcon, 
  Image as ImageIcon, CheckSquare, Table, Sigma, AlignLeft, Eye, Download,
  Maximize2, Minimize2, Zap, Check, Clock, User, AlertTriangle, ChevronDown,
  FileBox, FileCode2, FileType2, Network, Strikethrough, Quote, List, ListOrdered, Minus
} from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-go';
import 'prismjs/themes/prism.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Toolbar } from 'markmap-toolbar';
import 'markmap-toolbar/dist/style.css';
import styles from '../../pages/index.module.css';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab, toggleSyncScroll, toggleRightSidebar, setDocumentSource, notifyDocumentActivity } from '../../store/slices/layoutSlice';
import * as api from '../../services/api/editor';

const Copy = ({ size, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const transformer = new Transformer();

// 生成与 Markdown 锚点链接匹配的 slug（保留中英文、数字、_ 和 -，去除标点，空格转 -）
const slugify = (text) => String(text || '')
  .trim()
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s_-]/gu, '')
  .replace(/\s+/g, '-');

export const EditorArea = () => {
  const dispatch = useDispatch();
  const { activeTab, isSyncScroll, activeDocument, headingNavigation } = useSelector(state => state.layout);
  const currentDocId = activeDocument?.id;

  // 1. 文档源码状态
  const [sourceCode, setSourceCode] = useState('');

  // 2. 自动保存状态
  const [lastSavedAt, setLastSavedAt] = useState('');
  const debounceTimerRef = useRef(null);

  // 3. AI 润色建议状态
  const [aiSuggestion, setAiSuggestion] = useState({
    visible: false,
    mode: 'enhance_semantic',
    confidence: 0,
    originalText: '',
    suggestedText: ''
  });

  // 4. 导出状态
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // 标题下拉菜单状态
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);

  // 5. 全屏预览状态
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  // 引用 textarea DOM 以获取光标位置
  const textareaRef = useRef(null);
  
  // 双向同步滚动相关的 Ref
  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);
  const scrollOriginRef = useRef(null); // 记录当前滚动的发起方: 'left' | 'right'
  const syncSuspendRef = useRef(false); // 标题跳转期间暂停双向同步滚动，避免与目标滚动互相覆盖

  // 将预览滚动到指定标题元素（供右侧大纲跳转和正文锚点链接共用）
  const scrollPreviewToElement = (target) => {
    const scroller = rightPaneRef.current;
    if (!scroller || !target) return;
    syncSuspendRef.current = true;
    setTimeout(() => { syncSuspendRef.current = false; }, 900);
    const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    scroller.scrollTo({ top: Math.max(0, top - 12), behavior: 'smooth' });
  };
  
  // 脑图相关的 Ref
  const refSvg = useRef(null);
  const refMarkmap = useRef(null);
  const refToolbar = useRef(null);

  // 脑图渲染逻辑
  useEffect(() => {
    if (activeTab === 'mindmap' && refSvg.current) {
      // 延迟初始化以确保 SVG 的宽高 (100%) 已在 DOM 中实际计算完成
      // 避免 d3-zoom 抛出 Could not resolve relative length 的错误
      const timer = setTimeout(() => {
        if (!refSvg.current) return;
        
        if (!refMarkmap.current) {
          refMarkmap.current = Markmap.create(refSvg.current);
          if (refToolbar.current) {
            refToolbar.current.innerHTML = '';
            const toolbar = new Toolbar();
            toolbar.attach(refMarkmap.current);
            refToolbar.current.appendChild(toolbar.render());
          }
        }
        const { root } = transformer.transform(sourceCode);
        refMarkmap.current.setData(root);
        refMarkmap.current.fit();
      }, 50);
      
      return () => clearTimeout(timer);
    } else if (activeTab !== 'mindmap') {
      // 切换视图时 SVG 节点会被销毁，必须清空旧实例，否则切回时会操作已卸载的旧节点报错
      if (refMarkmap.current) {
        if (typeof refMarkmap.current.destroy === 'function') {
          refMarkmap.current.destroy();
        }
        refMarkmap.current = null;
      }
    }
  }, [activeTab, sourceCode]);

  // 同步滚动核心逻辑
  const handleSyncScroll = (source, target) => {
    if (syncSuspendRef.current) return;
    if (!isSyncScroll || activeTab !== 'split' || !source || !target) return;
    
    const sourceScrollable = source.scrollHeight - source.clientHeight;
    const targetScrollable = target.scrollHeight - target.clientHeight;
    
    // 如果没有可滚动的空间，则直接返回
    if (sourceScrollable <= 0 || targetScrollable <= 0) return;
    
    // 计算滚动比例并应用到目标容器
    const percentage = source.scrollTop / sourceScrollable;
    target.scrollTop = percentage * targetScrollable;
  };

  // 将源码同步到 Redux，供右侧导航目录实时解析
  useEffect(() => {
    dispatch(setDocumentSource(sourceCode));
  }, [sourceCode, dispatch]);

  // 保存最新的视图状态，供标题跳转事件使用（避免把 sourceCode 加入跳转 effect 的依赖）
  const latestViewRef = useRef({ activeTab, sourceCode });
  latestViewRef.current = { activeTab, sourceCode };

  // 响应右侧导航目录的标题跳转
  useEffect(() => {
    if (!headingNavigation) return;
    const { line, index } = headingNavigation;
    const { activeTab: tab, sourceCode: code } = latestViewRef.current;

    // 跳转期间暂停双向同步滚动，待平滑滚动结束后恢复
    syncSuspendRef.current = true;
    setTimeout(() => { syncSuspendRef.current = false; }, 900);

    const scrollPreview = () => {
      const scroller = rightPaneRef.current;
      if (!scroller) return;
      const headings = scroller.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6');
      scrollPreviewToElement(headings[index]);
    };

    const scrollSource = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const lines = code.split('\n');
      const offset = lines.slice(0, line).reduce((sum, l) => sum + l.length + 1, 0);
      textarea.focus();
      textarea.setSelectionRange(offset, offset + (lines[line] || '').length);
      if (leftPaneRef.current) {
        // 编辑器行高：fontSize 14 * lineHeight 1.6
        leftPaneRef.current.scrollTo({ top: Math.max(0, line * 22.4 - 40), behavior: 'smooth' });
      }
    };

    if (tab === 'mindmap') {
      // 脑图视图没有标题锚点，先切到预览再跳转
      dispatch(setActiveTab('preview'));
      setTimeout(scrollPreview, 150);
      return;
    }
    if (tab === 'preview' || tab === 'split') scrollPreview();
    if (tab === 'source' || tab === 'split') scrollSource();
  }, [headingNavigation, dispatch]);

  // 初始化拉取文档源码
  useEffect(() => {
    if (!currentDocId) {
      setSourceCode('');
      setLastSavedAt('');
      return;
    }
    dispatch(setDocumentSource('')); // 切换文档时先清空旧大纲
    api.fetchContent(currentDocId).then(res => {
      if (res.code === 200 && res.data) {
        setSourceCode(res.data.source || '');

        if (res.data.lastSavedAt) {
          const date = new Date(res.data.lastSavedAt);
          setLastSavedAt(date.toLocaleTimeString('en-US', { hour12: false }));
        }
      }
    }).catch(err => {
      console.error('Failed to fetch doc content', err);
    });
  }, [currentDocId]);

  // 抽取通用的防抖保存逻辑
  const debouncedSave = useCallback((newCode) => {
    if (!currentDocId) return;
    setLastSavedAt('保存中...');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      api.saveContent(currentDocId, newCode).then(res => {
        if (res.code === 200) {
          setLastSavedAt(new Date().toLocaleTimeString('en-US', { hour12: false }));
          dispatch(notifyDocumentActivity({ documentId: currentDocId, nonce: Date.now() }));
        }
      }).catch(err => {
        console.error('Save failed', err);
        setLastSavedAt('保存失败');
      });
    }, 1000);
  }, [currentDocId, dispatch]);

  // 格式化工具栏的交互处理
  const handleFormat = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = sourceCode.substring(start, end);
    let insertedText = '';
    let newCursorPos = end;

    switch (type) {
      case 'bold':
        insertedText = `**${selectedText || '粗体文本'}**`;
        newCursorPos = selectedText ? start + insertedText.length : start + 2;
        break;
      case 'italic':
        insertedText = `*${selectedText || '斜体文本'}*`;
        newCursorPos = selectedText ? start + insertedText.length : start + 1;
        break;
      case 'strikethrough':
        insertedText = `~~${selectedText || '删除线文本'}~~`;
        newCursorPos = selectedText ? start + insertedText.length : start + 2;
        break;
      case 'h1':
        insertedText = `\n# ${selectedText || '一级标题'}\n`;
        newCursorPos = selectedText ? start + insertedText.length : start + 3;
        break;
      case 'h2':
        insertedText = `\n## ${selectedText || '二级标题'}\n`;
        newCursorPos = selectedText ? start + insertedText.length : start + 4;
        break;
      case 'h3':
        insertedText = `\n### ${selectedText || '三级标题'}\n`;
        newCursorPos = selectedText ? start + insertedText.length : start + 5;
        break;
      case 'h4':
        insertedText = `\n#### ${selectedText || '四级标题'}\n`;
        newCursorPos = selectedText ? start + insertedText.length : start + 6;
        break;
      case 'h5':
        insertedText = `\n##### ${selectedText || '五级标题'}\n`;
        newCursorPos = selectedText ? start + insertedText.length : start + 7;
        break;
      case 'h6':
        insertedText = `\n###### ${selectedText || '六级标题'}\n`;
        newCursorPos = selectedText ? start + insertedText.length : start + 8;
        break;
      case 'quote':
        insertedText = `\n> ${selectedText || '引用文本'}\n`;
        newCursorPos = selectedText ? start + insertedText.length : start + 3;
        break;
      case 'list-ul':
        insertedText = `\n- ${selectedText || '列表项'}\n`;
        newCursorPos = selectedText ? start + insertedText.length : start + 3;
        break;
      case 'list-ol':
        insertedText = `\n1. ${selectedText || '列表项'}\n`;
        newCursorPos = selectedText ? start + insertedText.length : start + 4;
        break;
      case 'hr':
        insertedText = `\n---\n`;
        newCursorPos = start + insertedText.length;
        break;
      case 'code':
        if (selectedText.includes('\n')) {
          insertedText = `\n\`\`\`\n${selectedText}\n\`\`\`\n`;
        } else {
          insertedText = `\`${selectedText || 'code'}\``;
        }
        newCursorPos = selectedText ? start + insertedText.length : start + 1;
        break;
      case 'link':
        insertedText = `[${selectedText || '链接文本'}](url)`;
        newCursorPos = selectedText ? start + insertedText.length : start + 1;
        break;
      case 'image':
        insertedText = `![${selectedText || '图片描述'}](image_url)`;
        newCursorPos = selectedText ? start + insertedText.length : start + 2;
        break;
      case 'task':
        insertedText = `\n- [ ] ${selectedText || '任务项'}\n`;
        newCursorPos = selectedText ? start + insertedText.length : start + 7;
        break;
      case 'table':
        insertedText = `\n| 列1 | 列2 |\n| --- | --- |\n| 内容 | 内容 |\n`;
        newCursorPos = start + insertedText.length;
        break;
      case 'math':
        insertedText = `$${selectedText || 'E=mc^2'}$`;
        newCursorPos = selectedText ? start + insertedText.length : start + 2;
        break;
      default:
        return;
    }

    const newCode = sourceCode.substring(0, start) + insertedText + sourceCode.substring(end);
    setSourceCode(newCode);
    debouncedSave(newCode);

    // 重新聚焦并设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos + (selectedText ? 0 : (insertedText.length - (newCursorPos - start) - (type === 'bold' ? 2 : type === 'italic' ? 1 : 0))));
    }, 0);
  };

  // 导出交互处理
  const handleExport = async (format) => {
    setIsExporting(true);
    setShowExportMenu(false);
    
    try {
      const title = activeDocument?.title ? activeDocument.title.replace('.md', '') : 'Document';
      
      if (format === 'markdown') {
        // 1. 导出纯 Markdown 文件
        const blob = new Blob([sourceCode], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.md`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'word') {
        // 导出 Word：将 Markdown 转为带预览样式的 .docx
        const [{ createDocx }, { Packer }] = await Promise.all([
          import('../../utils/exportWord'),
          import('docx')
        ]);
        const doc = createDocx(sourceCode);
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.docx`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'html' || format === 'pdf') {
        // 2 & 3. 导出 HTML 和 PDF：完整复制预览 DOM 和当前页面的全部样式，保证与“只读渲染”一致
        const previewNode = document.querySelector(`.${styles.previewContent}`) || document.querySelector('.markdown-body');
        if (!previewNode) {
          alert('请先切换到包含“实时排版预览”的分屏模式，以获取渲染内容');
          setIsExporting(false);
          return;
        }

        // 收集页面所有样式表（含 CSS Modules、Prism 等），预览 DOM 的类名不变，样式即可原样还原
        const cssText = Array.from(document.styleSheets).map(sheet => {
          try {
            return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
          } catch (err) {
            return '';
          }
        }).join('\n');

        // 克隆预览 DOM，为标题补充锚点 id，并把正文内的锚点链接改写为真实 id（PDF/HTML 内点击即可跳转）
        const clone = previewNode.cloneNode(true);
        const headingEls = Array.from(clone.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6'));
        headingEls.forEach((h, i) => { h.id = `heading-${i}`; });
        clone.querySelectorAll('.markdown-body a[href^="#"]').forEach(a => {
          let anchor = a.getAttribute('href').slice(1);
          try { anchor = decodeURIComponent(anchor); } catch (err) {}
          const slug = slugify(anchor);
          if (!slug) return;
          const target = headingEls.find(h => slugify(h.textContent) === slug)
            || headingEls.find(h => slugify(h.textContent).startsWith(slug) || slug.startsWith(slugify(h.textContent)));
          if (target) a.setAttribute('href', '#' + target.id);
        });

        // 导出的独立文件不依赖 React：注入原生 JS 实现“复制代码”按钮（PDF 为静态格式，按钮仅作展示）
        const exportScript = `<script>
document.addEventListener('click', function (e) {
  var btn = e.target.closest('[class*="customCodeBlock"] button');
  if (!btn) return;
  var block = btn.closest('[class*="customCodeBlock"]');
  var code = block && block.querySelector('pre code');
  if (!code) return;
  var text = code.innerText;
  function setLabel(msg) {
    var label = btn.querySelector('span:last-child') || btn;
    var old = label.textContent;
    label.textContent = msg;
    setTimeout(function () { label.textContent = old; }, 1500);
  }
  function selectCode() {
    var range = document.createRange();
    range.selectNodeContents(code);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  function legacyCopy() {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) {}
    document.body.removeChild(ta);
    if (ok) {
      setLabel('已复制');
    } else {
      // 剪贴板不可用时选中代码，保证用户总能手动复制
      selectCode();
      setLabel('已选中，请按 Ctrl/Cmd+C 复制');
    }
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      navigator.clipboard.writeText(text).then(function () {
        setLabel('已复制');
      }).catch(legacyCopy);
    } catch (err) {
      legacyCopy();
    }
  } else {
    legacyCopy();
  }
});
<\/script>`;

        const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${cssText}</style>
<style>
  /* 打印时保留背景色与边框颜色，避免 PDF 丢失预览配色 */
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  /* 覆盖应用全局的 html,body{height:100vh;overflow:hidden}，否则打印时会被裁剪成一页 */
  html, body { height: auto !important; overflow: visible !important; }
  /* 与应用内 .layout 的字体保持一致，避免导出后字体回退不同 */
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
  @page { margin: 12mm; }
  /* PDF 为静态文档，复制按钮不可执行，导出 PDF 时隐藏；HTML 包保留 */
  ${format === 'pdf' ? '.customCodeBlock button { display: none !important; }' : ''}
</style>
</head>
<body>
${clone.outerHTML}
${exportScript}
</body>
</html>`;

        if (format === 'html') {
          // 导出单文件 HTML 包
          const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${title}.html`;
          a.click();
          URL.revokeObjectURL(url);
        } else if (format === 'pdf') {
          // 调用浏览器原生打印服务导出 PDF
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(fullHtml);
            printWindow.document.close();
            printWindow.onload = () => {
              setTimeout(() => {
                printWindow.print();
                // 打印对话框关闭后自动关闭临时标签页
                printWindow.onafterprint = () => printWindow.close();
              }, 200);
            };
          } else {
            alert('请允许浏览器弹出窗口以生成 PDF');
          }
        }
      }
    } catch (err) {
      console.error('Export failed', err);
      alert('导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  // 模拟请求 AI 建议 (如果用户选中了文本)
  const handleRequestAi = async () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = sourceCode.substring(start, end);
    
    if (!selectedText.trim()) {
      alert('请先选中一段文本进行 AI 润色');
      return;
    }

    try {
      const res = await api.fetchAiPolish(currentDocId, selectedText, 'enhance_semantic');
      if (res.code === 200 && res.data) {
        setAiSuggestion({
          visible: true,
          mode: '语义增强',
          confidence: res.data.confidence,
          originalText: selectedText,
          suggestedText: res.data.suggestedText
        });
      }
    } catch (err) {
      console.error('AI Polish failed', err);
      alert('请求 AI 润色失败');
    }
  };

  // 处理 AI 建议被接受
  const handleAcceptAiSuggestion = () => {
    const newCode = sourceCode.replace(aiSuggestion.originalText, aiSuggestion.suggestedText);
    setSourceCode(newCode);
    debouncedSave(newCode);
    setAiSuggestion(prev => ({ ...prev, visible: false }));
  };

  // 处理文本编辑并触发防抖保存
  const handleCodeChange = (value) => {
    setSourceCode(value);
    debouncedSave(value);
  };

  // 计算当前文本的行数
  const lineCount = sourceCode.split('\n').length;

  if (!currentDocId) {
    return (
      <div className={styles.editorArea} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>请在左侧边栏选择一个文档</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editorArea}>
      {/* Editor Toolbar */}
      <div className={styles.editorToolbar}>
        <div className={styles.toolbarGroup}>
          <div 
            className={`${styles.toolbarBtn} ${styles.textBtn} ${activeTab === 'source' ? styles.active : ''}`}
            onClick={() => dispatch(setActiveTab('source'))}
          >
            <AlignLeft size={14} /> 纯源码
          </div>
          <div 
            className={`${styles.toolbarBtn} ${styles.textBtn} ${activeTab === 'split' ? styles.active : ''}`}
            onClick={() => dispatch(setActiveTab('split'))}
          >
            <Maximize2 size={14} /> 分屏对齐
          </div>
          <div 
            className={`${styles.toolbarBtn} ${styles.textBtn} ${activeTab === 'preview' ? styles.active : ''}`}
            onClick={() => dispatch(setActiveTab('preview'))}
          >
            <Eye size={14} /> 只读渲染
          </div>
          <div 
            className={`${styles.toolbarBtn} ${styles.textBtn} ${activeTab === 'mindmap' ? styles.active : ''}`}
            onClick={() => dispatch(setActiveTab('mindmap'))}
          >
            <Network size={14} /> 解析脑图
          </div>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('bold')} title="加粗"><Bold size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('italic')} title="斜体"><Italic size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('strikethrough')} title="删除线"><Strikethrough size={14} /></div>
          <div className={styles.toolbarDivider} />
          <div style={{ position: 'relative' }}>
            <div 
              className={`${styles.toolbarBtn}`} 
              onClick={() => setShowHeadingMenu(!showHeadingMenu)}
              title="标题"
            >
              <Heading1 size={14} /> <ChevronDown size={12} style={{ marginLeft: 2 }} />
            </div>
            
            {showHeadingMenu && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 10 }} 
                  onClick={() => setShowHeadingMenu(false)}
                />
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  marginTop: 4, 
                  backgroundColor: 'white', 
                  borderRadius: 8, 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0,0,0,0.05)',
                  zIndex: 20,
                  width: 130,
                  overflow: 'hidden'
                }}>
                  {[
                    { type: 'h1', label: '一级标题', icon: Heading1 },
                    { type: 'h2', label: '二级标题', icon: Heading2 },
                    { type: 'h3', label: '三级标题', icon: Heading3 },
                    { type: 'h4', label: '四级标题', icon: Heading4 },
                    { type: 'h5', label: '五级标题', icon: Heading5 },
                    { type: 'h6', label: '六级标题', icon: Heading6 },
                  ].map(item => (
                    <div 
                      key={item.type}
                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 13, color: '#334155' }}
                      onClick={() => {
                        handleFormat(item.type);
                        setShowHeadingMenu(false);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <item.icon size={14} /> {item.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className={styles.toolbarDivider} />
          <div className={styles.toolbarBtn} onClick={() => handleFormat('quote')} title="引用"><Quote size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('code')} title="代码"><Code size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('link')} title="超链接"><LinkIcon size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('image')} title="图片"><ImageIcon size={14} /></div>
          <div className={styles.toolbarDivider} />
          <div className={styles.toolbarBtn} onClick={() => handleFormat('list-ul')} title="无序列表"><List size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('list-ol')} title="有序列表"><ListOrdered size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('task')} title="任务列表"><CheckSquare size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('table')} title="表格"><Table size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('hr')} title="分割线"><Minus size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('math')} title="数学公式"><Sigma size={14} /></div>
        </div>

        <div style={{ flex: 1 }} />

        <div className={styles.toolbarGroup}>
          <div 
            className={`${styles.toolbarBtn} ${styles.textBtn}`} 
            style={{ fontSize: 12, cursor: 'pointer' }}
            onClick={() => dispatch(toggleSyncScroll())}
          >
            双向同步滚动: <span style={{ color: isSyncScroll ? '#10b981' : '#94a3b8' }}>{isSyncScroll ? '开' : '关'}</span>
          </div>
          <div className={styles.toolbarDivider} />
          <div style={{ position: 'relative' }}>
            <div 
              className={`${styles.toolbarBtn} ${styles.textBtn}`} 
              style={{ fontSize: 12, cursor: isExporting ? 'not-allowed' : 'pointer', opacity: isExporting ? 0.6 : 1 }}
              onClick={() => !isExporting && setShowExportMenu(!showExportMenu)}
            >
              <Download size={14} /> {isExporting ? '导出中...' : '导出'} <ChevronDown size={14} />
            </div>
            
            {showExportMenu && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 10 }} 
                  onClick={() => setShowExportMenu(false)}
                />
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  right: 0, 
                  marginTop: 4, 
                  backgroundColor: 'white', 
                  borderRadius: 8, 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0,0,0,0.05)',
                  zIndex: 20,
                  width: 160,
                  overflow: 'hidden'
                }}>
                  <div 
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: '#334155' }}
                    onClick={() => handleExport('pdf')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FileBox size={16} color="#dc2626" />
                    导出 PDF
                  </div>
                  <div 
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: '#334155' }}
                    onClick={() => handleExport('markdown')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FileType2 size={16} color="#2563eb" />
                    导出 Markdown
                  </div>
                  <div 
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: '#334155' }}
                    onClick={() => handleExport('html')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FileCode2 size={16} color="#7c3aed" />
                    导出 HTML 包
                  </div>
                  <div 
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: '#334155' }}
                    onClick={() => handleExport('word')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FileText size={16} color="#2b579a" />
                    导出 Word
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Split Panes */}
      <div className={styles.editorSplit}>
        
        {/* Left Pane: Source */}
        {(activeTab === 'source' || activeTab === 'split') && (
          <div className={`${styles.editorPane} ${styles.sourcePane}`}>
            <div className={styles.paneHeader}>
              <div className={styles.paneTitle}>
                <FileText size={14} color="#3b82f6" /> {activeDocument.title}
                <span className={styles.statusBadge} style={{ backgroundColor: '#fef08a', color: '#854d0e' }}>已自动备份 ({lastSavedAt})</span>
              </div>
              <div>Ln {lineCount}, Col {sourceCode.length} &nbsp;&nbsp; LF &nbsp;&nbsp; UTF-8</div>
            </div>
            <div 
              className={styles.paneContent} 
              style={{ display: 'flex', backgroundColor: '#fdfdfd', position: 'relative', padding: 0 }}
              ref={leftPaneRef}
              onMouseEnter={() => { scrollOriginRef.current = 'left'; }}
              onScroll={(e) => {
                if (scrollOriginRef.current === 'left') {
                  handleSyncScroll(e.target, rightPaneRef.current);
                }
              }}
            >
              
              {/* 行号栏 */}
              <div style={{ padding: '16px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 13, fontFamily: 'monospace', textAlign: 'right', userSelect: 'none', minWidth: 40 }}>
                {Array.from({ length: Math.max(15, lineCount) }).map((_, i) => (
                  <div key={i} style={{ lineHeight: '1.6' }}>{i + 1}</div>
                ))}
              </div>

              {/* 真实的文本输入区 */}
              <div style={{ flex: 1, position: 'relative' }}>
                <Editor
                  value={sourceCode}
                  onValueChange={handleCodeChange}
                  highlight={code => Prism.highlight(code, Prism.languages.markdown, 'markdown')}
                  padding={16}
                  textareaId="markdown-editor-textarea"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 14,
                    lineHeight: '1.6',
                    minHeight: '100%',
                    color: '#334155'
                  }}
                  textareaClassName={styles.editorTextarea}
                />

                {/* 将 ref 绑定到实际渲染出的 textarea 元素上以便处理快捷工具栏 */}
                <span ref={(node) => {
                  if (node) {
                    textareaRef.current = document.getElementById('markdown-editor-textarea');
                  }
                }} />

                {/* AI Widget 浮层 (仅当包含匹配文本且开启时显示) */}
                {aiSuggestion.visible && sourceCode.includes(aiSuggestion.originalText) && (
                  <div className={styles.aiWidget} style={{ position: 'absolute', top: 60, left: 16, right: 16, zIndex: 10, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                    <div className={styles.aiHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={14} fill="#4338ca" /> AI 智能架构润色 (CLAUDE 3.5 SONNET) <span style={{ backgroundColor: '#e0e7ff', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>{aiSuggestion.mode}</span>
                      </div>
                      <div>置信度 {aiSuggestion.confidence}%</div>
                    </div>
                    <div className={styles.aiContent}>
                      <div className={styles.aiDiff}>- {aiSuggestion.originalText}</div>
                      <div className={styles.aiAdd}>+ {aiSuggestion.suggestedText}</div>
                    </div>
                    <div className={styles.aiActions}>
                      <div className={`${styles.aiBtn} ${styles.discard}`} onClick={() => setAiSuggestion(prev => ({ ...prev, visible: false }))}>放弃建议 (Discard)</div>
                      <div className={`${styles.aiBtn} ${styles.insert}`}>在下方插入 (Insert)</div>
                      <div className={`${styles.aiBtn} ${styles.replace}`} onClick={handleAcceptAiSuggestion}><Check size={12} style={{ display: 'inline', marginRight: 4 }}/>替换原内容 (Replace)</div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Mindmap Pane */}
        {activeTab === 'mindmap' && (
          <div className={styles.editorPane}>
            <div className={styles.paneHeader}>
              <div className={styles.paneTitle}>
                <Network size={14} color="#8b5cf6" /> 解析脑图
              </div>
            </div>
            <div className={styles.paneContent} style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
              <svg ref={refSvg} style={{ width: '100%', height: '100%' }} />
              <div ref={refToolbar} style={{ position: 'absolute', bottom: 16, right: 16 }} />
            </div>
          </div>
        )}

        {/* Right Pane: Preview */}
        {(activeTab === 'preview' || activeTab === 'split') && (
          <div 
            className={styles.editorPane} 
            style={isPreviewFullscreen ? { position: 'fixed', inset: 0, zIndex: 9999, borderRadius: 0 } : {}}
          >
            <div className={styles.paneHeader}>
              <div className={styles.paneTitle}>
                <Eye size={14} color="#10b981" /> 实时排版预览 (Live HTML Output)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  阅读宽度: 800px 最佳视野
                </div>
                <div 
                  onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '4px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569', transition: 'all 0.2s' }}
                  title={isPreviewFullscreen ? "退出全屏" : "全屏预览"}
                >
                  {isPreviewFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </div>
              </div>
            </div>
            <div 
              className={styles.paneContent}
              ref={rightPaneRef}
              onMouseEnter={() => { scrollOriginRef.current = 'right'; }}
              onScroll={(e) => {
                if (scrollOriginRef.current === 'right') {
                  handleSyncScroll(e.target, leftPaneRef.current);
                }
              }}
            >
              <div className={styles.previewContent}>
                <div style={{ borderBottom: '1px solid #dce9ff', paddingBottom: 8 }}>
                  <div className={styles.previewMeta}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={15} /> {activeDocument.creatorName || activeDocument.author || '创作者'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={15} /> {activeDocument.date || new Date().toISOString().split('T')[0]}</span>
                  </div>
                </div>

                <div className="markdown-body">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // 允许渲染部分 HTML 标签以支持行内样式
                      span: ({node, ...props}) => <span {...props} />,
                      // 正文内的锚点链接（如目录索引 [xxx](#xxx)）：点击平滑滚动到对应标题
                      a({node, href, children, ...props}) {
                        if (href && href.startsWith('#')) {
                          return (
                            <a
                              {...props}
                              href={href}
                              style={{ color: '#2563eb', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.preventDefault();
                                let anchor = href.slice(1);
                                try { anchor = decodeURIComponent(anchor); } catch (err) {}
                                const slug = slugify(anchor);
                                const container = rightPaneRef.current;
                                if (!container || !slug) return;
                                const headingEls = Array.from(container.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6'));
                                // 先精确匹配，再兼容被截断的锚点（前缀匹配）
                                const target = headingEls.find(h => slugify(h.textContent) === slug)
                                  || headingEls.find(h => slugify(h.textContent).startsWith(slug) || slug.startsWith(slugify(h.textContent)));
                                scrollPreviewToElement(target);
                              }}
                            >
                              {children}
                            </a>
                          );
                        }
                        return <a {...props} href={href}>{children}</a>;
                      },
                      table({node, children, ...props}) {
                        return (
                          <div className="table-wrapper" style={{ overflowX: 'auto', margin: '24px 0', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                            <table {...props} style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
                              {children}
                            </table>
                          </div>
                        )
                      },
                      thead({node, children, ...props}) {
                        return <thead {...props} style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>{children}</thead>
                      },
                      tbody({node, children, ...props}) {
                        return <tbody {...props}>{children}</tbody>
                      },
                      tr({node, children, ...props}) {
                        return <tr {...props} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: 'transparent' }}>{children}</tr>
                      },
                      th({node, children, ...props}) {
                        return <th {...props} style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b', textAlign: 'left', fontSize: 14, textTransform: 'uppercase' }}>{children}</th>
                      },
                      td({node, children, ...props}) {
                        let color = '#334155';
                        let fontWeight = 'normal';
                        const text = Array.isArray(children) ? children.join('') : String(children);
                        
                        if (text.includes('99.8%') || text.includes('100%') || text.includes('低 (单二进制部署)') || text.includes('极低') || text.includes('完全自控')) {
                          color = '#2563eb';
                        } else if (text.includes('高 (需专业存储运维)') || text.includes('审查风险')) {
                          color = '#dc2626';
                        } else if (text.includes('受限于')) {
                          color = '#b45309';
                        } else if (text.includes('92.0%') || text.includes('GB/s')) {
                          color = '#64748b';
                        }
                        
                        return <td {...props} style={{ padding: '14px 16px', color, fontWeight, textAlign: 'left', fontSize: 14 }}>{children}</td>
                      },
                      h2({node, children, ...props}) {
                        return (
                          <h2 {...props} style={{ fontSize: 20, lineHeight: '28px', fontWeight: 600, color: '#0b1c30', letterSpacing: '-0.005em', display: 'flex', alignItems: 'center', gap: 8, marginTop: 32, marginBottom: 16 }}>
                            <span style={{ display: 'inline-block', width: 6, height: 16, borderRadius: 9999, backgroundColor: '#30568b' }}></span>
                            {children}
                          </h2>
                        )
                      },
                      blockquote({node, children, ...props}) {
                        let title = "提示";
                        let hasCustomTitle = false;
                        
                        const childrenArray = React.Children.toArray(children);
                        let newChildren = childrenArray;

                        // Extract title dynamically from blockquote content
                        if (childrenArray.length > 1) {
                          // Case 1: Multiple paragraphs. First paragraph is the title.
                          const firstChild = childrenArray[0];
                          title = React.isValidElement(firstChild) ? firstChild.props.children : firstChild;
                          hasCustomTitle = true;
                          newChildren = childrenArray.slice(1);
                        } else if (childrenArray.length === 1) {
                          // Case 2: Single paragraph with line breaks. First line is the title.
                          const firstChild = childrenArray[0];
                          if (React.isValidElement(firstChild) && firstChild.type === 'p') {
                            const pChildren = React.Children.toArray(firstChild.props.children);
                            if (pChildren.length > 0 && typeof pChildren[0] === 'string') {
                              const lines = pChildren[0].split('\n');
                              if (lines.length > 1) {
                                title = lines[0].replace(/^\[!(WARNING|INFO|NOTE|TIP)\]\s*/i, '');
                                hasCustomTitle = true;
                                const newFirstText = lines.slice(1).join('\n');
                                const newPChildren = [newFirstText, ...pChildren.slice(1)];
                                const newFirstChild = React.cloneElement(firstChild, {}, ...newPChildren);
                                newChildren = [newFirstChild];
                              }
                            }
                          }
                        }

                        return (
                          <blockquote {...props} style={{ position: 'relative', borderLeft: '4px solid #b45309', margin: '24px 0', padding: '16px 20px', backgroundColor: '#fdf6ef', borderRadius: '0 8px 8px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309', fontWeight: 'bold', fontSize: 15, marginBottom: 8 }}>
                              <span>{hasCustomTitle ? title : '提示'}</span>
                            </div>
                            <div style={{ fontSize: 14, lineHeight: 1.6, color: '#334155', paddingLeft: 0 }}>
                              {newChildren}
                            </div>
                          </blockquote>
                        )
                      },
                      ul({node, children, className, ...props}) {
                        if (className === 'contains-task-list') {
                          return <div style={{ display: 'flex', flexDirection: 'column', gap: 8, backgroundColor: '#eff4ff', padding: 16, borderRadius: 8, marginBottom: 24 }}>{children}</div>
                        }
                        return <ul className={className} {...props}>{children}</ul>
                      },
                      li({node, children, className, checked, ...props}) {
                        if (className === 'task-list-item') {
                          const content = React.Children.toArray(children).filter(child => child.type !== 'input');
                          return (
                            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: '#0b1c30' }}>
                              <input type="checkbox" checked={checked} readOnly style={{ width: 16, height: 16, accentColor: '#30568b' }} />
                              <span style={checked ? { textDecoration: 'line-through', opacity: 0.6 } : { fontWeight: 500 }}>
                                {content}
                              </span>
                            </label>
                          )
                        }
                        return <li className={className} {...props}>{children}</li>
                      },
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '');
                        const lang = match ? match[1] : '';
                        
                        let highlightedCode = children;
                        try {
                          if (!inline && lang && Prism.languages[lang]) {
                            highlightedCode = Prism.highlight(String(children).replace(/\n$/, ''), Prism.languages[lang], lang);
                          }
                        } catch(e) {}

                        // Extract optional filename from meta string (e.g. ```go title="pkg/storage/probe.go" or just ```go pkg/storage/probe.go)
                        const meta = node?.data?.meta || node?.properties?.meta || '';
                        let fileName = lang; // Default to language name
                        if (meta) {
                          const titleMatch = meta.match(/title="([^"]+)"/) || meta.match(/title=([^ ]+)/);
                          if (titleMatch) {
                            fileName = titleMatch[1];
                          } else if (!meta.includes('=')) {
                            // Assume the meta string itself is the filename if no key=value pairs
                            fileName = meta;
                          }
                        }

                        const handleCopy = () => {
                          const textToCopy = String(children).replace(/\n$/, '');
                          navigator.clipboard.writeText(textToCopy).then(() => {
                            // You could add a toast or local state here to show "Copied!" temporarily
                            alert('代码已复制到剪贴板');
                          }).catch(err => {
                            console.error('Failed to copy: ', err);
                          });
                        };

                        return !inline && match ? (
                          <div className="customCodeBlock" style={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #dce9ff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', marginBottom: 24 }}>
                            <div className={styles.codeHeader} style={{ backgroundColor: '#213145', color: '#eaf1ff', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, fontFamily: 'ui-monospace, monospace' }}>
                              <div className={styles.macDots} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className={styles.macDot} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ba1a1a', display: 'inline-block' }}></span>
                                <span className={styles.macDot} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ffb95f', display: 'inline-block' }}></span>
                                <span className={styles.macDot} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#a7c8ff', display: 'inline-block' }}></span>
                                <span className={styles.codeLang} style={{ marginLeft: 8, color: '#c3c6d1', fontWeight: 500 }}>{fileName}</span>
                              </div>
                              <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#c3c6d1', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer' }}><Copy size={14} /> <span>复制代码</span></button>
                            </div>
                            <pre className={className} style={{ margin: 0, padding: 16, backgroundColor: '#ffffff', overflowX: 'auto', fontSize: 13.5, color: '#0b1c30', fontFamily: 'ui-monospace, monospace' }}>
                              {Prism.languages[lang] ? (
                                <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                              ) : (
                                <code className={className} {...props}>{children}</code>
                              )}
                            </pre>
                          </div>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {sourceCode}
                  </ReactMarkdown>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
