# 软件开发办公室内部管理系统

基于 Vue 3 + Node.js Express + Microsoft SQL Server 的 B/S 架构内部管理系统。

## 功能模块

- 登录 / 注册 / 重置密码
- 首页仪表盘（统计、公告、动态）
- 个人中心（信息编辑、改密、考核/学习摘要）
- 考核系统（四维评分）
- 我的团队（成员、三列任务看板）
- 课程学习（章节、进度跟踪）
- 管理员后台（用户审核、公告、团队、考核、课程）

## 环境要求

- Node.js 18+
- Microsoft SQL Server 2019+（或 LocalDB）
- SQL Server Management Studio (SSMS)

## 快速开始

### 1. 数据库

在 SSMS 中创建数据库并执行脚本：

```sql
CREATE DATABASE SDO_OA;
GO
```

依次执行：

- `database/schema.sql`
- `database/seed.sql`

### 2. 后端

```bash
cd backend
npm install
copy .env.example .env
# 编辑 .env 配置数据库连接与 JWT_SECRET
npm run dev
```

API 默认运行在 http://localhost:3000

### 3. 前端

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

前端默认运行在 http://localhost:5173

**Windows 快捷启动**：双击 `frontend/start-dev.bat`

### Mock 演示模式（无需数据库）

开发环境已默认开启 `VITE_USE_MOCK=true`（见 `frontend/.env.development`）。  
**仅启动前端**即可登录并浏览全部页面，数据为本地模拟。

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | Admin@123 | 管理员（含系统管理菜单） |
| member1 | Member@123 | 普通成员 |

连接真实后端时，将 `frontend/.env.development` 中 `VITE_USE_MOCK=false` 并重启 dev server。

**测试验证码（Mock 模式）：`888888`** — 用于注册绑定邮箱、找回密码验证。

### 认证页面

- `/login` — 登录 / 注册（左侧滑动切换）
- `/forgot-password` — 找回密码（填写邮箱后显示验证码）
- `/reset-password` — 设置新密码（验证通过后进入）

### 常见问题：npm 弹出「选择打开方式」

部分 Windows 环境中 `C:\Windows\system32\npm` 是一个 **0 字节的空文件**，会导致 `npm run dev` 无法正常执行。

**解决方法（任选其一）：**

1. 使用 `npm.cmd` 代替 `npm`（推荐）：
   ```powershell
   npm.cmd run dev
   ```
2. 双击项目中的 `frontend/start-dev.bat`
3. 直接用 node 启动（已在 package.json 中配置）：
   ```powershell
   node node_modules/vite/bin/vite.js
   ```
4. 修复 PATH：确保 `C:\Program Files\nodejs` 排在 `C:\Windows\system32` **之前**（系统环境变量 → Path）

## 演示账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | Admin@123 | 管理员 |
| member1 | Member@123 | 成员 |
| pending1 | Pending@123 | 待审核（用于演示用户审核） |

## 项目结构

```
OA plan/
├── frontend/     # Vue 3 前端
├── backend/      # Express API
├── database/     # SQL 脚本
└── docs/         # 软工文档
```

## API 前缀

所有接口前缀：`/api/v1`

健康检查：`GET /api/v1/health`
