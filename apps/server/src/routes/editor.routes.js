const { Router } = require('express');
const { getDb } = require('../config/database');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

router.get('/:documentId/content', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { documentId } = req.params;
    const userId = req.user.userId;

    // 检查访问权限
    const node = await db.get(`
      SELECT id FROM tree_nodes 
      WHERE id = ? AND (
        creator_id = ? OR id IN (
          SELECT sl.target_id 
          FROM share_links sl 
          JOIN user_share_access usa ON sl.id = usa.share_link_id 
          WHERE usa.user_id = ?
        )
      )
    `, [documentId, userId, userId]);

    if (!node) {
      return res.status(403).json({ code: 403, message: '无权限访问此文档' });
    }

    const content = await db.get('SELECT * FROM document_contents WHERE document_id = ?', [documentId]);
    
    if (content) {
      res.json({
        code: 200,
        data: {
          source: content.source,
          lastSavedAt: content.last_saved_at
        }
      });
    } else {
      res.json({
        code: 200,
        data: {
          source: '# 新文档\n\n开始编写...',
          lastSavedAt: new Date().toISOString()
        }
      });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.put('/:documentId/content', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { documentId } = req.params;
    const { source } = req.body;
    const userId = req.user.userId;
    
    // 检查修改权限（只读权限不应该能保存）
    const node = await db.get('SELECT creator_id FROM tree_nodes WHERE id = ?', [documentId]);
    if (!node) {
      return res.status(404).json({ code: 404, message: '文档不存在' });
    }

    if (node.creator_id !== userId) {
      return res.status(403).json({ code: 403, message: '他人分享的文档为只读，无权限保存修改' });
    }

    if (!isNaN(parseInt(documentId))) {
      const existing = await db.get('SELECT * FROM document_contents WHERE document_id = ?', [documentId]);
      if (existing) {
        await db.run('UPDATE document_contents SET source = ?, last_saved_at = CURRENT_TIMESTAMP WHERE document_id = ?', [source, documentId]);
      } else {
        await db.run('INSERT INTO document_contents (document_id, source) VALUES (?, ?)', [documentId, source]);
      }
    }
    
    res.json({ code: 200, message: '文档已自动备份' });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Server error' });
  }
});

router.post('/ai/polish', async (req, res) => {
  const { documentId, originalText, mode } = req.body;
  res.json({
    code: 200,
    data: {
      suggestedText: `[AI 优化] ${originalText}`,
      confidence: 98.5
    }
  });
});

module.exports = router;