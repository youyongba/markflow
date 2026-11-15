# MarkFlow 中文 SEO 与自然用户增长实施计划

## Context

目标是在中文搜索市场获取可持续的自然流量，并将访客转化为注册且实际使用 MarkFlow 的用户。SEO 不能保证“海量用户”或固定排名；本方案以可索引、内容满足搜索意图、转化可测量为原则，不虚构搜索量，不堆砌关键词，不批量生成低质页面。

当前关键问题：

- `/` 直接渲染真实工作台 `MainLayout`，而 `/home` 才是内容很薄的演示首页；搜索引擎无法从根域名获得清晰的产品价值与使用场景。
- `/dashboard` 目前是另一套模拟项目页，登录成功、分享接收成功和手册中的“返回工作台”却都指向 `/`。
- 公开页只有基础 title，缺少 description、canonical、Open Graph、结构化数据、robots.txt 和 sitemap.xml。
- `_document.js` 使用 `lang="en"`，与中文内容不符。
- `/manual` 已有真实、较完整的产品说明，是最值得优先做深的搜索内容资产。
- 当前 `_document.js` 和 `analytics.js` 有尚未提交的 GTM 改动，实施时必须保留，不回滚。

## 第一阶段：直接实施的技术与内容改造

### 1. 理顺公开获客页与工作台 URL

推荐 URL 分工：

| URL | 用途 | 索引策略 |
| --- | --- | --- |
| `/` | 静态产品介绍与注册转化首页 | index,follow，加入 sitemap |
| `/manual` | 中文使用手册、功能与导出教程 | index,follow，加入 sitemap |
| `/about` | 项目、作者、开源与私有部署说明 | index,follow，加入 sitemap |
| `/dashboard` | 真正的 MainLayout 产品工作台 | noindex,nofollow |
| `/auth/*`、`/s/[token]`、密码工具页 | 登录、分享接收等工具页面 | noindex,nofollow |
| `/home` | 旧演示首页 | 308 到 `/` |
| `/auth/register` | 旧模拟注册页 | 308 到 `/auth/login` |

实施：

- 重写 `apps/web/src/pages/index.js` 为不依赖工作台 API、Redux 演示数据或客户端 JS 的公开落地页，由 Next.js 自动静态预渲染。
- 用现有 `MainLayout` 替换 `apps/web/src/pages/dashboard/index.js` 的模拟 Dashboard，不复制工作台组件。
- 将 `apps/web/src/components/layout/MainLayout.js` 的标题改为中文“Markdown 工作台 - MarkFlow”。
- 更新 `apps/web/src/pages/auth/login/index.js` 的默认成功跳转、`apps/web/src/pages/s/[token].js` 的分享接收成功跳转，以及 `manual.js` 的工作台链接到 `/dashboard`。
- 在 `apps/web/next.config.js` 配置 `/home` 和 `/auth/register` 永久重定向，并删除对应旧页面，避免继续构建无效演示页。
- 全站检查根路径链接，只调整语义为“进入工作台”的链接；公开首页链接仍指向 `/`。

### 2. 建立统一 SEO 基础设施

新增：

- `apps/web/src/config/site.js`
- `apps/web/src/components/seo/SeoHead.js`
- `apps/web/src/pages/robots.txt.js`
- `apps/web/src/pages/sitemap.xml.js`

`site.js`：

- 从 `NEXT_PUBLIC_SITE_URL` 读取正式域名，移除末尾斜杠并统一生成 canonical、OG URL 和 sitemap URL。
- 生产构建要求合法 HTTPS origin，不允许路径、查询参数或 hash；不猜测、不硬编码用户域名。
- 正式 URL 由用户写入被 git 忽略的 `.env.production` 或部署平台环境变量；`.env.example` 仅增加空值和说明。

`SeoHead`：

- 为每个公开页输出唯一 title、description、固定路径 canonical 和 robots。
- 输出 `og:type=website`、`og:locale=zh_CN`、OG 标题/描述/URL/图片，以及 Twitter Card。
- canonical 只使用代码中声明的路径，不读取 `router.asPath`，避免 UTM 或分享参数生成重复 URL。
- 支持按页传入 JSON-LD；不添加 meta keywords。

各页结构化数据：

- 首页：`WebSite` + `SoftwareApplication`，仅描述现有 Web 产品能力，不添加虚构价格、评分、评论、企业信息或公开站内搜索 `SearchAction`。
- 手册：FAQ 问题与答案来自同一个 `faqItems` 数组，同时渲染可见正文和 `FAQPage` JSON-LD，不承诺富摘要展示。
- 关于页：不添加与页面无关的 schema。

在 `apps/web/src/pages/_document.js`：

- 将 `lang` 改为 `zh-CN`，保留现有 GTM 和 noscript 实现。
- 按非空环境变量条件输出 `GOOGLE_SITE_VERIFICATION`、`BAIDU_SITE_VERIFICATION`、`BING_SITE_VERIFICATION` 对应验证 meta，不输出空标签。

