const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 创建两个 Express 应用
const mainApp = express();
const adminApp = express();

const MAIN_PORT = process.env.PORT || 3000;
const ADMIN_PORT = 3001;
const DATA_FILE = path.join(__dirname, 'party-data.json');

// Supabase 配置
const SUPABASE_URL = process.env.SUPABASE_URL || null;
const SUPABASE_KEY = process.env.SUPABASE_KEY || null;
let supabase = null;
let useDatabase = false;

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
    supportMembers: [
        { id: 'geyuxin', name: '@葛语歆', role: '📷 CCD摄影师', description: '总能发现别人自拍都没注意到的双下巴。', isDefault: true },
        { id: 'westonfang', name: '@Professor Weston Fang', role: '🎓 Academic指导', description: '正在造火星无人机', isDefault: true },
        { id: 'sherryhua', name: '@Sherry Hua', role: '🍹 逃酒经验分享', description: '能从任何酒局中优雅逃酒的Real Master', isDefault: true },
        { id: 'frank', name: '@Frank @Henry @沈艺如', role: '🏋️‍♂️ 健身教练', description: '让你又酸又爽，想直接在旁边的GYM做三组卧推。', isDefault: true },
        { id: 'kimi', name: '@Kimi', role: '🥑 高级营养师', description: '一边说少吃碳水，一边偷偷啃掉三个麦芬。（真的大厨）', isDefault: true },
        { id: 'carrie', name: '@Carrie', role: '💅 抽皮条大王 可以代抽皮条', description: '"不怕皮厚，只怕不抽。"', isDefault: true },
        { id: 'zhangtianen', name: '@张天恩', role: '📸 网红经验分享', description: '经典名言"我从小就爱说脏话"', isDefault: true },
        { id: 'ishan', name: '@Ishan', role: '🕉️ 印度语学习', description: '🙏 啊ki苦力hoyahoban～', isDefault: true },
        { id: 'lianshuitian', name: '@连水天', role: '🧋 奶茶大王', description: '一杯全糖少冰，甜过你的恋爱史。', isDefault: true },
        { id: 'jessica', name: '@Jessica', role: '📈 炒股', description: '她的股票走势图看起来像心电图。', isDefault: true },
        { id: 'racing', name: '@任怡静', role: '🏍️ 飙车经验分享', description: '红灯？你别闹了😎', isDefault: true },
        { id: 'church', name: '@Krystal @Thomas', role: '🙏 教会经验分享', description: 'UNC 最温柔。', isDefault: true },
        { id: 'linguist', name: '@Zhongyu', role: '🗣️ 语言学家', description: '"农""浓"', isDefault: true }
    ],
    navMenuItems: [
        { id: 'home', label: '🏠 首页', labelEn: '🏠 Home', target: 'hero' },
        { id: 'info', label: '📍 派对信息', labelEn: '📍 Party Info', target: 'info' },
        { id: 'schedule', label: '⏰ 时间安排', labelEn: '⏰ Schedule', target: 'schedule' },
        { id: 'team', label: '✨ 派对团队', labelEn: '✨ Team', target: 'team' },
        { id: 'foodies', label: '🐱 小馋猫列表', labelEn: '🐱 Foodie List', target: 'foodies' },
        { id: 'drinking', label: '🍺 逃酒排行榜', labelEn: '🍺 Drinking', target: 'drinking' },
        { id: 'games', label: '🎮 游戏', labelEn: '🎮 Games', target: 'games' }
    ],
    gameLobbies: [],
    partyInfo: {
        title: "Noah's 22nd Birthday Party 🎉",
        date: "November 22, 2025 (Friday)",
        time: "8:30 PM - Late",
        address: "301 W Rosemary St, Chapel Hill, NC 27516",
        phone: "919-360-8558"
    },
    timeline: [
        { time: '7:30 PM', event: '🍰 制作提拉米苏（对制作提拉米苏感兴趣的朋友可以提前来）' },
        { time: '8:30 PM', event: '🎉 派对正式开始😍' },
        { time: '9:00 PM', event: '🍜 夜宵时间' },
        { time: '10:00 PM', event: '🎮 游戏时间' },
        { time: '11:00 PM', event: '🎵 Party Mode' }
    ],
    visits: 0,
    lastVisit: null,
    visitHistory: []
};

