const { Router } = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const NodeRSAModule = require('node-rsa');
const NodeRSA = NodeRSAModule.NodeRSA || NodeRSAModule;
const { getDb } = require('../config/database');
const { sendResetEmail } = require('../utils/mailer');

const router = Router();
const JWT_SECRET = 'markflow_secret_key';

// RSA Keys cache
let serverKey = new NodeRSA({ b: 512 });

router.get('/public-key', (req, res) => {
  res.json({
    code: 200,
    data: {
      keyId: 'key-' + Date.now(),
      publicKey: serverKey.exportKey('public')
    }
  });
});

router.post('/login', async (req, res) => {
  try {
    const { payload } = req.body;
    let decoded;
    try {
      // Try RSA decrypt
      const decryptedStr = serverKey.decrypt(payload, 'utf8');
      decoded = JSON.parse(decryptedStr);
    } catch (err) {
      // Fallback to base64 for old mock frontend
      const base64Decoded = Buffer.from(payload, 'base64').toString('utf8');
      decoded = JSON.parse(decodeURIComponent(escape(base64Decoded)));
    }

    const { email, password } = decoded;
    const db = await getDb();
    
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    let isNewUser = false;
    
    if (!user) {
      isNewUser = true;
      // 首次登录，自动注册
      const hashed = await bcrypt.hash(password, 10);
      const defaultName = email.split('@')[0] || 'New User';
      const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${defaultName}`;
      
      const insertResult = await db.run(
        'INSERT INTO users (email, password_hash, name, role, avatar_url) VALUES (?, ?, ?, ?, ?)',
        [email, hashed, defaultName, 'viewer', defaultAvatar]
      );
      
      user = {
        id: insertResult.lastID,
        email: email,
        name: defaultName,
        role: 'viewer',
        avatar_url: defaultAvatar
      };
    } else {
      // 已经注册过，校验密码
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ code: 401, message: '邮箱或访问凭据错误，请重试' });
      }
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // 记录 session
    await db.run(
      'INSERT INTO user_sessions (user_id, session_token) VALUES (?, ?)',
      [user.id, token]
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        isNewUser,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatar_url
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/password/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (user) {
      // 生成安全的随机 Token
      const resetToken = crypto.randomBytes(32).toString('hex');
      await db.run(
        'INSERT INTO password_resets (user_id, reset_token, expires_at) VALUES (?, ?, datetime("now", "+15 minutes"))',
        [user.id, resetToken]
      );
      
      // 发送包含 Token 的重置邮件
      try {
        await sendResetEmail(user.email, resetToken);
      } catch (mailErr) {
        console.error('发送邮件失败:', mailErr);
        // 考虑到安全原因，即使邮件发送失败也不要暴漏用户是否存在，但也可以记录日志
      }
    }
    // 不管用户是否存在都返回相同的信息，防止探测邮箱是否存在
    res.json({ code: 200, message: '重置链接已发送', data: null });
  } catch (err) {
    console.error('找回密码出错:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/password/reset', async (req, res) => {
  try {
    const { resetToken, newPassword, logoutOther } = req.body;
    let decodedPass;
    try {
      decodedPass = serverKey.decrypt(newPassword, 'utf8');
    } catch (err) {
      decodedPass = Buffer.from(newPassword, 'base64').toString('utf8');
    }

    const db = await getDb();
    const resetRecord = await db.get('SELECT * FROM password_resets WHERE reset_token = ? AND used = 0 AND expires_at > datetime("now")', [resetToken]);
    
    if (!resetRecord) {
      return res.status(400).json({ code: 400, message: '重置链接已失效' });
    }

    const hashed = await bcrypt.hash(decodedPass, 10);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, resetRecord.user_id]);
    await db.run('UPDATE password_resets SET used = 1 WHERE id = ?', [resetRecord.id]);

    if (logoutOther !== false) {
      await db.run('UPDATE user_sessions SET is_active = 0 WHERE user_id = ?', [resetRecord.user_id]);
    }

    res.json({ code: 200, message: '密码重置成功', data: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;