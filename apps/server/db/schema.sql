-- ==============================================================================
-- MarkFlow V2.4 认证模块 SQLite 表结构定义
-- ==============================================================================

-- 1. 用户表 (users)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,        -- 用户唯一标识 ID (对应 API 的 data.user.id)
    email VARCHAR(255) NOT NULL UNIQUE,          -- 用户邮箱 (对应 API 的 data.user.email，作为登录账号)
    password_hash VARCHAR(255) NOT NULL,         -- 登录密码哈希值 (千万不要存明文，建议使用 bcrypt 存储)
    name VARCHAR(100) NOT NULL,                  -- 用户昵称/花名 (对应 API 的 data.user.name)
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',  -- 系统角色 (对应 API 的 data.user.role，如: Owner / Staff Arch)
    avatar_url VARCHAR(500),                     -- 用户头像 URL (对应 API 的 data.user.avatarUrl)
    status INTEGER NOT NULL DEFAULT 1,           -- 账号状态 (1: 正常, 0: 禁用)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

-- 创建索引以优化登录时的邮箱查询速度
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==============================================================================
-- 2. 密码重置记录表 (password_resets)
-- ==============================================================================
-- 专门用于存储和管理找回密码流程中下发的 resetToken 及有效期
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,                      -- 关联申请重置的用户 ID
    reset_token VARCHAR(255) NOT NULL UNIQUE,      -- 唯一的临时重置授权凭证
    expires_at DATETIME NOT NULL,                  -- 凭证过期时间 (按文档提示通常为生成后 15 分钟)
    used BOOLEAN NOT NULL DEFAULT 0,               -- 是否已被使用 (0: 未使用, 1: 已使用)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引以优化验证重置 Token 的速度
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(reset_token);

-- ==============================================================================
-- 3. 用户会话/设备登录记录表 (user_sessions)
-- ==============================================================================
-- 用于管理多设备登录，并支持 "登出其他所有已登录设备" (logoutOther) 需求
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,                      -- 关联的用户 ID
    session_token VARCHAR(500) NOT NULL UNIQUE,    -- JWT Token 或 Session ID
    device_info VARCHAR(255),                      -- 设备标识或 User-Agent
    ip_address VARCHAR(45),                        -- 登录 IP (支持 IPv6)
    is_active BOOLEAN NOT NULL DEFAULT 1,          -- 会话是否仍然有效 (0: 被登出/过期, 1: 活跃)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 登录时间
    last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 最后活跃时间
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引以优化根据 user_id 强制登出其他设备的查询性能
CREATE INDEX IF NOT EXISTS idx_user_sessions_userid ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- ==============================================================================
-- 4. 工作区/知识库表 (workspaces)
-- ==============================================================================
-- 用于管理顶部导航面包屑中的 workspaceName
CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,                    -- 工作区名称 (对应 API: Engineering Wiki)
    owner_id INTEGER NOT NULL,                     -- 工作区所有者
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- ==============================================================================
-- 5. 树形目录节点表 (tree_nodes)
-- ==============================================================================
-- 用于管理侧边栏结构，并支撑顶部面包屑 (paths) 的层级反查
CREATE TABLE IF NOT EXISTS tree_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,                 -- 所属工作区
    parent_id INTEGER,                             -- 父节点 ID (为空则是根目录)
    node_type VARCHAR(20) NOT NULL,                -- 'folder' 或 'document'
    title VARCHAR(255) NOT NULL,                   -- 节点名称 (如: 架构设计 / ADR-004-存储选型.md)
    status VARCHAR(50),                            -- 文档状态 (如: review, final, draft)
    sort_order INTEGER DEFAULT 0,                  -- 排序权重
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES tree_nodes(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 6. 分享链接表 (share_links)
-- ==============================================================================
-- 用于支撑 "生成文档分享链接" 接口
CREATE TABLE IF NOT EXISTS share_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    share_token VARCHAR(100) NOT NULL UNIQUE,      -- 短链接标识 (如: xyz789)
    target_id INTEGER NOT NULL,                    -- 目标文档或文件夹的 ID (关联 tree_nodes.id)
    creator_id INTEGER NOT NULL,                   -- 创建此分享链接的用户 ID
    expires_at DATETIME,                           -- 过期时间 (为空表示永久有效)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_id) REFERENCES tree_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(share_token);

-- ==============================================================================
-- 7. 文档正文内容表 (document_contents)
-- ==============================================================================
-- 用于存储中间编辑区的 Markdown 纯文本源码，支持防抖自动保存
CREATE TABLE IF NOT EXISTS document_contents (
    document_id INTEGER PRIMARY KEY,               -- 关联 tree_nodes.id，一对一关系
    source TEXT NOT NULL,                          -- Markdown 纯文本源码内容
    last_saved_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 最后一次成功备份/保存的时间
    FOREIGN KEY (document_id) REFERENCES tree_nodes(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 8. AI 润色日志表 (ai_polish_logs)
-- ==============================================================================
-- 用于记录 AI 智能架构润色功能的请求与响应结果，方便审计与效果回溯
CREATE TABLE IF NOT EXISTS ai_polish_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,                  -- 关联正在编辑的文档
    mode VARCHAR(50) NOT NULL DEFAULT 'enhance_semantic', -- 润色模式
    original_text TEXT NOT NULL,                   -- 用户选中的原始文本
    suggested_text TEXT NOT NULL,                  -- AI 建议的优化文本
    confidence REAL,                               -- 置信度 (如: 99.4)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 请求时间
    FOREIGN KEY (document_id) REFERENCES tree_nodes(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 9. 文档标签映射表 (document_tags)
-- ==============================================================================
-- 用于存储右侧面板中关联的知识标签数组
CREATE TABLE IF NOT EXISTS document_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,                  -- 关联 tree_nodes.id
    tag_name VARCHAR(50) NOT NULL,                 -- 标签名称
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES tree_nodes(id) ON DELETE CASCADE,
    UNIQUE(document_id, tag_name)
);

-- ==============================================================================
-- 10. 文档依赖关联表 (document_dependencies)
-- ==============================================================================
-- 用于存储文档间的 DEPENDS_ON 关系（前置文档）
CREATE TABLE IF NOT EXISTS document_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,                  -- 当前文档 ID
    depends_on_id INTEGER NOT NULL,                -- 依赖的前置文档 ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES tree_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_id) REFERENCES tree_nodes(id) ON DELETE CASCADE,
    UNIQUE(document_id, depends_on_id)
);

