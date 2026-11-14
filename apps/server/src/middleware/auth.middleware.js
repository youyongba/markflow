const jwt = require('jsonwebtoken');

const JWT_SECRET = 'markflow_secret_key'; // 应该和 auth.routes.js 保持一致

const authMiddleware = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] === 'null') {
    return res.status(401).json({ code: 401, message: '未授权，请先登录' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId: ... }
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
};

module.exports = authMiddleware;
