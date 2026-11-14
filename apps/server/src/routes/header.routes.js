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

router.post('/share-link', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { targetId } = req.body;
    const userId = req.user.userId;
    
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    
    // 检查是否已经分享过且未过期
    const existing = await db.get('SELECT share_token FROM share_links WHERE target_id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)', [targetId]);
    if (existing) {
      return res.json({
        code: 200,
        data: {
          shareUrl: `${protocol}://${host}/s/${existing.share_token}`
        }
      });
    }

    const shareToken = 'share-' + Math.random().toString(36).substr(2, 6);
    
    // 真实写入分享记录，默认7天有效期
    await db.run(
      'INSERT INTO share_links (share_token, target_id, creator_id, expires_at) VALUES (?, ?, ?, datetime("now", "+7 days"))',
      [shareToken, targetId, userId]
    );

    res.json({
      code: 200,
      data: {
        shareUrl: `${protocol}://${host}/s/${shareToken}`
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.post('/share-link/:token/accept', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { token } = req.params;
    const userId = req.user.userId;

    // 查找分享链接
    const shareLink = await db.get(
      'SELECT * FROM share_links WHERE share_token = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)', 
      [token]
    );

    if (!shareLink) {
      return res.status(404).json({ code: 404, message: '分享链接不存在或已过期' });
    }

    // 自己不能/不需要接受自己的分享
    if (shareLink.creator_id === userId) {
      return res.json({ code: 200, message: '这是您自己创建的文档', data: null });
    }

    // 记录用户已接受该分享
    await db.run(
      'INSERT OR IGNORE INTO user_share_access (user_id, share_link_id) VALUES (?, ?)',
      [userId, shareLink.id]
    );

    res.json({ code: 200, message: '接收成功', data: null });
  } catch (err) {
    console.error('Accept share link error:', err);
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.post('/document', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { title, parentId, templateId } = req.body;
    const userId = req.user.userId;

    if (parentId) {
      const parentNode = await db.get('SELECT creator_id FROM tree_nodes WHERE id = ? AND node_type = "folder"', [parentId]);
      if (!parentNode) {
        return res.status(404).json({ code: 404, message: '父目录不存在' });
      }
      if (parentNode.creator_id !== userId) {
        return res.status(403).json({ code: 403, message: '无权限在他人分享的目录下新建' });
      }
    }

    const result = await db.run(
      'INSERT INTO tree_nodes (workspace_id, parent_id, node_type, title, status, creator_id) VALUES (?, ?, "document", ?, "draft", ?)',
      [1, parentId || null, title, userId]
    );

    const documentId = result.lastID;
    let source = '# ' + (title || '无标题文档') + '\n\n开始编写...';
    
    if (templateId === 'adr') {
      source = `# ${title || 'ADR 决策记录'}\n\n## 1. 背景与上下文\n\n## 2. 决策选项\n- 选项A:\n- 选项B:\n\n## 3. 最终决策\n\n## 4. 后果与影响\n`;
    } else if (templateId === 'rfc') {
      source = `# ${title || 'RFC 技术提案'}\n\n## 1. 概述 (Summary)\n\n## 2. 动机 (Motivation)\n\n## 3. 详细设计 (Detailed Design)\n\n## 4. 缺点与风险 (Drawbacks)\n\n## 5. 替代方案 (Alternatives)\n`;
    }

    await db.run(
      'INSERT INTO document_contents (document_id, source) VALUES (?, ?)',
      [documentId, source]
    );

    res.json({
      code: 200,
      data: {
        documentId: String(documentId)
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.post('/document/api-template', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { title, parentId } = req.body;
    const userId = req.user.userId;
    
    // 1. 创建节点
    const result = await db.run(
      'INSERT INTO tree_nodes (workspace_id, parent_id, node_type, title, status, creator_id) VALUES (?, ?, "document", ?, "draft", ?)',
      [1, parentId || null, title || 'API 接口文档', userId]
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

router.get('/search', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { keyword } = req.query;
    const userId = req.user.userId;
    
    if (!keyword) {
      return res.json({ code: 200, data: [] });
    }

    // 搜索文档标题，过滤出自己创建的或者已经接受分享的文档
    const results = await db.all(`
      SELECT t.id, t.title, t.node_type as type, u.name as creator_name
      FROM tree_nodes t
      LEFT JOIN users u ON t.creator_id = u.id
      WHERE t.node_type = 'document' 
        AND t.title LIKE ?
        AND (t.creator_id = ? OR t.id IN (
          SELECT sl.target_id 
          FROM share_links sl 
          JOIN user_share_access usa ON sl.id = usa.share_link_id 
          WHERE usa.user_id = ?
        ))
      LIMIT 10
    `, [`%${keyword}%`, userId, userId]);

    const formattedData = results.map(row => ({
      id: String(row.id),
      title: row.title,
      type: row.type,
      creatorName: row.creator_name,
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