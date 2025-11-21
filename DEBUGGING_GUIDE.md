# 🔍 Noah 和 Krystal 卡片诊断指南

## 问题描述
Noah（夜宵栏）和 Krystal（饭后点心栏）的卡片在网页上看不到。

## 诊断步骤

### 1. 打开浏览器开发者工具
- **Chrome/Edge**: 按 `F12` 或 `Ctrl+Shift+I`（Windows）/ `Cmd+Option+I`（Mac）
- **Firefox**: 按 `F12` 或 `Ctrl+Shift+I`（Windows）/ `Cmd+Option+I`（Mac）
- **Safari**: 按 `Cmd+Option+I`（Mac）

### 2. 查看 Console 标签
点击开发者工具中的 **Console** 标签

### 3. 查找关键日志信息

#### 检查 supportMembers 是否加载
查找以下日志：
```
✅ Loaded 16 support members: [...]
```

如果看到这条日志，说明 supportMembers 已正确加载。

#### 检查 renderCategoryMembers 是否被调用
查找以下日志：
```
🔍 Processing category: food
📋 All supportMembers: [...]
📊 Category food has 1 support members: [...]
```

#### 检查 Noah 卡片是否被渲染
查找以下日志：
```
📊 Category food has 1 support members: [
  {
    id: 'noah',
    name: '@Noah',
    role: '当晚的大厨',
    category: 'food',
    ...
  }
]
```

### 4. 常见问题和解决方案

#### 问题 1: supportMembers 为空
**日志显示**:
```
✅ Loaded 0 support members
```

**原因**: 后端数据加载失败

**解决方案**:
- 检查后端是否正在运行
- 检查网络连接
- 刷新页面

#### 问题 2: supportMembers 没有 category 字段
**日志显示**:
```
📊 Category food has 0 support members
```

**原因**: supportMembers 中的成员没有 `category` 字段

**解决方案**:
- 清除浏览器缓存
- 清除 localStorage: 在 Console 中运行 `localStorage.clear()`
- 刷新页面

#### 问题 3: 容器找不到
**日志显示**:
```
⚠️ Container food-team-grid not found
```

**原因**: HTML 中没有 `id="food-team-grid"` 的元素

**解决方案**:
- 检查 `frontend/index.html` 中是否有这个容器
- 确保 HTML 正确加载

### 5. 完整的诊断流程

在浏览器 Console 中运行以下命令：

```javascript
// 1. 检查 supportMembers 是否存在
console.log('supportMembers:', supportMembers);

// 2. 检查 food 分类的成员
console.log('Food members:', supportMembers.filter(m => m.category === 'food'));

// 3. 检查 dessert 分类的成员
console.log('Dessert members:', supportMembers.filter(m => m.category === 'dessert'));

// 4. 检查 drinks 分类的成员
console.log('Drinks members:', supportMembers.filter(m => m.category === 'drinks'));

// 5. 检查容器是否存在
console.log('food-team-grid:', document.getElementById('food-team-grid'));
console.log('dessert-team-grid:', document.getElementById('dessert-team-grid'));
console.log('drinks-team-grid:', document.getElementById('drinks-team-grid'));

// 6. 手动调用渲染函数
renderAllTeamMembers();
```

### 6. 预期的输出

如果一切正常，您应该看到：

```javascript
supportMembers: Array(16)
  0: {id: 'noah', name: '@Noah', category: 'food', ...}
  1: {id: 'krystal', name: '@Krystal', category: 'dessert', ...}
  2: {id: 'lizhehao', name: '@李哲豪', category: 'drinks', ...}
  ...

Food members: Array(1)
  0: {id: 'noah', name: '@Noah', category: 'food', ...}

Dessert members: Array(1)
  0: {id: 'krystal', name: '@Krystal', category: 'dessert', ...}

Drinks members: Array(1)
  0: {id: 'lizhehao', name: '@李哲豪', category: 'drinks', ...}

food-team-grid: <div class="team-grid" id="food-team-grid">...</div>
dessert-team-grid: <div class="team-grid" id="dessert-team-grid">...</div>
drinks-team-grid: <div class="team-grid" id="drinks-team-grid">...</div>
```

### 7. 如果问题仍未解决

请提供以下信息：
1. 浏览器 Console 中的完整日志输出
2. `supportMembers` 的内容
3. 容器是否存在
4. 是否有任何错误信息

---

**最后更新**: 2025-11-21

