# Context

当前右侧栏只有“导航目录”，数据库只保存文档最新正文，无法回答“谁在什么时间修改过文档”。本次新增真实的“跟进记录”能力：记录正文自动保存和文档重命名，在右侧按当前文档展示，并支持单日筛选、分页、保存后刷新；不制作正文快照，也不复用需要伪造 `commit_hash` 的 `document_commits`。

# 实施方案

## 1. 无损增加活动记录表

- 在 `apps/server/db/schema.sql` 增加 `document_activities`：
  - `id`、`document_id`、`actor_id`、`action_type`、`details_json`、`created_at`。
  - 动作先支持 `content_saved` 和 `title_updated`；标题变化的前后值存入小型 JSON，不保存完整正文。
  - 增加 `(document_id, created_at DESC, id DESC)` 索引，关联文档删除时级联清理记录。
- 在 `apps/server/src/config/database.js::getDb` 首次打开现有数据库时，仅执行该表和索引的 `CREATE IF NOT EXISTS` 定向迁移；不执行全量种子 SQL、不删除或重建任何现有表，保证重复启动无副作用。

## 2. 在真实写入口记录修改人和时间

- 在 `apps/server/src/routes/editor.routes.js` 的 `PUT /:documentId/content` 中保留现有创建者权限校验，校验文档 ID 和正文类型；正文 UPSERT 成功后，使用 `req.user.userId` 写入 `content_saved`，时间使用统一的 UTC ISO 字符串。
- 在 `apps/server/src/routes/sidebar.routes.js` 的 `PUT /tree-nodes/document/:id` 中读取旧标题，仅在实际改名时写入 `title_updated`，记录新旧标题。
- 在 `apps/server/src/config/database.js` 增加小型串行事务辅助函数，将正文/标题更新与活动写入放在同一事务中，避免共享 SQLite 连接下并发事务冲突；任一步骤失败则回滚并返回错误。
- 不给已有文档伪造历史；功能上线前的数据保持为空记录。

## 3. 增加鉴权、日期筛选和分页接口

在 `apps/server/src/routes/document-properties.routes.js` 新增：

`GET /v2.4/document-properties/:documentId/activities?date=YYYY-MM-DD&page=1&pageSize=10`

- 使用现有 `authMiddleware`；文档不存在返回 404，仅创建者或已通过 `user_share_access` 获得分享的用户可查询。
- `date` 可空，提供时校验真实日期；按服务器本地日期过滤。`page` 默认 1，`pageSize` 默认 10、最大 50，非法参数返回 400。
- 关联 `users` 获取真实姓名，按 `created_at DESC, id DESC` 排序，使用参数化 `LIMIT/OFFSET`。
- 返回 `items` 和 `pagination { page, pageSize, total, totalPages }`；每条包含动作、动作说明、详细变更、操作人 `{ id, name }` 和 `createdAt`。

## 4. 前端数据流与保存后刷新

- 在 `apps/web/src/services/api/right-sidebar.js` 新增 `fetchActivities`，复用 `_app.js` 已有的 Bearer Token 请求补丁，支持查询参数、`AbortSignal`、HTTP/业务错误检查。
- 在 `apps/web/src/store/slices/layoutSlice.js` 增加轻量活动刷新信号 `{ documentId, nonce }`，列表数据仍放在右侧组件局部状态。
- 在 `apps/web/src/components/layout/EditorArea.js::debouncedSave` 中，仅在保存成功后发送当前文档的刷新信号；输入过程中不请求活动接口。
- 在 `apps/web/src/components/layout/LeftSidebar/index.js` 重命名成功后发送同一信号，使当前文档的跟进记录能及时更新。

## 5. 右侧“跟进记录”模块

- 修改 `apps/web/src/components/layout/RightSidebar.js`，保留完整大纲解析、标题跳转和滚动高亮逻辑，顶部增加“导航目录 / 跟进记录”页签；折叠右侧栏的图标行为不变。
- 跟进记录页包含：单日日期选择、清除筛选、记录列表、总数、上一页/下一页和页码，每页 10 条。
- 每条直接显示“真实姓名 + 修改了正文/重命名文档 + 完整本地日期时间”；重命名记录展示新旧标题。
- 实现加载、无记录、筛选无结果、失败重试状态；切换文档时清空筛选和列表并回到第一页，保存成功后保留筛选并刷新第一页。
- 请求仅在跟进记录页激活时发送；使用 `AbortController` 和请求序号避免快速切换文档、日期或页码时旧响应覆盖新数据。
- 在 `apps/web/src/pages/index.module.css` 增加紧凑的页签、日期筛选、时间轴和分页样式，列表区域独立滚动，适配现有 320px 右侧栏。

# 验证

1. 重启服务两次，确认活动表和索引自动创建，已有用户、目录和正文数据不变。
2. 用临时账号和临时文档执行正文自动保存、再次保存、重命名，确认每条记录的操作人、动作和 UTC 存储时间准确，删除临时文档时活动级联删除。
3. 验证无 Token、无权限用户、分享只读用户、非法日期和非法分页参数的响应。
4. 构造超过 10 条记录，验证倒序、总数、总页数、翻页、日期筛选及清除筛选。
5. 浏览器验证右侧页签、空/加载/错误状态、保存后刷新、快速切换文档不串数据，并回归大纲跳转与右侧栏折叠。
6. 运行服务端语法检查和 `pnpm --filter web build`，确认无编译回归。