-- ==============================================================================
-- 11. 文档 Git 提交版本表 (document_commits)
-- ==============================================================================
-- 用于模拟/记录文档的 Git 提交历史，支持右侧面板的版本轴展示
CREATE TABLE IF NOT EXISTS document_commits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,                  -- 关联 tree_nodes.id
    commit_hash VARCHAR(40) NOT NULL UNIQUE,       -- 简短的 Commit Hash (如 8f2b10a)
    message VARCHAR(500) NOT NULL,                 -- 提交说明信息
    author_id INTEGER NOT NULL,                    -- 提交作者 (关联 users.id)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 提交时间 (前端据此计算 timeAgo)
    FOREIGN KEY (document_id) REFERENCES tree_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_document_commits_docid ON document_commits(document_id);

-- ==============================================================================
-- 12. 用户侧边栏偏好配置表 (user_sidebar_preferences)
-- ==============================================================================
-- 用于持久化左侧边栏的 UI 状态（导航高亮、展开的树节点等）
CREATE TABLE IF NOT EXISTS user_sidebar_preferences (
    user_id INTEGER PRIMARY KEY,                   -- 关联 users.id，一对一关系
    active_nav_item VARCHAR(50) DEFAULT 'files',   -- 当前激活的主导航标识
    expanded_nodes TEXT DEFAULT '[]',              -- 展开的目录树节点 ID 数组 (JSON 字符串存储)
    is_left_sidebar_open BOOLEAN DEFAULT 1,        -- 左侧边栏是否处于展开状态
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 最后更新时间
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 13. 常驻书签表 (user_bookmarks)
-- ==============================================================================
-- 用于渲染左侧边栏底部的“常驻书签 (BOOKMARKS)”快捷入口
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,                      -- 所属用户
    title VARCHAR(255) NOT NULL,                   -- 书签显示名称
    url VARCHAR(500),                              -- 跳转路由或外部链接
    icon_color VARCHAR(20),                        -- 图标自定义颜色 (如 #f59e0b)
    sort_order INTEGER DEFAULT 0,                  -- 排序权重
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_userid ON user_bookmarks(user_id);

-- ==============================================================================
-- 初始化测试数据 (工作区与目录树)
-- ==============================================================================
INSERT OR IGNORE INTO users (email, password_hash, name, role, avatar_url)
VALUES (
    'alex.chen@markflow.io',
    '$2b$10$YourHashedPasswordHere...', -- 实际开发中请通过后端 bcrypt 加密后写入
    'Alex Chen',
    'Owner / Staff Arch',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
);-- 初始化默认工作区
INSERT OR IGNORE INTO workspaces (id, name, owner_id) VALUES (1, 'Engineering Wiki', 1);

-- 初始化目录树节点 (文件夹)
INSERT OR IGNORE INTO tree_nodes (id, workspace_id, parent_id, node_type, title, status, sort_order) VALUES
(1, 1, NULL, 'folder', '架构设计', NULL, 1),
(2, 1, NULL, 'folder', 'API 文档', NULL, 2),
(3, 1, NULL, 'folder', '开发规范', NULL, 3);

-- 初始化目录树节点 (文档)
INSERT OR IGNORE INTO tree_nodes (id, workspace_id, parent_id, node_type, title, status, sort_order) VALUES
(4, 1, 1, 'document', 'ADR-004-存储选型.md', 'review', 1),
(5, 1, 1, 'document', 'ADR-005-分布式元数据同步方案.md', 'draft', 2),
(6, 1, 2, 'document', 'v2.4-登录与认证接口文档.md', 'final', 1),
(7, 1, 3, 'document', '前端编码规范.md', 'draft', 1);

-- 初始化对应的正文内容
INSERT OR IGNORE INTO document_contents (document_id, source) VALUES
(4, '# ADR-004 存储选型\n\n## 1. 背景\n随着系统规模扩大，我们需要选择合适的数据库...\n\n## 2. 方案对比\n- **MySQL**: 关系型，稳定...\n- **SQLite**: 轻量，无需独立进程...\n\n## 3. 决定\n采用 SQLite 作为初始存储方案。'),
(5, '# ADR-005 分布式元数据同步方案\n\n草稿中...'),
(6, '# v2.4 登录与认证接口文档\n\n## POST /api/v2.4/auth/login\n登录接口说明...'),
(7, '# 前端编码规范\n\n## 1. 缩进\n使用 2 个空格。');
