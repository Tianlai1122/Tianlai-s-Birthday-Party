# ⚡ Supabase 快速配置指南

## 🎯 5 分钟完成配置

### 步骤 1：创建 Supabase 项目（2 分钟）

1. 访问 [supabase.com](https://supabase.com) → 用 GitHub 登录
2. 点击 **"New Project"**
3. 填写：
   - Name: `tianlai-birthday-party`
   - Password: 设置一个强密码
   - Region: `Southeast Asia (Singapore)` 或 `Northeast Asia (Tokyo)`
4. 点击 **"Create new project"** → 等待 1-2 分钟

---

### 步骤 2：创建数据表（1 分钟）

1. 左侧菜单 → **"Table Editor"** → **"Create a new table"**
2. 填写：
   - Name: `party_data`
   - **取消勾选** "Enable Row Level Security (RLS)"
3. 添加列：

| Name | Type | Default Value | Primary |
|------|------|---------------|---------|
| `id` | `text` | - | ✅ |
| `data` | `jsonb` | - | ❌ |
| `updated_at` | `timestamptz` | `now()` | ❌ |

4. 点击 **"Save"**

---

### 步骤 3：插入初始数据（30 秒）

1. 在 Table Editor 中，点击 **"Insert row"**
2. 填写：
   - **id**: `main`
   - **data**: 点击 "Edit JSON"，粘贴：

```json
{
  "foodies": [],
  "drinkers": [],
  "gamePreferences": [],
  "vibeVotes": [],
  "krystalLikes": 0,
  "memberLikes": {},
  "memberComments": {},
  "customMembers": [],
  "gameLobbies": [],
  "visits": 0,
  "lastVisit": null,
  "visitHistory": []
}
```

3. 点击 **"Save"**

---

### 步骤 4：获取 API 凭证（30 秒）

1. 左侧菜单 → **"Settings"** (齿轮) → **"API"**
2. 复制以下两个值：

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```

**API Key (anon, public):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 步骤 5：配置 Render（1 分钟）

1. 访问 [dashboard.render.com](https://dashboard.render.com/)
2. 选择你的后端服务 → **"Environment"**
3. 添加两个环境变量：

```
SUPABASE_URL = https://xxxxxxxxxxxxx.supabase.co
SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. 点击 **"Save Changes"**

---

### 步骤 6：推送代码（30 秒）

在本地运行：

```bash
cd backend
npm install
cd ..
git add .
git commit -m "迁移到 Supabase"
git push
```

---

## ✅ 验证

等待 Render 重新部署（2-3 分钟），然后查看日志：

**成功标志：**
```
✅ Supabase 连接成功！数据将持久化保存
✅ 从 Supabase 加载数据成功
```

---

## 🎉 完成！

现在你的数据将：
- ✅ 永久保存
- ✅ 不会因重新部署而丢失
- ✅ 可以在 Supabase Dashboard 查看

---

## 🆘 遇到问题？

### 连接失败

**检查：**
1. Render 环境变量是否正确
2. Supabase URL 和 Key 是否完整复制
3. 表名是否为 `party_data`
4. RLS 是否已禁用

### 数据不保存

**检查：**
1. 在 Supabase Table Editor 中查看数据
2. 检查 Render 日志是否有错误
3. 确认 `id = main` 的行存在

---

## 📚 详细文档

查看 `SUPABASE_SETUP.md` 获取完整配置指南。

