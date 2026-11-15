# Context

用户希望在 MarkFlow 全站接入百度统计，并统计页面访问、登录和关键按钮事件。使用用户提供的百度统计 ID `74a95ebf77c4d891259030ed57280cf1`，同时修正示例中统计 URL 两端多余的反引号。统计失败或被广告拦截时不得影响业务功能，也不得采集邮箱、密码、Token、文档标题、分享链接等敏感信息。

## 实施方案

1. **全局加载百度统计**
   - 修改 `apps/web/src/pages/_document.js`，在 `<Head>` 中加入一次百度统计初始化脚本。
   - 使用正确地址 `https://hm.baidu.com/hm.js?74a95ebf77c4d891259030ed57280cf1`，不引入新依赖。

2. **统计 SPA 页面浏览**
   - 修改 `apps/web/src/pages/_app.js`，复用 Next.js `useRouter` 和 React `useEffect`。
   - 监听 `routeChangeComplete` 并上报路径，组件卸载时取消监听。
   - 首次页面浏览由百度脚本自动上报，不在挂载时重复上报；路由事件仅上报不含查询参数的路径。

3. **统一安全埋点工具**
   - 新建 `apps/web/src/utils/analytics.js`，提供 `trackPageview` 和 `trackEvent`。
   - 在浏览器端初始化并复用 `window._hmt` 队列，SSR、脚本未加载或被拦截时均不抛出业务异常。

4. **添加核心事件**
   - `apps/web/src/pages/auth/login/index.js`：提交登录、登录成功、登录失败、网络异常，以及忘记密码和使用手册点击。
   - `apps/web/src/pages/auth/forgot-password/index.js`：提交找回密码、发送成功、发送失败、网络异常。
   - `apps/web/src/components/layout/TopHeader.js`：点击新建文档、新建成功、点击分享、分享成功、分享失败、退出登录成功。
   - 事件使用清晰的分类和动作名称；失败事件不携带服务端返回详情，避免意外记录敏感数据。其他低价值按钮暂不逐个添加。

## 验证

- 执行 `pnpm build`，确认全局脚本、路由监听和各事件调用通过生产构建。
- 浏览器 Network 过滤 `hm.js` 和 `hm.gif`，确认脚本成功加载、事件能够发送；控制台检查 `window._hmt` 为数组。
- 验证首屏仅一次 PV，SPA 路由切换各新增一次 PV。
- 分别触发登录成功/失败、找回密码、新建、分享和退出，确认百度后台事件分析出现对应分类，同时原有业务行为不变。
