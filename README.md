# MarkFlow

> 文件优先 · 本地主权 · 现代工程文档系统

MarkFlow 是一个面向工程文档的 Markdown 管理工作台，提供目录树管理、源码编辑、实时预览、思维导图、全文搜索、文档分享和多格式导出能力。

本项目为个人开源项目，当前提供演示版本。如需私有部署，请联系作者：**小洪**。

## 功能特性

- **文档与目录管理**：支持多级目录、新建、重命名、删除，以及空白、ADR、RFC、API 接口等文档模板。
- **四种编辑视图**：纯源码、分屏对齐、只读渲染、解析脑图。
- **Markdown 编辑体验**：提供常用格式工具栏、自动保存、双向同步滚动和正文锚点跳转。
- **实时导航大纲**：解析一到六级标题，支持点击定位、阅读位置高亮和面板折叠。
- **搜索与分享**：支持按文档标题和正文搜索，并可生成文档分享链接。
- **多格式导出**：支持导出 Markdown、HTML、PDF 和 Word，导出样式与只读预览保持一致。
- **本地数据存储**：使用 SQLite 保存用户、目录、文档和分享数据，并每日自动备份数据库。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 前端 | Next.js 14、React 18、Redux Toolkit |
| 编辑器与预览 | Monaco Editor、React Markdown、Markmap |
| 后端 | Node.js、Express |
| 数据库 | SQLite |
| 包管理 | pnpm Workspace Monorepo |

## 环境要求

- Node.js 18.17 或更高版本，推荐使用 Node.js 20 LTS
- pnpm
- SQLite 命令行工具（仅首次初始化数据库时需要）

如果尚未安装 pnpm：

```bash
npm install -g pnpm
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/youyongba/markflow.git
cd markflow
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置开发环境

在项目根目录新建 `.env.development`：

```dotenv
NODE_ENV=development
NEXT_PUBLIC_API_MODE=development
PORT=3106
```

### 4. 初始化数据库

首次运行时执行：

```bash
sqlite3 apps/server/db/markflow.db < apps/server/db/schema.sql
```

数据库文件位于 `apps/server/db/markflow.db`，已被 `.gitignore` 忽略，不需要提交到仓库。

### 5. 启动开发服务

```bash
pnpm dev
```

访问：<http://localhost:3106>

后端服务会同时启动 Next.js 前端，无需分别启动 `web` 和 `server`。首次使用新邮箱登录时会自动注册账号。

## 生产环境运行

在项目根目录新建 `.env.production`：

```dotenv
NODE_ENV=production
NEXT_PUBLIC_API_MODE=production
PORT=3106
```

先构建，再启动：

```bash
pnpm build
pnpm start
```

生产模式必须提前执行 `pnpm build`。修改代码后，需要重新构建再启动。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 使用 `.env.development` 启动开发服务 |
| `pnpm dev:mock` | 使用 `.env.mock` 启动 Mock 环境 |
| `pnpm build` | 使用 `.env.production` 构建全部工作区 |
| `pnpm build:test` | 使用 `.env.test` 构建测试环境 |
| `pnpm start` | 使用 `.env.production` 启动生产服务 |
| `pnpm start:test` | 使用 `.env.test` 启动测试服务 |

使用 Mock 或测试环境前，请先在项目根目录创建对应的环境变量文件。

## 项目结构

```text
markflow/
├── apps/
│   ├── web/                    # Next.js 前端、编辑器与页面组件
│   └── server/                 # Express 服务、API 与 SQLite 数据库
│       ├── db/
│       │   ├── schema.sql      # 数据库表结构
│       │   ├── markflow.db     # 本地数据库，不提交
│       │   └── backups/        # 自动备份目录，不提交
│       └── src/
├── packages/
│   ├── shared-constants/       # 共享常量与业务枚举
│   ├── shared-types/           # 共享接口与响应结构
│   └── shared-utils/           # 共享工具函数
├── pnpm-workspace.yaml
└── package.json
```

## 数据与备份

- 数据库路径：`apps/server/db/markflow.db`
- 备份目录：`apps/server/db/backups/`
- 服务运行期间，每天 0 点使用 SQLite `VACUUM INTO` 生成一致性备份。
- 数据库、备份文件、环境变量、依赖和构建产物均不应提交到 Git 仓库。

## 使用手册

启动服务后，访问 <http://localhost:3106/manual> 查看完整使用手册。

## 微信交流群

欢迎扫码加入 MarkFlow 微信交流群，交流使用经验、反馈问题或咨询私有部署。如二维码过期，请联系作者小洪更新。

<p align="center">
  <img src="./apps/web/public/images/群二维码.jpg" alt="MarkFlow 微信交流群二维码" width="260">
</p>

## 作者

**小洪** · 个人开源项目
