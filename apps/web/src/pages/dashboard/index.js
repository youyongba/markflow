import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setProjects, setSearchQuery, addProject, updateProject, deleteProject } from '../../store/actions/dashboard';

// 定义可选的图标列表
const ICONS = [
  { id: 'api', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path> },
  { id: 'database', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path> },
  { id: 'cart', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path> },
  { id: 'bank', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path> },
  { id: 'chart', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path> },
  { id: 'rocket', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path> },
  { id: 'upload', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path> },
];

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    env: 'development',
    prefix: '/api/v1'
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    iconId: 'api'
  });
  const { projects, searchQuery } = useAppSelector((state) => state.dashboard);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (projects.length === 0) {
      dispatch(setProjects([
        { id: '1', name: '电商接口 v2', desc: '包含商品目录、用户认证流程等的核心商店 API...', apiCount: 12, updatedAt: '3 分钟前', iconColor: '#e0f2fe', iconText: '#0284c7' },
        { id: '2', name: 'CRM 模拟服务', desc: '用于线索生成和客户成功的内部 CRM 工具模拟端点...', apiCount: 8, updatedAt: '45 分钟前', iconColor: '#dcfce7', iconText: '#16a34a' }
      ]));
    }
  }, [dispatch, projects.length]);

  const filteredProjects = projects.filter(p => p.name.includes(searchQuery || ''));

  const handleCreateProject = () => {
    if (!formData.name.trim()) return alert('请输入项目名称');
    
    const newProject = {
      id: Date.now().toString(),
      name: formData.name,
      desc: formData.description || '暂无描述',
      apiCount: 0,
      updatedAt: '刚刚',
      iconColor: '#f3e8ff', // 随机一种黄色底
      iconText: '#d97706'
    };
    
    dispatch(addProject(newProject));
    setIsModalOpen(false);
    setFormData({ name: '', description: '', env: 'development', prefix: '/api/v1' });
  };

  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setEditFormData({
      name: project.name,
      description: project.desc,
      iconId: project.iconId || 'api'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = () => {
    if (!editFormData.name.trim()) return alert('请输入项目名称');
    
    dispatch(updateProject({
      ...editingProject,
      name: editFormData.name,
      desc: editFormData.description,
      iconId: editFormData.iconId,
      updatedAt: '刚刚'
    }));
    
    setIsEditModalOpen(false);
    setEditingProject(null);
  };

  const handleOpenDelete = (project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProject = () => {
    if (projectToDelete) {
      dispatch(deleteProject(projectToDelete.id));
    }
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  };

  const renderIcon = (iconId) => {
    const icon = ICONS.find(i => i.id === iconId) || ICONS[0];
    return <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon.svg}</svg>;
  };

  return (
    <div className="layout">
      <Head>
        <title>My App Dashboard</title>
      </Head>
      
      <header className="header">
        <div className="logo">My App Dashboard</div>
        <div className="header-right">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <div className="avatar">{user ? user.name.charAt(0).toUpperCase() : 'UA'}</div>
            <span>{user ? user.name : '用户#a3f2'}</span>
          </div>
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          <div className="side-title">
            <h2>My App Dashboard</h2>
            <p>开发者工作空间</p>
          </div>
          <nav>
            <div className="nav-item active">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
              我的项目
            </div>
            <div className="nav-item">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              请求日志
            </div>
          </nav>
        </aside>

        <main className="main">
          <div className="main-header">
            <h1>我的项目</h1>
            <div className="actions">
              <div className="search-wrapper">
                <svg className="search-icon" width="16" height="16" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input 
                  type="text" 
                  className="search" 
                  placeholder="搜索项目..." 
                  value={searchQuery}
                  onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                />
              </div>
              <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ 新建项目</button>
            </div>
          </div>

          <div className="grid">
            {filteredProjects.map(project => (
              <div key={project.id} className="card" onClick={() => window.location.href = `/dashboard/${project.id}`} style={{cursor: 'pointer'}}>
                <div className="card-header">
                  <div className="card-icon" style={{backgroundColor: project.iconColor, color: project.iconText}}>
                    {renderIcon(project.iconId)}
                  </div>
                  <div className="card-actions" onClick={e => e.stopPropagation()}>
                    <button className="action-btn edit-btn" title="编辑项目" onClick={() => handleOpenEdit(project)}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button className="action-btn delete-btn" title="删除项目" onClick={() => handleOpenDelete(project)}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
                <h3>{project.name}</h3>
                <p>{project.desc}</p>
                <div className="card-footer">
                  <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                    {project.apiCount} 个接口
                  </span>
                  <span>{project.updatedAt}</span>
                </div>
              </div>
            ))}
            
            <div className="card card-empty">
              <div className="empty-icon">
                <svg width="24" height="24" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
              </div>
              <h3>暂无项目</h3>
              <p>准备好开始新的创作了吗?</p>
              <button className="btn-outline" onClick={() => setIsModalOpen(true)}>创建第一个项目</button>
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>新建项目</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>项目名称</label>
                <input type="text" placeholder="例如：计费系统模拟" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>描述 (可选)</label>
                <textarea placeholder="简要描述此项目的用途..." className="form-textarea" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="form-row">
                <div className="form-group half">
                  <label>环境</label>
                  <select className="form-select" value={formData.env} onChange={e => setFormData({...formData, env: e.target.value})}>
                    <option value="development">开发环境</option>
                    <option value="production">生产环境</option>
                  </select>
                </div>
                <div className="form-group half">
                  <label>前缀</label>
                  <input type="text" className="form-input" value={formData.prefix} onChange={e => setFormData({...formData, prefix: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>取消</button>
              <button className="btn-primary" onClick={handleCreateProject}>创建项目</button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑项目模态框 */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content edit-modal">
            <div className="modal-header">
              <h2>编辑项目</h2>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>项目名称</label>
                <input type="text" className="form-input" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea className="form-textarea" rows="4" value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})}></textarea>
              </div>
              <div className="form-group">
                <label>项目图标</label>
                <div className="icon-selector-container">
                  <div className="current-icon-preview" style={{backgroundColor: editingProject?.iconColor || '#e0f2fe', color: editingProject?.iconText || '#0284c7'}}>
                    {renderIcon(editFormData.iconId)}
                  </div>
                  <div className="icon-list-wrapper">
                    <span className="icon-hint">为您的项目选择一个代表性图标</span>
                    <div className="icon-list">
                      {ICONS.map(icon => (
                        <div 
                          key={icon.id} 
                          className={`icon-option ${editFormData.iconId === icon.id ? 'selected' : ''}`}
                          onClick={() => setEditFormData({...editFormData, iconId: icon.id})}
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon.svg}</svg>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>取消</button>
              <button className="btn-primary flex-center" onClick={handleUpdateProject}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{marginRight: '6px'}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除项目模态框 */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="delete-modal-body">
              <div className="delete-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <div className="delete-content">
                <h2>删除项目</h2>
                <p>确定要删除该项目吗？删除后将无法恢复。</p>
              </div>
            </div>
            <div className="delete-modal-footer">
              <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>取消</button>
              <button className="btn-danger" onClick={handleDeleteProject}>确定删除</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 8px; width: 480px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
        .modal-header { padding: 16px 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .modal-header h2 { margin: 0; font-size: 16px; color: #111827; }
        .close-btn { background: transparent; border: none; color: #9ca3af; cursor: pointer; padding: 4px; display: flex; border-radius: 4px; transition: background 0.2s; }
        .close-btn:hover { background: #f3f4f6; color: #4b5563; }
        .modal-body { padding: 24px; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500; color: #374151; }
        .form-input, .form-textarea, .form-select { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; font-family: inherit; transition: border-color 0.2s; }
        .form-input:focus, .form-textarea:focus, .form-select:focus { border-color: #0284c7; box-shadow: 0 0 0 1px #0284c7; }
        .form-textarea { resize: vertical; }
        .form-row { display: flex; gap: 16px; margin-bottom: 0; }
        .half { flex: 1; margin-bottom: 0; }
        .modal-footer { padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px; }
        .btn-cancel { background: transparent; border: none; color: #4b5563; font-size: 14px; cursor: pointer; padding: 8px 16px; border-radius: 6px; font-weight: 500; transition: background 0.2s; border: 1px solid #e5e7eb; }
        .btn-cancel:hover { background: #f3f4f6; }
        .layout { display: flex; flex-direction: column; min-height: 100vh; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .header { height: 56px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
        .logo { font-size: 18px; font-weight: bold; color: #0284c7; }
        .header-right { display: flex; align-items: center; gap: 16px; font-size: 14px; color: #374151; }
        .avatar { background: #0284c7; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
        .body { display: flex; flex: 1; }
        .sidebar { width: 240px; background: white; border-right: 1px solid #e5e7eb; padding: 24px 0; }
        .side-title { padding: 0 24px; margin-bottom: 24px; }
        .side-title h2 { margin: 0; font-size: 16px; color: #0284c7; }
        .side-title p { margin: 4px 0 0; font-size: 12px; color: #6b7280; }
        .nav-item { padding: 12px 24px; display: flex; align-items: center; gap: 12px; font-size: 14px; color: #4b5563; cursor: pointer; }
        .nav-item.active { color: #0284c7; font-weight: 500; background: #f0f9ff; border-right: 3px solid #0284c7; }
        .main { flex: 1; padding: 32px; }
        .main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .main-header h1 { margin: 0; font-size: 20px; color: #111827; }
        .actions { display: flex; gap: 16px; }
        .search-wrapper { position: relative; display: flex; align-items: center; }
        .search-icon { position: absolute; left: 12px; }
        .search { padding: 8px 12px 8px 36px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; width: 240px; outline: none; }
        .search:focus { border-color: #0284c7; box-shadow: 0 0 0 1px #0284c7; }
        .btn-primary { background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
        .card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; transition: box-shadow 0.2s; position: relative; }
        .card:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .card-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .card-actions { display: flex; gap: 8px; opacity: 0; transition: opacity 0.2s; }
        .card:hover .card-actions { opacity: 1; }
        .action-btn { background: transparent; border: 1px solid transparent; padding: 6px; border-radius: 4px; cursor: pointer; color: #9ca3af; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .action-btn:hover { background: #f3f4f6; color: #4b5563; }
        .edit-btn:hover { color: #0284c7; }
        .delete-btn:hover { color: #dc2626; }
        .card h3 { margin: 0 0 8px; font-size: 16px; color: #111827; }
        .card p { margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5; height: 40px; overflow: hidden; }
        .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
        .card-empty { border: 1px dashed #d1d5db; background: #f9fafb; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .empty-icon { width: 48px; height: 48px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .card-empty h3 { margin: 0 0 8px; color: #111827; }
        .card-empty p { margin: 0 0 16px; font-size: 13px; color: #6b7280; }
        .btn-outline { border: 1px solid #0284c7; color: #0284c7; background: transparent; padding: 6px 12px; border-radius: 4px; font-size: 13px; cursor: pointer; }
        .flex-center { display: flex; align-items: center; justify-content: center; }
        .edit-modal { width: 520px; }
        .icon-selector-container { display: flex; gap: 16px; align-items: flex-start; }
        .current-icon-preview { width: 64px; height: 64px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .current-icon-preview svg { width: 32px; height: 32px; }
        .icon-list-wrapper { flex: 1; }
        .icon-hint { display: block; font-size: 12px; color: #6b7280; margin-bottom: 12px; }
        .icon-list { display: flex; gap: 8px; flex-wrap: wrap; }
        .icon-option { width: 36px; height: 36px; border: 1px solid #e5e7eb; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6b7280; transition: all 0.2s; }
        .icon-option:hover { border-color: #9ca3af; background: #f9fafb; }
        .icon-option.selected { border-color: #0284c7; background: #f0f9ff; color: #0284c7; }
        .delete-modal { width: 400px; padding: 24px; border-radius: 12px; }
        .delete-modal-body { display: flex; gap: 16px; margin-bottom: 24px; align-items: flex-start; }
        .delete-icon { width: 40px; height: 40px; border-radius: 8px; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .delete-content h2 { margin: 0 0 8px; font-size: 18px; color: #111827; }
        .delete-content p { margin: 0; font-size: 14px; color: #4b5563; }
        .delete-modal-footer { display: flex; justify-content: flex-end; gap: 12px; }
        .btn-danger { background: #b91c1c; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
        .btn-danger:hover { background: #991b1b; }
      `}</style>
    </div>
  );
}
