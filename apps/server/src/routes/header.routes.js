const { Router } = require('express');
const { getDb } = require('../config/database');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

router.get('/context', async (req, res) => {
  try {
    const db = await getDb();
    const { documentId } = req.query;

    let paths = [];
    if (documentId && documentId !== 'undefined' && documentId !== 'null') {
      const node = await db.get('SELECT * FROM tree_nodes WHERE id = ?', [documentId]);
      if (node) {
        if (node.parent_id) {
           const parent = await db.get('SELECT * FROM tree_nodes WHERE id = ?', [node.parent_id]);
           if (parent) {
             paths.push({ id: parent.id, title: parent.title });
           }
        }
        paths.push({ id: node.id, title: node.title });
      }
    }

    res.json({
      code: 200,
      data: {
        workspaceName: 'Engineering Wiki',
        branchOrTag: 'main',
        paths: paths
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.get('/user-profile', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.userId;
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    res.json({
      code: 200,
      data: {
        userId: String(user.id),
        userName: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.post('/share-link', async (req, res) => {
  try {
    const db = await getDb();
    const { targetId } = req.body;
    const shareToken = 'share-' + Math.random().toString(36).substr(2, 6);
    
    // ignore real insert for targetId if not integer
    res.json({
      code: 200,
      data: {
        shareUrl: `https://markflow.com/s/${shareToken}`
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.post('/document', async (req, res) => {
  try {
    const db = await getDb();
    const { title, parentId } = req.body;
    const result = await db.run(
      'INSERT INTO tree_nodes (workspace_id, parent_id, node_type, title, status) VALUES (?, ?, "document", ?, "draft")',
      [1, parentId || null, title]
    );
    res.json({
      code: 200,
      data: {
        documentId: String(result.lastID)
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.post('/document/api-template', async (req, res) => {
  try {
    const db = await getDb();
    const { title, parentId } = req.body;
    
    // 1. 创建节点
    const result = await db.run(
      'INSERT INTO tree_nodes (workspace_id, parent_id, node_type, title, status) VALUES (?, ?, "document", ?, "draft")',
      [1, parentId || null, title || 'API 接口文档']
    );
    
    const documentId = result.lastID;
    const source = '# 用户鉴权模块接口\n\n## 1. 用户登录\n**POST** `/login`\n...';
    
    // 2. 插入默认模板内容
    await db.run(
      'INSERT INTO document_contents (document_id, source) VALUES (?, ?)',
      [documentId, source]
    );

    res.json({
      code: 200,
      data: {
        documentId: String(documentId),
        source: source
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const db = await getDb();
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.json({ code: 200, data: [] });
    }

    // 搜索文档标题
    const results = await db.all(`
      SELECT id, title, node_type as type 
      FROM tree_nodes 
      WHERE node_type = 'document' AND title LIKE ?
      LIMIT 10
    `, [`%${keyword}%`]);

    const formattedData = results.map(row => ({
      id: String(row.id),
      title: row.title,
      type: row.type,
      highlight: `找到包含 <em>${keyword}</em> 的文档`,
      url: `/workspace/docs/${row.id}`
    }));

    res.json({
      code: 200,
      data: formattedData
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { logoutAllDevices } = req.body;
    const userId = req.user.userId;
    if (logoutAllDevices) {
      await db.run('UPDATE user_sessions SET is_active = 0 WHERE user_id = ?', [userId]);
    } else {
      // 仅注销当前，简单起见全部设 0 或者需要知道 token
      await db.run('UPDATE user_sessions SET is_active = 0 WHERE user_id = ?', [userId]);
    }
    res.json({ code: 200, message: '已成功退出登录', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

module.exports = router;