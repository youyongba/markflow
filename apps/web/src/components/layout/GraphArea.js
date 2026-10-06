import React from 'react';
import { 
  GitGraph, Search, SlidersHorizontal, Network, GitMerge, Settings, 
  Maximize, Minimize, Plus, Minus, Focus, Map, Clock, User, 
  FileText, CornerDownRight, CornerUpLeft, ArrowRight
} from 'lucide-react';
import styles from '../../pages/index.module.css';

export const GraphArea = () => {
  return (
    <div style={{ flex: 1, backgroundColor: '#1e293b', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      
      {/* 顶部控制栏 (悬浮) */}
      <div style={{ 
        position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
        borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#3b82f6', color: 'white', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <GitGraph size={14} /> 全部节点 <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 12, fontSize: 11 }}>68</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 13, color: '#475569', cursor: 'pointer', backgroundColor: '#f1f5f9' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }}></div> 评审中文档 <span style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: 12, fontSize: 11 }}>14</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 13, color: '#475569', cursor: 'pointer', backgroundColor: '#f1f5f9' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6' }}></div> 核心架构 <span style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: 12, fontSize: 11 }}>22</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 13, color: '#6366f1', cursor: 'pointer', backgroundColor: '#e0e7ff', fontWeight: 500 }}>
            <ArrowRight size={14} /> 仅双向引用
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: 6 }}>
            <Search size={14} color="#64748b" />
            <input type="text" placeholder="搜索节点..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, width: 120 }} />
            <SlidersHorizontal size={14} color="#64748b" style={{ cursor: 'pointer' }} />
          </div>
          <div style={{ width: 1, height: 16, backgroundColor: '#e2e8f0' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#475569' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#3b82f6', fontWeight: 500 }}><Network size={14} /> 力导向</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><GitMerge size={14} /> 层次树</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><Settings size={14} /> 环形</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><GitGraph size={14} /> 物理模拟: 开</span>
          </div>
          <div style={{ width: 1, height: 16, backgroundColor: '#e2e8f0' }}></div>
          <Maximize size={16} color="#475569" style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {/* 模拟画布背景 */}
      <div style={{ 
        position: 'absolute', inset: 0, 
        backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.5
      }}></div>

      {/* 居中的核心节点 (ADR-004) */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ 
          width: 64, height: 64, borderRadius: '50%', backgroundColor: '#1e293b', border: '3px solid #3b82f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2), 0 10px 15px -3px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#60a5fa' }}></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: 14, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>ADR-004: 存储选型架构</div>
          <div style={{ color: '#94a3b8', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span style={{ color: '#fcd34d' }}>★ ROOT HUB</span> · 24 关联分支
          </div>
        </div>
      </div>

      {/* 关联节点 1: RFC-102 (评审中) */}
      <div style={{ position: 'absolute', top: '30%', left: '65%', transform: 'translate(-50%, -50%)', zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ 
          width: 48, height: 48, borderRadius: '50%', backgroundColor: '#1e293b', border: '2px dashed #f59e0b',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fbbf24' }}></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 13 }}>RFC-102: 元数据同步</div>
          <div style={{ color: '#f59e0b', fontSize: 11 }}>● 评审中 (In-Review)</div>
        </div>
      </div>
      
      {/* 关联节点 2: SEC-008 (定稿) */}
      <div style={{ position: 'absolute', top: '65%', left: '70%', transform: 'translate(-50%, -50%)', zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ 
          width: 48, height: 48, borderRadius: '50%', backgroundColor: '#1e293b', border: '2px solid #3b82f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#60a5fa' }}></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 13 }}>SEC-008: 认证与 RBAC</div>
          <div style={{ color: '#10b981', fontSize: 11 }}>● 定稿 (Final)</div>
        </div>
      </div>

      {/* 关联节点 3: API-024 (定稿) */}
      <div style={{ position: 'absolute', top: '65%', left: '30%', transform: 'translate(-50%, -50%)', zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ 
          width: 48, height: 48, borderRadius: '50%', backgroundColor: '#1e293b', border: '2px solid #3b82f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#60a5fa' }}></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 13 }}>API-024: REST 规范</div>
          <div style={{ color: '#10b981', fontSize: 11 }}>● 定稿 (Final)</div>
        </div>
      </div>

      {/* 模拟连线 */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
          <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#818cf8" />
          </marker>
        </defs>
        
        {/* 到 RFC-102 (虚线，双向引用) */}
        <line x1="50%" y1="50%" x2="65%" y2="30%" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />
        
        {/* 到 SEC-008 (实线，强依赖) */}
        <line x1="50%" y1="50%" x2="70%" y2="65%" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
        
        {/* 到 API-024 (高亮实线) */}
        <line x1="50%" y1="50%" x2="30%" y2="65%" stroke="#818cf8" strokeWidth="2" markerEnd="url(#arrowhead-active)" />
      </svg>

      {/* 悬浮弹窗 (Tooltip) - 定位在中心节点上方 */}
      <div style={{ 
        position: 'absolute', top: '35%', left: '42%', transform: 'translate(-50%, -100%)', zIndex: 20,
        backgroundColor: 'white', borderRadius: 12, width: 320, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>
              <FileText size={18} color="#3b82f6" /> ADR-004-存储选型.md
            </div>
            <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>评审中</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={14} /> Alex Chen</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> 3天前更新</span>
          </div>
        </div>
        
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><CornerDownRight size={12} color="#3b82f6" /> 入度引用</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>5 <span style={{ fontSize: 12, fontWeight: 'normal', color: '#64748b' }}>篇文档</span></div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><CornerUpLeft size={12} color="#8b5cf6" /> 前置依赖</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>2 <span style={{ fontSize: 12, fontWeight: 'normal', color: '#64748b' }}>项架构</span></div>
          </div>
        </div>

        <div style={{ padding: '0 20px', fontSize: 13, color: '#475569', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {"评估 MinIO 与 Ceph 在多租户与私有化交付环境下的吞吐表现、元数据瓶颈及跨地域高可用容灾拓扑..."}
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}><Network size={14} /> 关键路径节点</div>
          <div style={{ backgroundColor: '#1e293b', color: 'white', fontSize: 13, padding: '6px 16px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            进入文档 <CornerDownRight size={14} />
          </div>
        </div>
      </div>

      {/* 左下角图例 (Legend) */}
      <div style={{ 
        position: 'absolute', bottom: 16, left: 16, zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
        borderRadius: 8, padding: 16, width: 260,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Map size={16} /> 图谱图例 (LEGEND)</span>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 'normal' }}>24/68 显示中</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 8px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6' }}></div> 定稿 (Final)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }}></div> 评审中 (In-Review)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#8b4513' }}></div> 草稿 (Draft)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#cbd5e1' }}></div> 归档 (Archived)
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 24, height: 2, backgroundColor: '#3b82f6' }}></div> 强依赖</div>
            <span style={{ color: '#64748b' }}>depends_on</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 24, height: 2, borderBottom: '2px dashed #64748b' }}></div> 双向链接引用</div>
            <span style={{ color: '#64748b' }}>[[WikiLink]]</span>
          </div>
        </div>
      </div>

      {/* 右下角工具组 */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
        
        {/* 关联深度滑块 */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}><Network size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} /> 关联深度</span>
          <div style={{ width: 100, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', backgroundColor: '#3b82f6', borderRadius: 2 }}></div>
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 12, height: 12, borderRadius: '50%', backgroundColor: 'white', border: '2px solid #3b82f6', cursor: 'pointer' }}></div>
          </div>
          <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 500 }}>2层</span>
        </div>

        {/* 缩放控制器 */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 8, display: 'flex', alignItems: 'center', padding: 4, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ padding: 6, cursor: 'pointer', color: '#475569' }}><Plus size={16} /></div>
          <div style={{ width: 1, height: 16, backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>
          <div style={{ padding: 6, cursor: 'pointer', color: '#475569' }}><Minus size={16} /></div>
          <div style={{ width: 1, height: 16, backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>
          <div style={{ padding: 6, cursor: 'pointer', color: '#475569' }}><Focus size={16} /></div>
          <div style={{ width: 1, height: 16, backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>
          <div style={{ padding: 6, cursor: 'pointer', color: '#3b82f6' }}><Map size={16} /></div>
        </div>

        {/* 鹰眼概览 (Minimap) */}
        <div style={{ 
          width: 180, height: 120, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 8, 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: 8, position: 'relative'
        }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: '#1e293b', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '30%', left: '40%', width: 4, height: 4, borderRadius: '50%', backgroundColor: '#8b5cf6' }}></div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
            <div style={{ position: 'absolute', top: '40%', left: '70%', width: 4, height: 4, borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
            <div style={{ position: 'absolute', top: '70%', left: '40%', width: 4, height: 4, borderRadius: '50%', backgroundColor: '#94a3b8' }}></div>
            <div style={{ position: 'absolute', top: '70%', left: '70%', width: 4, height: 4, borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
            
            {/* 当前视口框 */}
            <div style={{ position: 'absolute', top: '20%', left: '30%', width: '60%', height: '60%', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 2 }}></div>
          </div>
          <div style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 10, color: '#e2e8f0', backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4 }}>鹰眼概览</div>
        </div>

      </div>
    </div>
  );
};