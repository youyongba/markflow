import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Folder, Search, Share, Plus, ChevronDown, AlignLeft, X, FileText, CheckCircle, Sparkles, Settings, Keyboard, ArrowRightLeft, LogOut } from 'lucide-react';
import styles from '../../pages/index.module.css';
import { toggleLeftSidebar, setTreeNodes, toggleNodeExpansion, setPreferences, setActiveDocument } from '../../store/slices/layoutSlice';
import * as api from '../../services/api/header';
import * as sidebarApi from '../../services/api/sidebar';

export const TopHeader = () => {
  const dispatch = useDispatch();
  const { isLeftSidebarOpen, expandedNodes, activeDocument } = useSelector((state) => state.layout);
  const currentDocId = activeDocument?.id;

  const [headerContext, setHeaderContext] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // 搜索相关状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // 新建文档弹窗状态
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [docTitle, setDocTitle] = useState('ADR-005-分布式元数据同步方案.md');
  const [docDirectory, setDocDirectory] = useState('');
  const [treeFolders, setTreeFolders] = useState([]);
  const [frontmatter, setFrontmatter] = useState('standard');
  const [templateId, setTemplateId] = useState('adr');
  const [enableAi, setEnableAi] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('针对跨区域混合云部署的元数据 Raft 复制与分片路由方案设计');
  
  // 分享文档弹窗状态
  const [shareModal, setShareModal] = useState({ isOpen: false, type: '', message: '', link: '' });
  const [copyText, setCopyText] = useState('复制');

  const handleFormatMD = () => {
    if (docTitle && !docTitle.toLowerCase().endsWith('.md')) {
      setDocTitle(prev => prev + '.md');
    }
  };

  // 监听当前文档变化，刷新顶部面包屑上下文
  useEffect(() => {
    api.fetchContext(currentDocId).then(res => {
      if (res.code === 200) setHeaderContext(res.data);
    }).catch(err => console.error('Failed to fetch header context', err));
  }, [currentDocId]);

  // 初始化拉取用户信息和目录树
  useEffect(() => {
    api.fetchUserProfile().then(res => {
      if (res.code === 200) setUserProfile(res.data);
    }).catch(err => console.error('Failed to fetch user profile', err));

    // 拉取所有文件夹节点供新建文档选择
    sidebarApi.fetchTreeNodes().then(res => {
      if (res.code === 200) {
        // 过滤出所有 type 为 folder 的节点
        const folders = res.data.filter(node => node.type === 'folder');
        setTreeFolders(folders);
        // 如果有文件夹，默认选中第一个
        if (folders.length > 0) {
           setDocDirectory(folders[0].id);
        }
      }
    }).catch(err => console.error('Failed to fetch tree nodes for dropdown', err));
  }, []);

  // 生成分享链接交互
  const handleShare = async () => {
    if (!currentDocId) {
      setShareModal({ isOpen: true, type: 'error', message: '请先选择一个要分享的文档', link: '' });
      return;
    }
    try {
      const res = await api.createShareLink({ targetId: currentDocId, expiresIn: 86400 });
      if (res.code === 200 && res.data) {
        setShareModal({ isOpen: true, type: 'success', message: '分享链接已生成：', link: res.data.shareUrl });
      } else {
        setShareModal({ isOpen: true, type: 'error', message: res.message || '分享失败', link: '' });
      }
    } catch (err) {
      console.error('Share failed', err);
      setShareModal({ isOpen: true, type: 'error', message: '网络请求失败', link: '' });
    }
  };

  // 打开新建文档弹窗
  const handleCreateDoc = () => setIsCreateModalOpen(true);


  // 确认创建文档
  const handleConfirmCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      let documentId;
      if (templateId === 'api') {
        // 调用专用的新建 REST API 模板接口 (不再依赖 enableAi)
        const payload = {
          title: docTitle || '无标题文档',
          parentId: docDirectory,
          apiDescription: "生成API文档",
          apiType: 'rest'
        };
        const res = await api.createApiTemplateDocument(payload);
        if (res.code === 200 && res.data) {
          documentId = res.data.documentId;
          alert(`API 接口文档生成成功！\n文档 ID: ${res.data.documentId}\n\n生成内容预览:\n${res.data.source.substring(0, 100)}...`);
          setIsCreateModalOpen(false);
        } else {
          alert(`生成失败: ${res.message || '未知错误'}`);
        }
      } else {
        // 调用通用的新建文档接口
        const payload = {
          title: docTitle || '无标题文档',
          parentId: docDirectory === 'root' ? null : docDirectory,
          frontmatter: frontmatter,
          templateId: templateId,
          enableAi: false
        };
        const res = await api.createDocument(payload);
        if (res.code === 200 && res.data) {
          documentId = res.data.documentId;
          alert(`新建文档成功！文档 ID: ${res.data.documentId}\n\n请求参数:\n${JSON.stringify(payload, null, 2)}`);
          setIsCreateModalOpen(false);
        } else {
          alert(`创建失败: ${res.message || '未知错误'}`);
        }
      }
      
      // 成功创建后，刷新侧边栏目录树并展开父节点
      if (documentId) {
        // 设置新建的文档为当前激活文档
        dispatch(setActiveDocument({
          id: parseInt(documentId) || documentId,
          title: docTitle || '无标题文档',
          status: 'draft'
        }));

        if (docDirectory && docDirectory !== 'root' && !expandedNodes.includes(docDirectory)) {
          dispatch(toggleNodeExpansion(docDirectory)); // 确保该目录处于展开状态
        }
        const treeRes = await sidebarApi.fetchTreeNodes();
        if (treeRes.code === 200) {
          dispatch(setTreeNodes(treeRes.data));
        }
      }
    } catch (err) {
      console.error('Create doc failed', err);
      alert('网络请求失败');
    } finally {
      setIsCreating(false);
    }
  };

  // 监听弹窗快捷键 (Esc取消, Enter创建)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (!isCreateModalOpen) return;
      if (e.key === 'Escape') setIsCreateModalOpen(false);
      if (e.key === 'Enter') handleConfirmCreate();
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isCreateModalOpen]);

  // 处理搜索输入和回车
  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter' && searchKeyword.trim()) {
      setIsSearching(true);
      setIsSearchOpen(true);
      try {
        const res = await api.searchGlobal(searchKeyword.trim());
        if (res.code === 200) {
          setSearchResults(res.data || []);
        }
      } catch (err) {
        console.error('Search failed', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
  };

  // 关闭搜索弹窗和用户菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${styles.searchBar}`)) {
        setIsSearchOpen(false);
      }
      if (!e.target.closest(`.${styles.avatar}`)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 渲染动态面包屑
  const renderBreadcrumbText = () => {
    if (!headerContext) return 'Loading...';
    const parts = [
      headerContext.workspaceName,
      headerContext.branchOrTag,
      ...(headerContext.paths?.map(p => p.title) || [])
    ].filter(Boolean);
    return parts.join(' / ');
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/v2.4/header/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logoutAllDevices: false })
      });
      
      const data = await res.json();
      
      if (data.code === 200) {
        // 1. 清除本地缓存的 token
        localStorage.removeItem('token');
        // 2. 跳转回登录页
        window.location.href = '/auth/login';
      } else {
        alert(data.message || '退出登录失败');
      }
    } catch (err) {
      console.error('Logout failed:', err);
      alert('网络请求失败');
    }
  };

  return (
    <div className={styles.topHeader}>
      <div className={styles.breadcrumb}>
        {!isLeftSidebarOpen && (
          <AlignLeft 
            size={18} 
            color="#64748b" 
            style={{ cursor: 'pointer', marginRight: '12px' }} 
            onClick={() => dispatch(toggleLeftSidebar())} 
          />
        )}
        <Folder size={16} color="#3b82f6" />
        <span>{renderBreadcrumbText()}</span>
        <ChevronDown size={14} />
      </div>

      <div className={styles.searchBar} style={{ position: 'relative' }}>
        <Search size={14} />
        <input 
          type="text" 
          placeholder="搜索文档、标签、代码片段... (按回车搜索)" 
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          onFocus={() => { if (searchResults.length > 0) setIsSearchOpen(true); }}
        />
        <span className={styles.searchShortcut}>⌘K</span>

        {/* 搜索结果下拉框 */}
        {isSearchOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {isSearching ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>搜索中...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map(item => (
                <div key={item.id} style={{ 
                  padding: '10px 12px', 
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
                onClick={() => {
                  if (item.type === 'document') {
                    // 如果是文档类型，直接派发加载该文档，实现真正的页面闭环
                    dispatch(setActiveDocument({
                      id: parseInt(item.id) || item.id,
                      title: item.title,
                      status: 'draft' // 从搜索列表跳转暂默认为 draft，实际应由后端返回
                    }));
                  } else {
                    alert(`即将跳转至: ${item.url}`);
                  }
                  setIsSearchOpen(false);
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>{item.title}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                      {item.type}
                    </span>
                  </div>
                  {item.highlight && (
                    <div 
                      style={{ fontSize: '12px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      dangerouslySetInnerHTML={{ __html: item.highlight }} 
                    />
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>未找到相关结果</div>
            )}
          </div>
        )}
      </div>

      <div className={styles.headerActions}>
        <div className={styles.actionBtn} onClick={handleShare} style={{ cursor: 'pointer' }}>
          <Share size={14} /> 分享
        </div>
        <div className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={handleCreateDoc} style={{ cursor: 'pointer' }}>
          <Plus size={14} /> 新建文档
        </div>
        <div 
          className={styles.avatar} 
          style={{ position: 'relative', cursor: 'pointer' }}
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        >
          {userProfile ? (
            <img 
              src={userProfile.avatarUrl} 
              alt={userProfile.userName} 
              title={`${userProfile.userName} (${userProfile.role})`}
              width="28" 
              height="28" 
              style={{ borderRadius: '50%' }}
            />
          ) : (
            <div style={{ width: 28, height: 28, backgroundColor: '#e2e8f0', borderRadius: '50%' }} />
          )}

          {/* 用户菜单浮层 */}
          {isUserMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '12px',
              width: '280px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              zIndex: 100,
              overflow: 'hidden',
              cursor: 'default'
            }} onClick={e => e.stopPropagation()}>
              {/* 头部信息 */}
              <div style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <img 
                  src={userProfile?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"} 
                  alt="avatar" 
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#0f172a' }}>
                    {userProfile?.userName || 'Alex Chen (陈希)'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {userProfile?.email || (userProfile?.userName ? `${userProfile.userName.toLowerCase().replace(/\s/g, '')}@markflow.internal` : 'alex@markflow.internal')}
                  </div>
                  <div style={{ marginTop: '4px', alignSelf: 'flex-start', backgroundColor: '#e0e7ff', color: '#3730a3', fontSize: '12px', fontWeight: '600', padding: '4px 8px', borderRadius: '4px' }}>
                    {userProfile?.role || 'Owner / Staff Arch'}
                  </div>
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: '#e2e8f0' }} />

            

              <div style={{ height: '1px', backgroundColor: '#e2e8f0' }} />

              {/* 退出登录 */}
              <div style={{ padding: '8px 0' }}>
                <div 
                  style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }} 
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'} 
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={handleLogout}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#b91c1c', fontSize: '14px', fontWeight: '500' }}>
                    <LogOut size={18} />
                    <span>退出登录</span>
                  </div>
                  <div style={{ color: '#ef4444', fontSize: '13px' }}>Sign out</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 新建文档弹窗 (浮层) */}
      {isCreateModalOpen && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(15,23,42,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ backgroundColor:'#fff', borderRadius:'12px', width:'90%', maxWidth:'640px', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {/* 弹窗 Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #e2e8f0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:32, height:32, backgroundColor:'#eff6ff', color:'#3b82f6', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}><FileText size={18} /></div>
                <div>
                  <div style={{ fontSize:16, fontWeight:600, color:'#0f172a' }}>新建文档</div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>Create New Document · Markdown + YAML 元数据</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:11, color:'#64748b', backgroundColor:'#f1f5f9', padding:'2px 6px', borderRadius:4 }}>Esc</span>
                <X size={18} color="#94a3b8" style={{ cursor:'pointer' }} onClick={() => setIsCreateModalOpen(false)} />
              </div>
            </div>

            {/* 弹窗 Body */}
            <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'20px' }}>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:12, fontWeight:500, color:'#475569' }}>
                  <span>文档名称与后缀 (TITLE)</span><span style={{ color:'#3b82f6', cursor:'pointer' }} onClick={handleFormatMD}>自动格式化 .MD</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', border: docTitle ? '1px solid #3b82f6' : '1px solid #e2e8f0', borderRadius:6, padding:'8px 12px', boxShadow: docTitle ? '0 0 0 2px rgba(59,130,246,0.1)' : 'none' }}>
                  <FileText size={16} color="#94a3b8" style={{ marginRight:8 }} />
                  <input type="text" value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="请输入文档名称..." style={{ flex:1, border:'none', outline:'none', fontSize:13, color:'#0f172a', backgroundColor:'transparent' }} />
                  <span style={{ fontSize:11, color:'#64748b', backgroundColor:'#f1f5f9', padding:'2px 6px', borderRadius:4 }}>UTF-8</span>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <div>
                  <div style={{ marginBottom:8, fontSize:12, fontWeight:500, color:'#475569' }}>存储目录 (DIRECTORY PATH)</div>
                  <div style={{ display:'flex', alignItems:'center', position:'relative', border:'1px solid #e2e8f0', borderRadius:6, backgroundColor:'#f8fafc' }}>
                    <Folder size={14} color="#64748b" style={{ position:'absolute', left:12 }} />
                    <select value={docDirectory} onChange={e => setDocDirectory(e.target.value)} style={{ width:'100%', appearance:'none', border:'none', backgroundColor:'transparent', padding:'8px 32px', fontSize:13, color:'#334155', outline:'none', cursor:'pointer' }}>
                      {treeFolders.map(folder => (
                        <option key={folder.id} value={folder.id}>{folder.title}</option>
                      ))}
                      <option value="root">根目录 (Root)</option>
                    </select>
                    <ChevronDown size={14} color="#94a3b8" style={{ position:'absolute', right:12, pointerEvents:'none' }} />
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom:8, fontSize:12, fontWeight:500, color:'#475569' }}>FRONTMATTER 元数据预设</div>
                  <div style={{ display:'flex', alignItems:'center', position:'relative', border:'1px solid #e2e8f0', borderRadius:6, backgroundColor:'#f8fafc' }}>
                    <select value={frontmatter} onChange={e => setFrontmatter(e.target.value)} style={{ width:'100%', appearance:'none', border:'none', backgroundColor:'transparent', padding:'8px 32px 8px 12px', fontSize:13, color:'#334155', outline:'none', cursor:'pointer' }}>
                      <option value="standard">标准工程 YAML (Title, Status, Tags, Author)</option>
                      <option value="minimal">极简 YAML (Title, Date)</option>
                      <option value="none">不启用 Frontmatter</option>
                    </select>
                    <ChevronDown size={14} color="#94a3b8" style={{ position:'absolute', right:12, pointerEvents:'none' }} />
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:12, fontWeight:500, color:'#475569' }}>
                  <span>选择模板预设 (TEMPLATE PRESETS)</span><span style={{ color:'#3b82f6', cursor:'pointer' }}>管理团队模板库</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  {[
                    { id: 'blank', title: '空白文档 (Blank)', desc: '纯净起步，自由编写标准 Markdown', Icon: FileText },
                    { id: 'adr', title: 'ADR 架构决策记录', desc: '含决策背景、多方案比对矩阵与落地清单', Icon: CheckCircle, tag: '推荐' },
                    { id: 'rfc', title: 'RFC 技术方案规范', desc: '规范征询提案、API变更及灰度放量计划', Icon: Share },
                    { id: 'api', title: 'API 接口设计定义', desc: 'OpenAPI / REST 协议格式及 cURL 用例', Icon: AlignLeft }
                  ].map(tpl => {
                    const isActive = templateId === tpl.id;
                    return (
                      <div key={tpl.id} onClick={() => setTemplateId(tpl.id)} style={{ border: isActive ? '1px solid #3b82f6' : '1px solid #e2e8f0', backgroundColor: isActive ? '#eff6ff' : '#fff', borderRadius:8, padding:12, position:'relative', cursor:'pointer' }}>
                        {isActive && <div style={{ position:'absolute', top:10, right:10 }}><CheckCircle size={16} color="#3b82f6" /></div>}
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                          <tpl.Icon size={14} color={isActive ? '#3b82f6' : '#64748b'} />
                          <span style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{tpl.title}</span>
                          {tpl.tag && <span style={{ fontSize:10, color:'#fff', backgroundColor:'#3b82f6', padding:'2px 4px', borderRadius:4, transform:'scale(0.9)' }}>{tpl.tag}</span>}
                        </div>
                        <div style={{ fontSize:11, color:'#64748b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', paddingRight: isActive ? 20 : 0 }}>{tpl.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display:'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={enableAi} onChange={e => setEnableAi(e.target.checked)} style={{ accentColor:'#a855f7', width:14, height:14, cursor:'pointer' }} />
                    <Sparkles size={14} color={enableAi ? "#a855f7" : "#94a3b8"} /><span style={{ fontSize:13, fontWeight:600, color: enableAi ? '#0f172a' : '#64748b' }}>启用 AI 智能生成框架大纲 (AI Outline Scaffolding)</span>
                  </div>
                  {enableAi && <span style={{ fontSize:10, color:'#fff', backgroundColor:'#a855f7', padding:'2px 6px', borderRadius:4 }}>Claude 3.5</span>}
                </div>
                <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} disabled={!enableAi} placeholder="请输入大纲生成提示词..." style={{ width:'100%', border: enableAi ? '1px solid #e9d5ff' : '1px solid #e2e8f0', backgroundColor: enableAi ? '#fff' : '#f1f5f9', borderRadius:6, padding:'8px 12px', fontSize:12, color:'#475569', outline:'none', cursor: enableAi ? 'text' : 'not-allowed' }} />
              </div>
            </div>

            {/* 弹窗 Footer */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', backgroundColor:'#f8fafc', borderTop:'1px solid #e2e8f0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#64748b' }}>
                <Folder size={14} color="#eab308" style={{ flexShrink: 0 }} />
                <span style={{ maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`/${treeFolders.find(f => f.id === docDirectory)?.title || '根目录 (Root)'}/${docTitle || '无标题文档'}`}>
                  保存至: /{treeFolders.find(f => f.id === docDirectory)?.title || '根目录 (Root)'}/{docTitle || '无标题文档'}
                </span>
              </div>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <button onClick={() => !isCreating && setIsCreateModalOpen(false)} style={{ border:'none', backgroundColor:'transparent', fontSize:13, color:'#64748b', cursor: isCreating ? 'not-allowed' : 'pointer', opacity: isCreating ? 0.6 : 1 }}>取消 (Esc)</button>
                <button onClick={handleConfirmCreate} disabled={isCreating} style={{ border:'none', backgroundColor:'#3b82f6', color:'#fff', fontSize:13, fontWeight:500, borderRadius:6, padding:'8px 16px', display:'flex', alignItems:'center', gap:6, cursor: isCreating ? 'wait' : 'pointer', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', opacity: isCreating ? 0.7 : 1 }}>
                  {isCreating ? <Sparkles size={14} className="animate-spin" /> : <Plus size={14} />} 
                  {isCreating ? '创建中...' : '立即创建 (Enter ↵)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 分享文档弹窗 (浮层) */}
      {shareModal.isOpen && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(15,23,42,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ backgroundColor:'#fff', borderRadius:'12px', width:'90%', maxWidth:'420px', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {/* 弹窗 Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #e2e8f0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:32, height:32, backgroundColor: shareModal.type === 'error' ? '#fef2f2' : '#eff6ff', color: shareModal.type === 'error' ? '#ef4444' : '#3b82f6', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Share size={18} />
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:600, color:'#0f172a' }}>{shareModal.type === 'error' ? '提示' : '文档分享'}</div>
                </div>
              </div>
              <X size={18} color="#94a3b8" style={{ cursor:'pointer' }} onClick={() => setShareModal({ ...shareModal, isOpen: false })} />
            </div>

            {/* 弹窗 Body */}
            <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'16px' }}>
              <div style={{ fontSize:14, color:'#334155' }}>{shareModal.message}</div>
              {shareModal.link && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={shareModal.link} 
                    style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:6, padding:'8px 12px', fontSize:13, color:'#0f172a', backgroundColor:'#f8fafc', outline:'none' }} 
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(shareModal.link);
                      setCopyText('已复制');
                      setTimeout(() => setCopyText('复制'), 2000);
                    }} 
                    style={{ border:'none', backgroundColor: copyText === '已复制' ? '#10b981' : '#3b82f6', color:'#fff', borderRadius:6, padding:'8px 16px', fontSize:13, cursor:'pointer', transition: 'background-color 0.2s' }}
                  >
                    {copyText}
                  </button>
                </div>
              )}
            </div>

            {/* 弹窗 Footer */}
            <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', padding:'14px 20px', backgroundColor:'#f8fafc', borderTop:'1px solid #e2e8f0' }}>
              <button onClick={() => setShareModal({ ...shareModal, isOpen: false })} style={{ border:'none', backgroundColor:'#3b82f6', color:'#fff', fontSize:13, fontWeight:500, borderRadius:6, padding:'8px 24px', cursor:'pointer' }}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
