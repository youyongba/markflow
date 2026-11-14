const express = require('express');
const next = require('next');
const path = require('path');
const apiRoutes = require('./routes/index');

const dev = process.env.NODE_ENV !== 'production';
const webDir = path.join(__dirname, '../../web');
// 初始化 Next.js
const nextApp = next({ dev, dir: webDir });
const handle = nextApp.getRequestHandler();

async function initApp() {
  await nextApp.prepare();
  const app = express();
  
  app.use(express.json());
  
  // 挂载 API 路由 (前缀 /v2.4)
  app.use('/v2.4', apiRoutes);
  
  // 剩下的所有请求交给 Next.js 处理 (包括页面渲染和静态资源)
  app.all('*', (req, res) => {
    return handle(req, res);
  });
  
  return app;
}

module.exports = { initApp };
