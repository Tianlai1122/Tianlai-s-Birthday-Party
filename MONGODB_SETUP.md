# 🗄️ MongoDB 数据持久化配置指南

## ⚠️ 重要说明

**问题：** Render 等云平台每次重新部署时会重置文件系统，导致所有用户数据（留言、点赞、小馋猫列表等）丢失。

**解决方案：** 使用 MongoDB 数据库来持久化存储数据。

---

## 📋 配置步骤

### 1️⃣ 创建免费 MongoDB Atlas 账户

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. 注册一个免费账户
3. 创建一个新的集群（选择 **M0 Free Tier**）
4. 选择离你最近的区域（例如：AWS / us-east-1）

### 2️⃣ 配置数据库访问

1. 在左侧菜单点击 **Database Access**
2. 点击 **Add New Database User**
3. 创建用户名和密码（**记住这些信息！**）
4. 权限选择：**Read and write to any database**

### 3️⃣ 配置网络访问

1. 在左侧菜单点击 **Network Access**
2. 点击 **Add IP Address**
3. 选择 **Allow Access from Anywhere** (0.0.0.0/0)
4. 点击 **Confirm**

### 4️⃣ 获取连接字符串

1. 回到 **Database** 页面
2. 点击你的集群的 **Connect** 按钮
3. 选择 **Connect your application**
4. 复制连接字符串，格式类似：
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. 将 `<username>` 和 `<password>` 替换为你在步骤 2 创建的用户名和密码

### 5️⃣ 在 Render 配置环境变量

1. 登录 [Render Dashboard](https://dashboard.render.com/)
2. 找到你的后端服务（`tianlai-s-birthday-party`）
3. 点击进入服务详情页
4. 点击左侧的 **Environment** 标签
5. 点击 **Add Environment Variable**
6. 添加以下环境变量：
   - **Key:** `MONGODB_URI`
   - **Value:** 你的 MongoDB 连接字符串（步骤 4 获取的）
7. 点击 **Save Changes**

### 6️⃣ 重新部署

1. Render 会自动重新部署你的服务
2. 等待部署完成（约 1-2 分钟）
3. 查看日志，应该看到：`✅ MongoDB 连接成功！数据将持久化保存`

---

## ✅ 验证配置

部署完成后，检查 Render 的日志：

**成功的日志：**
```
✅ MongoDB 连接成功！数据将持久化保存
✅ 从 MongoDB 加载数据成功
```

**失败的日志（需要检查配置）：**
```
❌ MongoDB 连接失败，降级使用文件系统
⚠️  未配置 MONGODB_URI，使用文件系统存储
```

---

## 🔄 数据迁移

如果你已经有一些数据在文件系统中，需要迁移到 MongoDB：

1. 下载当前的 `backend/party-data.json` 文件
2. 配置好 MongoDB 后
3. 在 Admin 后台使用"导入数据"功能
4. 或者手动将数据复制到 MongoDB

---

## 💡 工作原理

**代码逻辑：**
1. 服务器启动时尝试连接 MongoDB
2. 如果连接成功，所有数据读写都使用 MongoDB
3. 如果连接失败或未配置，降级使用文件系统（数据会在重新部署时丢失）
4. 数据同时保存到文件系统作为备份

**优势：**
- ✅ 数据永久保存，不会因重新部署而丢失
- ✅ 自动备份到文件系统
- ✅ 向后兼容（没有 MongoDB 也能运行）
- ✅ 免费（MongoDB Atlas M0 Free Tier）

---

## 🆘 常见问题

### Q: 连接字符串中的密码包含特殊字符怎么办？
A: 需要对密码进行 URL 编码。例如：
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`

或者在创建数据库用户时使用不包含特殊字符的密码。

### Q: 如何查看 MongoDB 中的数据？
A: 
1. 登录 MongoDB Atlas
2. 点击 **Browse Collections**
3. 选择 `birthday-party` 数据库
4. 查看 `party-data` 集合

### Q: 数据会自动同步吗？
A: 是的，每次用户操作（点赞、留言、添加小馋猫等）都会自动保存到 MongoDB。

### Q: 如果我不配置 MongoDB 会怎样？
A: 服务器会继续使用文件系统存储，但每次重新部署时数据会丢失。

---

## 📞 需要帮助？

如果配置过程中遇到问题，请检查：
1. MongoDB 连接字符串是否正确
2. 用户名和密码是否正确
3. 网络访问是否允许所有 IP
4. Render 环境变量是否正确设置

---

**配置完成后，你的派对网站数据将永久保存！** 🎉