robots 与 sitemap：

- 使用 pages router 的 `getServerSideProps` 返回正确 Content-Type，无需引入 `next-sitemap`。
- robots 允许公开内容与 Next 静态资源，仅禁止抓取 `/v2.4/` API，输出绝对 sitemap 地址。
- 不在 robots 中屏蔽工作台、登录和分享页，让搜索引擎能读取其 noindex。
- sitemap 第一阶段只包含 `/`、`/manual`、`/about`，不包含锚点、token、登录页或旧演示页，不伪造每次请求变化的 lastmod。

### 3. 重构首页，匹配真实搜索意图并完成转化

新增 `apps/web/src/styles/landing.module.css`，不改写被工作台共享的 `pages/index.module.css`。

首页只设置五个主要内容区块：

1. **Hero**：唯一 H1 聚焦“Markdown 文档管理、实时预览与多格式导出”；简明说明工程文档定位。主 CTA“开始使用 MarkFlow”进入 `/auth/login`，次 CTA“查看使用手册”进入 `/manual`，明确新邮箱首次登录自动创建账号。
2. **适用场景**：工程文档、ADR、RFC、API 接口文档；不宣称实时多人协作、完整 OpenAPI 生成等未实现能力。
3. **核心功能**：目录树和模板；源码、分屏、只读预览、脑图四种视图；实时大纲、同步滚动、全文搜索与分享；Markdown/HTML/PDF/Word 导出。功能链接到 `/manual` 对应锚点。
4. **三步使用流程**：登录自动注册 → 选择目录和模板新建文档 → 编辑预览后分享或导出。
5. **最终 CTA 与页脚**：提供开始使用、手册、关于和工作台入口，如实标明个人开源项目、作者小洪、演示版本和私有部署联系方式。

素材与体验：

- 新增真实 `public/images/markflow-og.png`（1200×630）和 `public/images/markflow-workbench.webp`；来自真实品牌与界面，不使用占位图、不包含私人文档。
- 首页不导入 MainLayout、Monaco、Markmap、Prism 或工作台 API，使用系统字体，避免首屏加载工作台代码。
- 使用语义化 header/nav/main/section/footer、每页一个 H1、真实链接和清晰 focus-visible。
- 公开页根容器独立设置 `height: 100vh; overflow-y: auto`，适配全局 `overflow: hidden`，不破坏工作台。
- 360px 移动端无横向溢出，CTA 点击区域至少 44px，图片声明尺寸与准确中文 alt。

### 4. 做深现有手册和信任页，而非立即批量建页

修改 `apps/web/src/pages/manual.js`：

- 保留快速开始、目录、编辑器、大纲、搜索和分享内容，补齐独立 title、description、canonical 和内链。
- 在目录管理中补充真实 ADR/RFC 模板结构：ADR 的背景、选项、决策、后果；RFC 的概述、动机、详细设计、风险、替代方案。
- 将导出部分扩展成完整教程，准确说明：
  - Markdown 导出源码；HTML/PDF 需先有分屏或只读预览。
  - HTML 保留预览样式、锚点与代码复制；PDF 使用浏览器打印窗口并需允许弹窗。
  - Word 由当前源码生成，frontmatter 不进入正文；当前图片只导出为文字占位，不宣称图片高保真。
  - PDF/Word 为静态格式，不支持代码复制按钮。
- 为导出表增加 caption、表头 scope 和移动端独立横向滚动。
- FAQ 增加“新用户如何注册”“为什么 PDF 导出需要允许弹窗”等真实问题。
- 页尾增加产品首页和开始使用 CTA，工作台链接改到 `/dashboard`。

修改 `apps/web/src/pages/about/index.js`：

- 移除脚手架说明，写清产品定位、个人开源项目、作者小洪、演示版本、私有部署联系方式，以及首页/手册/开始使用链接。
- 原 `/home` 返回链接改为 `/`。

第一阶段不拆分大量 `/manual/export`、ADR、RFC、API 页面。现有模板和手册内容先形成一个完整主题；等真实查询展示和用户需求证明独立页面有价值时再拆，避免内容重叠与低质页面。

### 5. 复用现有 GTM，测量自然搜索到激活的漏斗

复用 `apps/web/src/utils/analytics.js`，不另建埋点系统：

- 首页和手册 CTA 使用 `trackEvent`，label 仅记录 `home_hero`、`home_final`、`manual_header`、`manual_export` 等位置。
- `apps/web/src/pages/_app.js` 增加首次 `trackPageview` 并保留 SPA 路由上报。
- GTM 后台统一将自定义 `page_view` 接入 GA4，避免 GA4 自动 page_view、历史变更和代码重复计数；将 `markflow_event` 的 category/action/label/page_path 配置为事件参数。
- 不发送邮箱、密码、Token、文档标题、分享 token 或正文，统计脚本失败不得影响业务。

为准确区分注册与老用户登录，做一个小范围测量改造：

