import React, { useEffect, useState } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  GitGraph, Search, SlidersHorizontal, Network, GitMerge, Settings, 
  Maximize, Map, Clock, User, FileText, CornerDownRight, CornerUpLeft, ArrowRight
} from 'lucide-react';
import { fetchGraphData } from '../../services/api/graph';
import styles from '../../pages/index.module.css';

// 自定义节点组件，完全还原视觉稿的高保真 UI 及悬浮交互
const CustomNode = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isRoot = data.status === 'root';
  const isReview = data.status === 'review';
  const isFinal = data.status === 'final';

  let borderColor = '#3b82f6';
  let bgColor = '#60a5fa';
  let borderStyle = 'solid';

  if (isRoot) {
    borderColor = '#3b82f6';
    bgColor = '#60a5fa';
  } else if (isReview) {
    borderColor = '#f59e0b';
    bgColor = '#fbbf24';
    borderStyle = 'dashed';
  } else if (isFinal) {
    borderColor = '#3b82f6';
    bgColor = '#60a5fa';
  }

  return (
    <div 
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#555', opacity: 0 }} />
      <div style={{ cursor: 'pointer', position: 'relative' }}>
        <div style={{ 
          width: isRoot ? 64 : 48, 
          height: isRoot ? 64 : 48, 
          borderRadius: '50%', 
          backgroundColor: '#1e293b', 
          border: `${isRoot ? '3px' : '2px'} ${borderStyle} ${borderColor}`,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          boxShadow: isRoot ? '0 0 0 4px rgba(59, 130, 246, 0.2), 0 10px 15px -3px rgba(0, 0, 0, 0.3)' : 'none',
          transition: 'all 0.2s'
        }}>
          <div style={{ 
            width: isRoot ? 32 : 20, 
            height: isRoot ? 32 : 20, 
            borderRadius: '50%', 
            backgroundColor: bgColor 
          }}></div>
        </div>
        
        {/* 中心节点的 Hover Tooltip */}
        {isRoot && data.summary && isHovered && (
          <div style={{ 
            position: 'absolute', bottom: '100%', left: '50%', transform: 'translate(-50%, -16px)', zIndex: 50,
            backgroundColor: 'white', borderRadius: 12, width: 320, 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            pointerEvents: 'none', cursor: 'default', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>
                  <FileText size={18} color="#3b82f6" /> {data.label}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={14} /> {data.author}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {data.updatedAt}</span>
              </div>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><CornerDownRight size={12} color="#3b82f6" /> 入度引用</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>{data.inDegree} <span style={{ fontSize: 12, fontWeight: 'normal', color: '#64748b' }}>篇</span></div>
              </div>
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><CornerUpLeft size={12} color="#8b5cf6" /> 前置依赖</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>{data.outDegree} <span style={{ fontSize: 12, fontWeight: 'normal', color: '#64748b' }}>项</span></div>
              </div>
            </div>
            <div style={{ padding: '0 20px 16px', fontSize: 13, color: '#475569', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {data.summary}
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          color: isRoot ? 'white' : '#e2e8f0', 
          fontWeight: isRoot ? 'bold' : 500, 
          fontSize: isRoot ? 14 : 13, 
          textShadow: isRoot ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
          whiteSpace: 'nowrap'
        }}>
          {data.label}
        </div>
        {isRoot ? (
          <div style={{ color: '#94a3b8', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
            <span style={{ color: '#fcd34d' }}>{data.tags?.[0]}</span> · {data.tags?.[1]}
          </div>
        ) : (
          <div style={{ color: isReview ? '#f59e0b' : '#10b981', fontSize: 11, marginTop: 4 }}>
            {isReview ? '● 评审中' : '● 定稿'}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555', opacity: 0 }} />
    </div>
  );
};

const nodeTypes = {
  customNode: CustomNode,
};

export const GraphArea = () => {
  const [originalNodes, setOriginalNodes] = useState([]);
  const [originalEdges, setOriginalEdges] = useState([]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'review', 'core'
  const [onlyBidirectional, setOnlyBidirectional] = useState(false);
  const [layoutMode, setLayoutMode] = useState('force'); // 'force', 'tree', 'circle'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 初次加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchGraphData();
        if (res.code === 200) {
          // 保存初始位置，用于力导向模式恢复
          const loadedNodes = (res.data.nodes || []).map(n => ({ ...n, originalPosition: n.position }));
          setOriginalNodes(loadedNodes);
          setOriginalEdges(res.data.edges || []);
        }
      } catch (err) {
        console.error("Failed to load graph data", err);
      }
    };
    loadData();
  }, []);

  // 监听过滤与布局状态变化，重新计算图谱
  useEffect(() => {
    if (!originalNodes.length) return;

    // 1. 过滤节点
    let filteredNodes = originalNodes.map(n => ({ ...n }));
    if (activeFilter === 'review') {
      filteredNodes = filteredNodes.map(n => ({ ...n, hidden: n.data.status !== 'review' && n.data.status !== 'root' }));
    } else if (activeFilter === 'core') {
      filteredNodes = filteredNodes.map(n => ({ ...n, hidden: n.data.status !== 'root' && n.data.status !== 'final' }));
    } else {
      filteredNodes = filteredNodes.map(n => ({ ...n, hidden: false }));
    }

    // 2. 过滤边 (仅双向引用)
    let filteredEdges = originalEdges.map(e => ({ ...e }));
    if (onlyBidirectional) {
      // 模拟双向引用特征：虚线或特定属性
      filteredEdges = filteredEdges.map(e => ({ ...e, hidden: !e.style?.strokeDasharray }));
    } else {
      filteredEdges = filteredEdges.map(e => ({ ...e, hidden: false }));
    }

    // 3. 级联隐藏：如果节点被隐藏，其关联的边也隐藏
    const hiddenNodeIds = new Set(filteredNodes.filter(n => n.hidden).map(n => n.id));
    filteredEdges = filteredEdges.map(e => ({
      ...e,
      hidden: e.hidden || hiddenNodeIds.has(e.source) || hiddenNodeIds.has(e.target)
    }));

    // 4. 计算布局
    const visibleNodes = filteredNodes.filter(n => !n.hidden);
    if (layoutMode === 'tree') {
      const roots = visibleNodes.filter(n => n.data.status === 'root');
      const others = visibleNodes.filter(n => n.data.status !== 'root');
      
      roots.forEach((root, i) => {
        root.position = { x: 400 + i * 200, y: 100 };
      });
      const spacing = 200;
      const startX = 400 - ((others.length - 1) * spacing) / 2;
      others.forEach((n, i) => {
        n.position = { x: startX + i * spacing, y: 300 };
      });
    } else if (layoutMode === 'circle') {
      const centerX = 400;
      const centerY = 300;
      const radius = 180;
      visibleNodes.forEach((n, i) => {
        const angle = (i / visibleNodes.length) * 2 * Math.PI;
        n.position = {
          x: centerX + radius * Math.cos(angle) - 24,
          y: centerY + radius * Math.sin(angle) - 24
        };
      });
    } else {
      // force 模式：恢复初始排版
      visibleNodes.forEach(n => {
        n.position = n.originalPosition || n.position;
      });
    }

    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [activeFilter, onlyBidirectional, layoutMode, originalNodes, originalEdges, setNodes, setEdges]);

  return (
    <div style={{ flex: 1, backgroundColor: '#1e293b', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      
      {/* 顶部控制栏 */}
      <div style={{ 
        position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
        borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div 
            onClick={() => setActiveFilter('all')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: activeFilter === 'all' ? '#3b82f6' : '#f1f5f9', color: activeFilter === 'all' ? 'white' : '#475569', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <GitGraph size={14} /> 全部节点 <span style={{ backgroundColor: activeFilter === 'all' ? 'rgba(255,255,255,0.2)' : '#e2e8f0', padding: '2px 6px', borderRadius: 12, fontSize: 11 }}>68</span>
          </div>
          <div 
            onClick={() => setActiveFilter('review')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 13, color: activeFilter === 'review' ? 'white' : '#475569', cursor: 'pointer', backgroundColor: activeFilter === 'review' ? '#3b82f6' : '#f1f5f9', transition: 'all 0.2s' }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }}></div> 评审中 <span style={{ backgroundColor: activeFilter === 'review' ? 'rgba(255,255,255,0.2)' : '#e2e8f0', padding: '2px 6px', borderRadius: 12, fontSize: 11 }}>14</span>
          </div>
          <div 
            onClick={() => setActiveFilter('core')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 13, color: activeFilter === 'core' ? 'white' : '#475569', cursor: 'pointer', backgroundColor: activeFilter === 'core' ? '#3b82f6' : '#f1f5f9', transition: 'all 0.2s' }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6' }}></div> 核心架构 <span style={{ backgroundColor: activeFilter === 'core' ? 'rgba(255,255,255,0.2)' : '#e2e8f0', padding: '2px 6px', borderRadius: 12, fontSize: 11 }}>22</span>
          </div>
          <div 
            onClick={() => setOnlyBidirectional(!onlyBidirectional)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 13, color: onlyBidirectional ? 'white' : '#6366f1', cursor: 'pointer', backgroundColor: onlyBidirectional ? '#6366f1' : '#e0e7ff', fontWeight: 500, transition: 'all 0.2s' }}
          >
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
            <span onClick={() => setLayoutMode('force')} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: layoutMode === 'force' ? '#3b82f6' : '#475569', fontWeight: layoutMode === 'force' ? 500 : 'normal' }}><Network size={14} /> 力导向</span>
            <span onClick={() => setLayoutMode('tree')} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: layoutMode === 'tree' ? '#3b82f6' : '#475569', fontWeight: layoutMode === 'tree' ? 500 : 'normal' }}><GitMerge size={14} /> 层次树</span>
            <span onClick={() => setLayoutMode('circle')} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: layoutMode === 'circle' ? '#3b82f6' : '#475569', fontWeight: layoutMode === 'circle' ? 500 : 'normal' }}><Settings size={14} /> 环形</span>
          </div>
          <div style={{ width: 1, height: 16, backgroundColor: '#e2e8f0' }}></div>
          <Maximize 
            size={16} 
            color={isFullscreen ? "#3b82f6" : "#475569"} 
            style={{ cursor: 'pointer' }} 
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              // 这里可以扩展真实的浏览器全屏 API 调用
              if (!isFullscreen && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else if (isFullscreen && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
              }
            }} 
          />
        </div>
      </div>

      {/* React Flow 动态画布区 */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={4}
        defaultEdgeOptions={{
          type: 'default',
          animated: true,
        }}
      >
        <Background color="#94a3b8" gap={24} size={2} style={{ backgroundColor: '#1e293b' }} />
        <Controls style={{ bottom: 16, right: 16, position: 'absolute' }} />
        <MiniMap 
          nodeColor={(n) => {
            if (n.data?.status === 'root') return '#3b82f6';
            if (n.data?.status === 'review') return '#f59e0b';
            return '#10b981';
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: 8, 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            bottom: 64,
            right: 16,
            position: 'absolute'
          }}
        />
      </ReactFlow>

      {/* 左下角图例 */}
      <div style={{ 
        position: 'absolute', bottom: 16, left: 16, zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
        borderRadius: 8, padding: 16, width: 260,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        pointerEvents: 'none'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Map size={16} /> 图谱图例 (LEGEND)</span>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 'normal' }}>4/68 显示中</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 8px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6' }}></div> 定稿 (Final)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }}></div> 评审中 (In-Review)
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 24, height: 2, backgroundColor: '#3b82f6' }}></div> 强依赖</div>
            <span style={{ color: '#64748b' }}>depends_on</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 24, height: 2, borderBottom: '2px dashed #64748b' }}></div> 双向引用</div>
            <span style={{ color: '#64748b' }}>[[WikiLink]]</span>
          </div>
        </div>
      </div>
    </div>
  );
};