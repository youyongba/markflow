const { Router } = require('express');
const { getDb } = require('../config/database');

const router = Router();

router.get('/:documentId/content', async (req, res) => {
  try {
    const db = await getDb();
    const { documentId } = req.params;
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

router.put('/:documentId/content', async (req, res) => {
  try {
    const db = await getDb();
    const { documentId } = req.params;
    const { source } = req.body;
    
    // ignore non-integer documentId for mock records
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