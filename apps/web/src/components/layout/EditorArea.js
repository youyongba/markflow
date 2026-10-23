import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileText, Bold, Italic, Heading1, Code, Link as LinkIcon, 
  Image as ImageIcon, CheckSquare, Table, Sigma, AlignLeft, Eye, Download,
  Maximize2, Minimize2, Zap, Check, Clock, User, AlertTriangle, ChevronDown,
  FileBox, FileCode2, FileType2, Network
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
import { setActiveTab, toggleSyncScroll, toggleRightSidebar } from '../../store/slices/layoutSlice';
import * as api from '../../services/api/editor';

const Copy = ({ size, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const transformer = new Transformer();

export const EditorArea = () => {
  const dispatch = useDispatch();
  const { activeTab, isSyncScroll, activeDocument } = useSelector(state => state.layout);
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

  // 5. 全屏预览状态
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  // 引用 textarea DOM 以获取光标位置
  const textareaRef = useRef(null);
  
  // 双向同步滚动相关的 Ref
  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);
  const scrollOriginRef = useRef(null); // 记录当前滚动的发起方: 'left' | 'right'
  
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
    if (!isSyncScroll || activeTab !== 'split' || !source || !target) return;
    
    const sourceScrollable = source.scrollHeight - source.clientHeight;
    const targetScrollable = target.scrollHeight - target.clientHeight;
    
    // 如果没有可滚动的空间，则直接返回
    if (sourceScrollable <= 0 || targetScrollable <= 0) return;
    
    // 计算滚动比例并应用到目标容器
    const percentage = source.scrollTop / sourceScrollable;
    target.scrollTop = percentage * targetScrollable;
  };

  // 初始化拉取文档源码
  useEffect(() => {
    if (!currentDocId) {
      setSourceCode('');
      setLastSavedAt('');
      return;
    }
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
        }
      }).catch(err => {
        console.error('Save failed', err);
        setLastSavedAt('保存失败');
      });
    }, 1000);
  }, [currentDocId]);

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
      case 'heading':
        insertedText = `\n# ${selectedText || '一级标题'}\n`;
        newCursorPos = selectedText ? start + insertedText.length : start + 3;
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
      } else if (format === 'html' || format === 'pdf') {
        // 2 & 3. 导出 HTML 和 PDF (抓取右侧渲染好的 DOM 节点并注入离线样式)
        const previewNode = document.querySelector('.markdown-body');
        if (!previewNode) {
          alert('请先切换到包含“实时排版预览”的分屏模式，以获取渲染内容');
          setIsExporting(false);
          return;
        }
        
        const htmlContent = previewNode.innerHTML;
        const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1f2937; line-height: 1.6; }
  h1 { font-size: 32px; margin-bottom: 24px; color: #0b1c30; }
  h2 { display: flex; align-items: center; gap: 8px; font-size: 20px; margin-top: 32px; margin-bottom: 16px; color: #0b1c30; }
  table { width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  th, td { padding: 14px 16px; text-align: left; }
  th { background-color: #f8fafc; font-weight: 600; text-transform: uppercase; font-size: 14px; color: #1e293b; border-bottom: 1px solid #e2e8f0; }
  td { border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  tr:last-child td { border-bottom: none; }
  blockquote { position: relative; border-left: 4px solid #b45309; margin: 24px 0; padding: 16px 20px; background-color: #fdf6ef; border-radius: 0 8px 8px 0; }
  pre { background-color: #ffffff; padding: 16px; overflow-x: auto; border-radius: 4px; border: 1px solid #dce9ff; font-family: ui-monospace, monospace; font-size: 13.5px; }
  .table-wrapper { overflow-x: auto; }
  @media print {
    body { padding: 0; max-width: 100%; }
    .table-wrapper { overflow: visible; }
  }
</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="markdown-body">
    ${htmlContent}
  </div>
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
          <div className={styles.toolbarBtn} onClick={() => handleFormat('heading')} title="标题"><Heading1 size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('code')} title="代码"><Code size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('link')} title="超链接"><LinkIcon size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('image')} title="图片"><ImageIcon size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('task')} title="任务列表"><CheckSquare size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('table')} title="表格"><Table size={14} /></div>
          <div className={styles.toolbarBtn} onClick={() => handleFormat('math')} title="数学公式"><Sigma size={14} /></div>
          <div className={styles.toolbarDivider} />
          <div className={styles.toolbarBtn} onClick={handleRequestAi} title="AI 润色选中文本" style={{ color: '#4f46e5' }}><Zap size={14} /></div>
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
          <div 
            className={`${styles.toolbarBtn} ${styles.textBtn}`} 
            style={{ fontSize: 12, cursor: 'pointer' }}
            onClick={() => dispatch(toggleRightSidebar())}
          >
            <Code size={14} /> 元数据 (YAML)
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
                  <h1>
                    {activeDocument.title.replace('.md', '')}
                  </h1>
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
                          <div className={styles.customCodeBlock} style={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #dce9ff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', marginBottom: 24 }}>
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
