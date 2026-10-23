const { Router } = require('express');
const { getDb } = require('../config/database');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.userId; 
    const pref = await db.get('SELECT * FROM user_sidebar_preferences WHERE user_id = ?', [userId]);
    
    const { count: filesCount } = await db.get('SELECT COUNT(*) as count FROM tree_nodes WHERE node_type = "document"');
    const { count: tagsCount } = await db.get('SELECT COUNT(DISTINCT tag_name) as count FROM document_tags');

    if (pref) {
      res.json({
        code: 200,
        message: 'success',
        data: {
          activeNavItem: pref.active_nav_item,
          expandedNodes: JSON.parse(pref.expanded_nodes || '[]'),
          isLeftSidebarOpen: Boolean(pref.is_left_sidebar_open),
          filesCount,
          tagsCount
        }
      });
    } else {
      res.json({
        code: 200,
        message: 'success',
        data: {
          activeNavItem: 'files',
          expandedNodes: [],
          isLeftSidebarOpen: true,
          filesCount,
          tagsCount
        }
      });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.patch('/preferences', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.userId;
    const { activeNavItem, expandedNodes, isLeftSidebarOpen } = req.body;
    
    let setClauses = [];
    let values = [];
    
    if (activeNavItem !== undefined) {
      setClauses.push('active_nav_item = ?');
      values.push(activeNavItem);
    }
    if (expandedNodes !== undefined) {
      setClauses.push('expanded_nodes = ?');
      values.push(JSON.stringify(expandedNodes));
    }
    if (isLeftSidebarOpen !== undefined) {
      setClauses.push('is_left_sidebar_open = ?');
      values.push(isLeftSidebarOpen ? 1 : 0);
    }

    if (setClauses.length > 0) {
      values.push(userId);
      const updateRes = await db.run(`UPDATE user_sidebar_preferences SET ${setClauses.join(', ')} WHERE user_id = ?`, values);
      if (updateRes.changes === 0) {
        // Insert default if not exists
        await db.run('INSERT INTO user_sidebar_preferences (user_id) VALUES (?)', [userId]);
        await db.run(`UPDATE user_sidebar_preferences SET ${setClauses.join(', ')} WHERE user_id = ?`, values);
      }
    }
    
    res.json({ code: 200, message: '侧边栏配置更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.get('/tree-nodes', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { parentId } = req.query;
    const userId = req.user.userId;
    
    let query = `
      WITH RECURSIVE visible_nodes AS (
        SELECT id, parent_id, node_type, title, status, creator_id, sort_order
        FROM tree_nodes
        WHERE creator_id = ? OR id IN (
          SELECT sl.target_id 
          FROM share_links sl 
          JOIN user_share_access usa ON sl.id = usa.share_link_id 
          WHERE usa.user_id = ?
        )
        
        UNION
        
        SELECT t.id, t.parent_id, t.node_type, t.title, t.status, t.creator_id, t.sort_order
        FROM tree_nodes t
        JOIN visible_nodes v ON t.id = v.parent_id
      )
      SELECT DISTINCT * FROM visible_nodes
      WHERE `;
    
    let params = [userId, userId];
    if (parentId) {
      query += 'parent_id = ?';
      params.push(parentId);
    } else {
      query += 'parent_id IS NULL';
    }
    
    query += ' ORDER BY sort_order ASC, id ASC';

    const nodes = await db.all(query, params);
    
    const data = await Promise.all(nodes.map(async (node) => {
      // 检查是否包含子节点（也需要经过相同的权限过滤）
      const { count } = await db.get(`
        WITH RECURSIVE visible_nodes AS (
          SELECT id, parent_id
          FROM tree_nodes
          WHERE creator_id = ? OR id IN (
            SELECT sl.target_id 
            FROM share_links sl 
            JOIN user_share_access usa ON sl.id = usa.share_link_id 
            WHERE usa.user_id = ?
          )
          UNION
          SELECT t.id, t.parent_id
          FROM tree_nodes t
          JOIN visible_nodes v ON t.id = v.parent_id
        )
        SELECT COUNT(DISTINCT id) as count FROM visible_nodes WHERE parent_id = ?
      `, [userId, userId, node.id]);
      return {
        id: String(node.id),
        parentId: node.parent_id ? String(node.parent_id) : null,
        type: node.node_type,
        title: node.title,
        status: node.status,
        hasChildren: count > 0
      };
    }));
    
    res.json({ code: 200, data });
  } catch (err) {
    console.error('Fetch tree-nodes error:', err);
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.get('/bookmarks', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.userId;
    const bookmarks = await db.all('SELECT * FROM user_bookmarks WHERE user_id = ? ORDER BY sort_order ASC', [userId]);
    const data = bookmarks.map(b => ({
      id: String(b.id),
      title: b.title,
      url: b.url,
      iconColor: b.icon_color
    }));
    res.json({ code: 200, data });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.post('/tree-nodes/folder', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { title, parentId } = req.body;
    const userId = req.user.userId;
    const result = await db.run(
      'INSERT INTO tree_nodes (workspace_id, parent_id, node_type, title, creator_id) VALUES (?, ?, "folder", ?, ?)',
      [1, parentId || null, title, userId]
    );
    res.json({
      code: 200,
      message: '创建成功',
      data: {
        id: String(result.lastID),
        parentId: parentId || null,
        type: 'folder',
        title,
        hasChildren: false
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.put('/tree-nodes/folder/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { title } = req.body;
    const userId = req.user.userId;
    // 仅允许创建者修改
    await db.run('UPDATE tree_nodes SET title = ? WHERE id = ? AND node_type = "folder" AND creator_id = ?', [title, req.params.id, userId]);
    res.json({ code: 200, message: '修改成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.delete('/tree-nodes/folder/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.userId;
    await db.run('DELETE FROM tree_nodes WHERE id = ? AND node_type = "folder" AND creator_id = ?', [req.params.id, userId]);
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.delete('/tree-nodes/document/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.userId;
    await db.run('DELETE FROM tree_nodes WHERE id = ? AND node_type = "document" AND creator_id = ?', [req.params.id, userId]);
    res.json({ code: 200, message: '文档已删除', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

module.exports = router;