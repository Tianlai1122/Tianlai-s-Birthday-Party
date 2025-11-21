const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

// 创建两个 Express 应用
const mainApp = express();
const adminApp = express();

const MAIN_PORT = process.env.PORT || 3000;
const ADMIN_PORT = 3001;
const DATA_FILE = path.join(__dirname, 'party-data.json');

// CORS 配置 - 允许 Vercel 前端访问
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://tianlai-s-birthday-party.vercel.app',
        /\.vercel\.app$/ // 允许所有 vercel.app 子域名
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

// 主应用中间件
mainApp.use(cors(corsOptions));
mainApp.use(express.json());

// 管理应用中间件
adminApp.use(cors(corsOptions));
adminApp.use(express.json());

// 初始化数据
let data = {
    foodies: [],
    drinkers: [],
    gamePreferences: [],
    vibeVotes: [],
    krystalLikes: 0,
    memberLikes: {},
    memberComments: {},
    customMembers: [],
    gameLobbies: [],
    visits: 0,
    lastVisit: null,
    visitHistory: []
};

// 加载数据
async function loadData() {
    try {
        const fileData = await fs.readFile(DATA_FILE, 'utf8');
        data = JSON.parse(fileData);
        console.log('数据已加载');
    } catch (error) {
        console.log('创建新数据文件');
        await saveData();
    }
}

// 保存数据
async function saveData() {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        console.log('数据已保存');
    } catch (error) {
        console.error('保存数据失败:', error);
    }
}

