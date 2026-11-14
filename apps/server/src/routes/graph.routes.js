const { Router } = require('express');
const { getDb } = require('../config/database');

const router = Router();

router.get('/data', async (req, res) => {
  try {
    const db = await getDb();
    
    // 获取所有文档节点
    const nodesData = await db.all('SELECT * FROM tree_nodes WHERE node_type = "document"');
    
    // 获取所有依赖关系
    const edgesData = await db.all('SELECT * FROM document_dependencies');
    
    // 构建图谱数据
    const nodes = nodesData.map((node, index) => ({
      id: String(node.id),
      type: "customNode",
      // 简单算法分布节点，实际应由前端使用布局算法计算，或在此处实现更复杂的布局
      position: { x: 200 + (index % 5) * 250, y: 150 + Math.floor(index / 5) * 150 },
      data: {
        label: node.title,
        status: node.status || "draft",
        tags: [], // 如果需要，可以关联 document_tags 补全
        author: "System",
        updatedAt: node.updated_at,
        inDegree: edgesData.filter(e => e.target_id === node.id).length,
        outDegree: edgesData.filter(e => e.source_id === node.id).length,
        summary: "..."
      }
    }));

    const edges = edgesData.map(edge => ({
      id: `e-${edge.source_id}-${edge.target_id}`,
      source: String(edge.source_id),
      target: String(edge.target_id),
      animated: true,
      style: { stroke: "#64748b", strokeWidth: 1.5, strokeDasharray: "4,4" }
    }));

    res.json({
      code: 200,
      data: {
        nodes,
        edges
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

module.exports = router;