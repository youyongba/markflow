const { Router } = require('express');
const { getDb } = require('../config/database');
const authMiddleware = require('../middleware/auth.middleware');

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

router.get('/:documentId/activities', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { documentId } = req.params;
    const userId = req.user.userId;
    const date = req.query.date || '';
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const pageSize = req.query.pageSize === undefined ? 10 : Number(req.query.pageSize);

    if (!/^[1-9]\d*$/.test(documentId)) {
      return res.status(400).json({ code: 400, message: '文档 ID 无效' });
    }

    if (date) {
      const parsedDate = typeof date === 'string' ? new Date(`${date}T00:00:00Z`) : null;
      if (
        typeof date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
      ) {
        return res.status(400).json({ code: 400, message: '日期格式应为 YYYY-MM-DD' });
      }
    }

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
      return res.status(400).json({ code: 400, message: '分页参数无效' });
    }

    const node = await db.get(`
      SELECT id, creator_id,
        EXISTS(
          SELECT 1
          FROM share_links sl
          JOIN user_share_access usa ON sl.id = usa.share_link_id
          WHERE sl.target_id = tree_nodes.id AND usa.user_id = ?
        ) AS has_shared_access
      FROM tree_nodes
      WHERE id = ? AND node_type = 'document'
    `, [userId, documentId]);

    if (!node) {
      return res.status(404).json({ code: 404, message: '文档不存在' });
    }
    if (node.creator_id !== userId && !node.has_shared_access) {
      return res.status(403).json({ code: 403, message: '无权限查看此文档的跟进记录' });
    }

    const conditions = ['a.document_id = ?'];
    const params = [documentId];
    if (date) {
      conditions.push("date(a.created_at, 'localtime') = ?");
      params.push(date);
    }
    const whereClause = conditions.join(' AND ');

    const { total } = await db.get(
      `SELECT COUNT(*) AS total FROM document_activities a WHERE ${whereClause}`,
      params
    );
    const rows = await db.all(`
      SELECT a.id, a.action_type, a.details_json, a.created_at,
        u.id AS actor_id, u.name AS actor_name
      FROM document_activities a
      JOIN users u ON a.actor_id = u.id
      WHERE ${whereClause}
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, (page - 1) * pageSize]);

    const actionLabels = {
      content_saved: '修改了正文',
      title_updated: '重命名了文档'
    };
    const items = rows.map((row) => {
      let details = null;
      if (row.details_json) {
        try {
          details = JSON.parse(row.details_json);
        } catch (error) {
          details = null;
        }
      }
      return {
        id: row.id,
        actor: { id: row.actor_id, name: row.actor_name },
        action: row.action_type,
        actionLabel: actionLabels[row.action_type] || '更新了文档',
        details,
        createdAt: row.created_at
      };
    });

    res.json({
      code: 200,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (err) {
    console.error('Fetch document activities error:', err);
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