// 注册 API 路由到两个应用
function registerRoutes(app) {
    // 获取数据
    app.get('/api/data', (req, res) => {
        res.json(data);
    });

    // 保存数据
    app.post('/api/data', async (req, res) => {
        data = { ...data, ...req.body };
        await saveData();
        res.json({ success: true });
    });

    // 记录访问
    app.post('/api/visit', async (req, res) => {
        const visitInfo = {
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };

        data.visits++;
        data.lastVisit = visitInfo.timestamp;
        data.visitHistory.push(visitInfo);

        // 只保留最近100次访问记录
        if (data.visitHistory.length > 100) {
            data.visitHistory = data.visitHistory.slice(-100);
        }

        await saveData();
        res.json({ success: true });
    });

    // 添加小馋猫
    app.post('/api/foodies', async (req, res) => {
        const { name } = req.body;

        if (!name || data.foodies.includes(name)) {
            return res.status(400).json({ error: '名字无效或已存在' });
        }

        data.foodies.push(name);
        await saveData();
        res.json({ success: true, foodies: data.foodies });
    });

    // 添加/更新逃酒记录
    app.post('/api/drinkers', async (req, res) => {
        const { name, count } = req.body;

        if (!name || !count || count < 1) {
            return res.status(400).json({ error: '数据无效' });
        }

        const existingIndex = data.drinkers.findIndex(d => d.name === name);
        if (existingIndex !== -1) {
            data.drinkers[existingIndex].count = count;
        } else {
            data.drinkers.push({ name, count });
        }

        data.drinkers.sort((a, b) => b.count - a.count);
        await saveData();
        res.json({ success: true, drinkers: data.drinkers });
    });

    // 添加/更新游戏偏好
    app.post('/api/game-preferences', async (req, res) => {
        const { name, preference } = req.body;

        if (!name || !preference) {
            return res.status(400).json({ error: '数据无效' });
        }

        const existingIndex = data.gamePreferences.findIndex(p => p.name === name);
        if (existingIndex !== -1) {
            data.gamePreferences[existingIndex].preference = preference;
        } else {
            data.gamePreferences.push({ name, preference });
        }

        await saveData();
        res.json({ success: true, gamePreferences: data.gamePreferences });
    });

    // Krystal 点赞
    app.post('/api/like-krystal', async (req, res) => {
        data.krystalLikes++;
        await saveData();
        res.json({ success: true, likes: data.krystalLikes });
    });

    // Vibe 投票
    app.post('/api/vibe-votes', async (req, res) => {
        const { name, vibes } = req.body;

        if (!name || !vibes || !Array.isArray(vibes) || vibes.length === 0) {
            return res.status(400).json({ error: '数据无效' });
        }

        if (!data.vibeVotes) {
            data.vibeVotes = [];
        }

        const existingIndex = data.vibeVotes.findIndex(v => v.name === name);
        if (existingIndex !== -1) {
            data.vibeVotes[existingIndex].vibes = vibes;
        } else {
            data.vibeVotes.push({ name, vibes });
        }

        await saveData();
        res.json({ success: true, vibeVotes: data.vibeVotes });
    });

    // 团队成员点赞
    app.post('/api/member-likes', async (req, res) => {
        const { memberId, likes } = req.body;

        if (!data.memberLikes) {
            data.memberLikes = {};
        }

        data.memberLikes[memberId] = likes;
        await saveData();
        res.json({ success: true, memberLikes: data.memberLikes });
    });

    // 团队成员留言
    app.post('/api/member-comments', async (req, res) => {
        const { memberId, comments } = req.body;

        if (!data.memberComments) {
            data.memberComments = {};
        }

        data.memberComments[memberId] = comments;
        await saveData();
        res.json({ success: true, memberComments: data.memberComments });
    });

    // 自定义成员管理
    app.post('/api/custom-members', async (req, res) => {
        const { customMembers } = req.body;

        if (!data.customMembers) {
            data.customMembers = [];
        }

        data.customMembers = customMembers;
        await saveData();
        res.json({ success: true, customMembers: data.customMembers });
    });

    // ==================== 游戏组局 API ====================

    // 获取所有组局
    app.get('/api/game-lobbies', (req, res) => {
        if (!data.gameLobbies) {
            data.gameLobbies = [];
        }
        res.json({ lobbies: data.gameLobbies });
    });

    // 创建新组局
    app.post('/api/game-lobbies', async (req, res) => {
        const { organizer, game, time, message } = req.body;

        if (!organizer || !game) {
            return res.status(400).json({ success: false, error: '发起人和游戏名称为必填项' });
        }

        if (!data.gameLobbies) {
            data.gameLobbies = [];
        }

        const newLobby = {
            id: 'lobby_' + Date.now(),
            organizer,
            game,
            time: time || '',
            message: message || '',
            participants: [organizer], // 发起人自动加入
            createdAt: new Date().toISOString()
        };

        data.gameLobbies.push(newLobby);
        await saveData();
        res.json({ success: true, lobby: newLobby });
    });

    // 加入组局
    app.post('/api/game-lobbies/:id/join', async (req, res) => {
        const { id } = req.params;
        const { userName } = req.body;

        if (!userName) {
            return res.status(400).json({ success: false, error: '用户名为必填项' });
        }

        if (!data.gameLobbies) {
            data.gameLobbies = [];
        }

        const lobby = data.gameLobbies.find(l => l.id === id);
        if (!lobby) {
            return res.status(404).json({ success: false, error: '组局不存在' });
        }

        // 检查是否已经加入
        if (lobby.participants.includes(userName)) {
            return res.status(400).json({ success: false, error: '您已经加入过了！' });
        }

        lobby.participants.push(userName);
        await saveData();
        res.json({ success: true, lobby });
    });

    // 删除组局
    app.delete('/api/game-lobbies/:id', async (req, res) => {
        const { id } = req.params;
        const { organizer } = req.body;

        if (!data.gameLobbies) {
            data.gameLobbies = [];
        }

        const lobbyIndex = data.gameLobbies.findIndex(l => l.id === id);
        if (lobbyIndex === -1) {
            return res.status(404).json({ success: false, error: '组局不存在' });
        }

        const lobby = data.gameLobbies[lobbyIndex];

        // 验证权限：只有发起人可以删除
        if (lobby.organizer !== organizer) {
            return res.status(403).json({ success: false, error: '只有发起人可以删除组局' });
        }

        data.gameLobbies.splice(lobbyIndex, 1);
        await saveData();
        res.json({ success: true });
    });

    // 获取统计信息
    app.get('/api/stats', (req, res) => {
        const stats = {
            totalVisits: data.visits,
            lastVisit: data.lastVisit,
            foodiesCount: data.foodies.length,
            drinkersCount: data.drinkers.length,
            totalDrinks: data.drinkers.reduce((sum, d) => sum + d.count, 0),
            gamePreferencesCount: data.gamePreferences.length,
            krystalLikes: data.krystalLikes,
            recentVisits: data.visitHistory.slice(-10).reverse()
        };

        res.json(stats);
    });

    // 管理员路由 - 获取完整数据
    app.get('/api/admin/full-data', (req, res) => {
        res.json(data);
    });

    // 管理员路由 - 导出数据
    app.get('/api/admin/export', (req, res) => {
        const filename = `party-data-${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(JSON.stringify(data, null, 2));
    });

    // 管理员路由 - 清空数据
    app.post('/api/admin/clear', async (req, res) => {
        data = {
            foodies: [],
            drinkers: [],
            gamePreferences: [],
            vibeVotes: [],
            krystalLikes: 0,
            memberLikes: {},
            memberComments: {},
            customMembers: [],
            gameLobbies: [],
            visits: 0,
            lastVisit: null,
            visitHistory: []
        };
        await saveData();
        res.json({ success: true });
    });
}

// 注册路由到两个应用
registerRoutes(mainApp);
registerRoutes(adminApp);

// 主应用根路由 - API 健康检查
mainApp.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: '🎉 Tianlai Birthday Party API is running!',
        version: '1.0.0',
        endpoints: {
            foodies: '/api/foodies',
            drinkers: '/api/drinkers',
            members: '/api/member-likes',
            comments: '/api/member-comments',
            customMembers: '/api/custom-members',
            gameLobbies: '/api/game-lobbies',
            vibeVotes: '/api/vibe-votes'
        }
    });
});

// 管理应用根路由 - 管理 API 健康检查
adminApp.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: '🎉 Admin API is running!',
        note: 'Admin frontend is hosted on Vercel'
    });
});

// 启动服务器
async function start() {
    await loadData();

    // 检查是否在 Render 环境（只启动主应用）
    const isRender = process.env.RENDER === 'true';

    mainApp.listen(MAIN_PORT, () => {
        console.log(`
╔════════════════════════════════════════╗
║   🎉 生日派对服务器已启动！            ║
║                                        ║
║   API 服务: http://localhost:${MAIN_PORT}       ║
${!isRender ? `║   管理后台: http://localhost:${ADMIN_PORT}     ║` : ''}
║   数据文件: ${DATA_FILE}
║                                        ║
╚════════════════════════════════════════╝
        `);
    });

    // 只在本地开发时启动管理后台的第二个端口
    if (!isRender) {
        adminApp.listen(ADMIN_PORT, () => {
            console.log(`✅ 管理后台已在端口 ${ADMIN_PORT} 启动`);
        });
    }
}

// 启动服务器
start();

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n正在保存数据并关闭服务器...');
    await saveData();
    process.exit(0);
});