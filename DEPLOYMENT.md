# 🚀 生日派对网站 - 前后端分离部署指南

## 📋 项目结构

```
Tianlai-s-Birthday-Party/
├── frontend/              # 前端静态文件 → 部署到 Vercel
│   ├── index.html
│   ├── admin.html
│   ├── styles.css
│   ├── app.js
│   ├── i18n.js
│   ├── 图片/
│   └── vercel.json
│
├── backend/               # 后端 API 服务 → 部署到 Render
│   ├── server.js
│   ├── package.json
│   └── party-data.json
│
└── README.md
```

---

## 🎯 部署架构

| 部分 | 文件位置 | 部署平台 | 作用 |
|------|---------|---------|------|
| 前端 | `/frontend` | ✅ Vercel | 静态网页（HTML/CSS/JS） |
| 后端 | `/backend` | ✅ Render | Node.js API 服务器 |

---

## 📦 第一步：上传到 GitHub

### 1️⃣ 初始化 Git 仓库（如果还没有）

```bash
cd /Users/tianlaizhang/Downloads/LOL
git init
git add .
git commit -m "前后端分离架构"
```

### 2️⃣ 创建 GitHub 仓库

1. 访问 [github.com](https://github.com)
2. 点击右上角 **"+"** → **"New repository"**
3. 仓库名：`Tianlai-Birthday-Party`（或任意名字）
4. 选择 **Public** 或 **Private**
5. **不要**勾选 "Add a README file"
6. 点击 **"Create repository"**

### 3️⃣ 推送到 GitHub

```bash
git remote add origin https://github.com/你的用户名/Tianlai-Birthday-Party.git
git branch -M main
git push -u origin main
```

---

## 🎨 第二步：部署前端到 Vercel

### 1️⃣ 登录 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 点击 **"Sign Up"** 或 **"Login"**
3. 选择 **"Continue with GitHub"**

### 2️⃣ 导入项目

1. 点击 **"Add New..."** → **"Project"**
2. 找到你的 GitHub 仓库 `Tianlai-Birthday-Party`
3. 点击 **"Import"**

### 3️⃣ 配置部署设置

**重要！** 在配置页面设置：

| 设置项 | 值 |
|--------|-----|
| **Framework Preset** | `Other` |
| **Root Directory** | `frontend` ← 点击 "Edit" 选择 |
| **Build Command** | 留空 |
| **Output Directory** | 留空 |
| **Install Command** | 留空 |

### 4️⃣ 部署

1. 点击 **"Deploy"**
2. 等待 1-2 分钟
3. 部署成功后会显示：✅ **Ready**
4. 你会得到一个 URL，例如：
   ```
   https://tianlai-birthday-party.vercel.app
   ```

### 5️⃣ 记录前端 URL

**复制这个 URL！** 后面配置后端时需要用到。

---

## ⚙️ 第三步：部署后端到 Render

### 1️⃣ 登录 Render

1. 访问 [render.com](https://render.com)
2. 点击 **"Get Started"** 或 **"Sign In"**
3. 选择 **"GitHub"** 登录

### 2️⃣ 创建 Web Service

1. 点击 **"New +"** → **"Web Service"**
2. 点击 **"Connect a repository"**
3. 找到你的仓库 `Tianlai-Birthday-Party`
4. 点击 **"Connect"**

### 3️⃣ 配置部署设置

| 设置项 | 值 |
|--------|-----|
| **Name** | `tianlai-backend`（或任意名字） |
| **Region** | `Singapore` 或 `Oregon (US West)` |
| **Root Directory** | `backend` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

### 4️⃣ 部署

1. 点击 **"Create Web Service"**
2. 等待 3-5 分钟（首次部署较慢）
3. 部署成功后会显示：✅ **Live**
4. 你会得到一个 URL，例如：
   ```
   https://tianlai-backend.onrender.com
   ```

### 5️⃣ 记录后端 URL

**复制这个 URL！** 马上要用到。

---

## 🔗 第四步：连接前端和后端

### 1️⃣ 更新前端的 API 地址

在你的本地项目中，编辑 `frontend/app.js`：

```javascript
// 找到第 1-6 行，修改为：
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://tianlai-backend.onrender.com/api'; // 👈 替换为你的后端 URL
```

**替换规则：**
- 把 `YOUR_BACKEND_URL` 改为你的 Render URL
- 例如：`https://tianlai-backend.onrender.com/api`

### 2️⃣ 更新后端的 CORS 配置

编辑 `backend/server.js`：

```javascript
// 找到第 15-20 行，修改为：
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://tianlai-birthday-party.vercel.app', // 👈 替换为你的前端 URL
        /\.vercel\.app$/
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
```

**替换规则：**
- 把 `YOUR_FRONTEND_URL` 改为你的 Vercel URL
- 例如：`https://tianlai-birthday-party.vercel.app`

### 3️⃣ 提交并推送更改

```bash
git add .
git commit -m "配置前后端连接"
git push
```

### 4️⃣ 等待自动重新部署

- **Vercel** 会自动检测到 push，重新部署前端（约 1 分钟）
- **Render** 会自动检测到 push，重新部署后端（约 3 分钟）

---

## 🎉 第五步：测试部署

### 1️⃣ 访问前端网站

打开浏览器，访问你的 Vercel URL：
```
https://tianlai-birthday-party.vercel.app
```

### 2️⃣ 测试功能

- ✅ 点击 😍 按钮（点赞）
- ✅ 发送留言
- ✅ 添加"我也想帮忙"
- ✅ 创建游戏组局
- ✅ 投票

### 3️⃣ 检查后端连接

打开浏览器控制台（F12），查看 Network 标签：
- 应该看到请求发送到 `https://tianlai-backend.onrender.com/api/...`
- 状态码应该是 `200 OK`

---

## 🔄 如何更新内容

### 📝 修改前端（HTML/CSS/JS）

1. 在本地修改 `frontend/` 文件夹中的文件
2. 提交并推送：
   ```bash
   git add .
   git commit -m "更新前端样式"
   git push
   ```
3. **Vercel 自动重新部署**（约 1 分钟）

### ⚙️ 修改后端（API 逻辑）

1. 在本地修改 `backend/server.js`
2. 提交并推送：
   ```bash
   git add .
   git commit -m "更新后端 API"
   git push
   ```
3. **Render 自动重新部署**（约 3 分钟）

### 🚀 同时修改前后端

```bash
git add .
git commit -m "更新前后端功能"
git push
```

**两个平台都会自动检测并重新部署！** ✨

---

## ❓ 常见问题

### Q1: 为什么点赞、留言等功能不工作？

**原因：** 前端无法连接到后端 API

**解决步骤：**
1. 检查 `frontend/app.js` 中的 `API_URL` 是否正确
2. 检查 `backend/server.js` 中的 CORS 配置是否包含你的前端 URL
3. 打开浏览器控制台（F12）→ Network 标签，查看 API 请求状态
4. 如果看到 CORS 错误，重新检查步骤四

### Q2: Render 后端部署失败？

**常见原因：**
- Root Directory 没有设置为 `backend`
- Build Command 或 Start Command 错误
- package.json 不在 backend 文件夹中

**解决方法：**
1. 在 Render 项目设置中，确认 Root Directory = `backend`
2. 确认 Build Command = `npm install`
3. 确认 Start Command = `node server.js`

### Q3: 数据会丢失吗？

**Render 免费版：**
- ⚠️ 15 分钟无活动会休眠
- ⚠️ 重启后 `party-data.json` 会重置

**✅ 推荐解决方案：使用 Supabase（免费且稳定）**
- 查看 `SUPABASE_QUICKSTART.md` 快速配置指南
- 或查看 `SUPABASE_SETUP.md` 详细配置指南
- 5 分钟完成配置，数据永久保存！

### Q4: Admin 后台怎么访问？

**前端访问：**
```
https://tianlai-birthday-party.vercel.app/admin.html
```

**注意：** Admin 后台的 API 也需要连接到 Render 后端。

### Q5: 本地开发怎么办？

**启动后端：**
```bash
cd backend
npm install
node server.js
```

**访问前端：**
- 直接打开 `frontend/index.html`
- 或使用 Live Server 插件

**API 会自动切换到 localhost:3000**

### Q6: 如何查看部署日志？

**Vercel：**
1. 登录 Vercel
2. 选择项目
3. 点击 "Deployments"
4. 点击最新的部署 → "View Function Logs"

**Render：**
1. 登录 Render
2. 选择 Web Service
3. 点击 "Logs" 标签

---

## 💡 优化建议

### 1️⃣ 自定义域名

**Vercel：**
- Settings → Domains → Add Domain
- 输入你的域名（如 `birthday.tianlai.com`）

**Render：**
- Settings → Custom Domain
- 输入你的域名（如 `api.tianlai.com`）

### 2️⃣ 环境变量

如果需要保护敏感信息：

**Render：**
- Settings → Environment → Add Environment Variable
- 例如：`API_KEY=your_secret_key`

**在代码中使用：**
```javascript
const apiKey = process.env.API_KEY;
```

### 3️⃣ 数据持久化（推荐）

**✅ 使用 Supabase（免费且稳定）：**

1. 查看 `SUPABASE_QUICKSTART.md` - 5 分钟快速配置
2. 或查看 `SUPABASE_SETUP.md` - 详细配置指南
3. 完全免费，比 MongoDB 更稳定
4. 友好的可视化界面查看数据

---

## 📞 需要帮助？

### 检查清单

- [ ] GitHub 仓库已创建并推送
- [ ] Vercel 前端部署成功
- [ ] Render 后端部署成功
- [ ] `frontend/app.js` 中的 API_URL 已更新
- [ ] `backend/server.js` 中的 CORS 配置已更新
- [ ] 浏览器控制台没有错误
- [ ] Network 标签显示 API 请求成功

### 调试技巧

1. **前端问题：** 打开浏览器控制台（F12）
2. **后端问题：** 查看 Render Logs
3. **CORS 问题：** 检查 Network 标签的 Response Headers

---

## 🎉 部署成功！

**前端地址：** `https://tianlai-birthday-party.vercel.app`
**后端地址：** `https://tianlai-backend.onrender.com`

所有功能应该都能正常工作了！🎊

---

## 📚 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [Render 文档](https://render.com/docs)
- [Express.js 文档](https://expressjs.com/)
- [CORS 配置指南](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