// 连接 Supabase
async function connectDatabase() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.log('⚠️  未配置 SUPABASE_URL 或 SUPABASE_KEY，使用文件系统存储（数据会在重新部署时丢失）');
        useDatabase = false;
        return;
    }

    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // 测试连接
        const { data, error } = await supabase
            .from('party_data')
            .select('id')
            .limit(1);

        if (error) {
            throw error;
        }

        useDatabase = true;
        console.log('✅ Supabase 连接成功！数据将持久化保存');
    } catch (error) {
        console.error('❌ Supabase 连接失败，降级使用文件系统:', error.message);
        useDatabase = false;
        supabase = null;
    }
}

// 加载数据
async function loadData() {
    if (useDatabase && supabase) {
        try {
            const { data: savedData, error } = await supabase
                .from('party_data')
                .select('data')
                .eq('id', 'main')
                .single();

            if (error) {
                throw error;
            }

            if (savedData && savedData.data) {
                data = savedData.data;
                console.log('✅ 从 Supabase 加载数据成功');
                return;
            }
        } catch (error) {
            console.error('从 Supabase 加载数据失败:', error.message);
        }
    }

    // 降级到文件系统
    try {
        const fileData = await fs.readFile(DATA_FILE, 'utf8');
        data = JSON.parse(fileData);
        console.log('✅ 从文件系统加载数据');
    } catch (error) {
        console.log('📝 创建新数据');
        await saveData();
    }
}

// 保存数据
async function saveData() {
    // 保存到 Supabase
    if (useDatabase && supabase) {
        try {
            const { error } = await supabase
                .from('party_data')
                .upsert({
                    id: 'main',
                    data: data,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                throw error;
            }

            console.log('✅ 数据已保存到 Supabase');
        } catch (error) {
            console.error('❌ 保存到 Supabase 失败:', error.message);
        }
    }

    // 同时保存到文件系统（作为备份）
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        if (!useDatabase) {
            console.log('✅ 数据已保存到文件系统');
        }
    } catch (error) {
        console.error('❌ 保存到文件系统失败:', error);
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

    // Support 成员管理
    app.post('/api/support-members', async (req, res) => {
        const { members } = req.body;

        if (!members || !Array.isArray(members)) {
            return res.status(400).json({ error: '成员数据无效' });
        }

        if (!data.supportMembers) {
            data.supportMembers = [];
        }

        data.supportMembers = members;
        await saveData();
        res.json({ success: true, supportMembers: data.supportMembers });
    });

    // 派对基本信息管理
    app.post('/api/party-info', async (req, res) => {
        const { title, date, time, address, phone } = req.body;

        if (!data.partyInfo) {
            data.partyInfo = {};
        }

        data.partyInfo = { title, date, time, address, phone };
        await saveData();
        res.json({ success: true, partyInfo: data.partyInfo });
    });

    // 时间安排管理
    app.post('/api/timeline', async (req, res) => {
        const { timeline } = req.body;

        if (!timeline || !Array.isArray(timeline)) {
            return res.status(400).json({ error: '时间安排数据无效' });
        }

        data.timeline = timeline;
        await saveData();
        res.json({ success: true, timeline: data.timeline });
    });

    // 导航菜单管理
    app.post('/api/nav-menu', async (req, res) => {
        const { navMenuItems } = req.body;

        if (!navMenuItems || !Array.isArray(navMenuItems)) {
            return res.status(400).json({ error: '导航菜单数据无效' });
        }

        data.navMenuItems = navMenuItems;
        await saveData();
        res.json({ success: true, navMenuItems: data.navMenuItems });
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
    await connectDatabase();
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
║   数据存储: ${useDatabase ? 'Supabase (持久化)' : '文件系统 (临时)'}
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
    if (mongoClient) {
        await mongoClient.close();
        console.log('MongoDB 连接已关闭');
    }
    process.exit(0);
});