- `apps/server/src/routes/auth.routes.js` 在登录成功响应中增加布尔值 `data.isNewUser`。
- `apps/web/src/pages/auth/login/index.js` 保留登录成功事件，仅在 `isNewUser === true` 时额外记录注册成功。
- 同步更新现有 `docs/api/auth/v2.4-登录与认证接口文档.md` 的响应字段。
- 复用现有新建文档成功事件，在 GA4 建立“公开页访问 → CTA → 注册成功 → 工作台浏览 → 新建文档成功”会话漏斗。

### 6. 增加轻量 SEO 回归检查

新增 `apps/web/scripts/check-seo.mjs`，在根 `package.json` 增加 `test:seo`，使用 Node 内置 assert 和文件 API，不新增依赖。

检查：

- 公开 HTML 直接包含唯一 title、description、canonical、H1、正文和 CTA，而不是依赖客户端渲染。
- canonical 与当前 `NEXT_PUBLIC_SITE_URL` 一致，带 UTM 的访问不会改变 canonical。
- 首页包含正确 JSON-LD；手册 FAQPage 与可见 FAQ 使用同一数据。
- `/dashboard` 带 noindex；首页不再包含工作台标题或工作台 API 请求。
- sitemap 只包含三个公开 URL，robots 指向同一正式域名。

## 验证与上线验收

1. 用户将正式 HTTPS URL 配置到 `.env.production` 的 `NEXT_PUBLIC_SITE_URL`，执行 `pnpm build` 和 `pnpm test:seo`；测试环境按需执行 `pnpm build:test`。
2. 执行 `pnpm start`，验证：
   - `/`、`/manual`、`/about` 返回 200；关闭 JavaScript 后正文和链接仍可读。
   - `/home`、`/auth/register` 永久重定向；旧链接不形成重复收录。
   - `/dashboard` 展示真实工作台且带 noindex。
   - 新邮箱首次登录 `isNewUser=true` 并进入 `/dashboard`，第二次登录为 false，错误密码不产生注册事件。
   - 分享接收成功进入 `/dashboard`，失败仍可返回公开首页。
   - `/robots.txt`、`/sitemap.xml` Content-Type 正确，域名与环境变量完全一致。
3. 用 GTM Preview 和 GA4 DebugView 验证首次/SPA page_view、CTA、注册和新建事件均只上报一次。
4. 对公开页运行移动端 Lighthouse、键盘检查和结构化数据验证，记录实际 LCP、CLS、INP，不预设排名收益。
5. 在部署入口配置 HTTPS 以及备用主机名到正式主域名的永久跳转；仓库无 Nginx 配置，不在代码中写死域名。
6. 上线后在 Google Search Console、Bing Webmaster Tools、百度搜索资源平台完成验证并提交同一 sitemap；用 URL 检查/抓取诊断确认真实返回的正文、canonical 和 robots。提交 sitemap 不等于保证收录。

## 第二阶段：基于真实需求扩大自然流量

关键词仅作为搜索意图假设，不宣称未经验证的搜索量：

| 搜索意图簇 | 首选承接页 | 扩展条件 |
| --- | --- | --- |
| Markdown 文档管理、在线 Markdown 编辑器、工程文档管理 | `/` | 持续根据真实查询优化标题、文案与功能说明 |
| Markdown 导出 Word/PDF/HTML、PDF 弹窗与分页问题 | `/manual#export` | 某主题已有独立展示/点击且内容足够完整时再拆独立教程 |
| ADR 模板、RFC 模板、API 文档模板 | `/manual#files` | 制作可预览、可复制、可在产品内使用的完整模板页后再发布 |
| Markdown 大纲、思维导图、实时预览、文档分享 | 手册对应章节 | 根据用户问题补充原创步骤、截图、限制与常见故障 |
| MarkFlow、私有部署、开源项目 | `/about` | 增加真实版本、部署文档和用户案例后再扩展 |

内容扩展规则：

- 每页只解决一个明确任务，提供真实操作步骤、界面截图、示例、限制和产品内继续操作的入口。
- 优先把现有用户问题、搜索查询和产品功能做成完整教程或工具，不做近义词换标题、AI 批量改写、关键词堆砌和自动生成空壳页。
- 拆出新页面时同步精简旧页重复内容并调整 canonical/内链，避免多页互相竞争。
- 通过真实开源仓库、作者渠道和相关技术社区分享有用内容，不购买链接、不批量交换友情链接。

持续观察四类 KPI：

- **技术**：有效索引 URL、抓取错误、重复 canonical、LCP/CLS/INP。
- **获客**：自然搜索展示、点击、CTR、各落地页自然搜索会话。
- **转化**：CTA 点击率、自然搜索注册数与注册转化率。
- **激活**：注册后进入工作台、创建文档成功的比例。

先用上线后的真实数据建立基线，再按“展示高但点击低 → 改善标题摘要；有点击但注册低 → 改善页面匹配与 CTA；注册高但建文档低 → 改善新手流程”的顺序迭代，而不是凭短期排名波动盲目堆页。
