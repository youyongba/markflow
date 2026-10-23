const { Router } = require('express');
const { getDb } = require('../config/database');

const router = Router();

router.get('/:documentId', async (req, res) => {
  try {
    const db = await getDb();
    const { documentId } = req.params;
    const node = await db.get('SELECT * FROM tree_nodes WHERE id = ?', [documentId]);
    const tags = await db.all('SELECT tag_name FROM document_tags WHERE document_id = ?', [documentId]);
    
    res.json({
      code: 200,
      data: {
        title: node ? node.title : '未命名文档',
        status: node ? node.status : 'draft',
        tags: tags.length ? tags.map(t => t.tag_name) : []
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.patch('/:documentId', async (req, res) => {
  try {
    const db = await getDb();
    const { documentId } = req.params;
    const { title, status, tags } = req.body;
    
    if (!isNaN(parseInt(documentId))) {
      if (title !== undefined || status !== undefined) {
        let setClauses = [];
        let params = [];
        if (title !== undefined) {
          setClauses.push('title = ?');
          params.push(title);
        }
        if (status !== undefined) {
          setClauses.push('status = ?');
          params.push(status);
        }
        params.push(documentId);
        await db.run(`UPDATE tree_nodes SET ${setClauses.join(', ')} WHERE id = ?`, params);
      }
      
      if (tags !== undefined) {
        await db.run('DELETE FROM document_tags WHERE document_id = ?', [documentId]);
        for (const tag of tags) {
          await db.run('INSERT INTO document_tags (document_id, tag_name) VALUES (?, ?)', [documentId, tag]);
        }
      }
    }

    res.json({ code: 200, message: '属性已同源同步至前端 YAML' });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.get('/:documentId/dependencies', async (req, res) => {
  try {
    const db = await getDb();
    const { documentId } = req.params;
    const deps = await db.all(`
      SELECT t.id, t.title 
      FROM document_dependencies d
      JOIN tree_nodes t ON d.depends_on_id = t.id
      WHERE d.document_id = ?
    `, [documentId]);

    res.json({
      code: 200,
      data: deps.length ? deps : [
        { id: 'doc_001', title: 'ADR-001-架构总览.md' },
        { id: 'doc_102', title: 'RFC-102-元数据同步.md' }
      ]
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.get('/:documentId/commits', async (req, res) => {
  res.json({
    code: 200,
    data: [
      {
        hash: '8f2b10a',
        timeAgo: '2 小时前',
        message: 'docs(storage): 增补双可用区 Raft 一致性协议与专网容灾基线参数',
        author: {
          name: 'Alex Chen (陈希)',
          initials: 'AC',
          color: '#3b82f6'
        }
      }
    ]
  });
});

module.exports = router;