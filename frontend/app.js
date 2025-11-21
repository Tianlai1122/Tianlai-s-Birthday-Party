// API 配置 - 环境自适应
// 本地开发：http://localhost:3000/api
// 线上部署：https://tianlai-s-birthday-party.onrender.com/api
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://tianlai-s-birthday-party.onrender.com/api';

// 检测是否在微信环境中
function isWeChatBrowser() {
    return /micromessenger/i.test(navigator.userAgent);
}

// 处理外部链接点击（优化微信内打开体验）
function handleExternalLink(event, url) {
    if (isWeChatBrowser()) {
        event.preventDefault();

        // 在微信中，先尝试直接打开
        const opened = window.open(url, '_blank');

        // 如果无法打开，显示提示
        if (!opened || opened.closed || typeof opened.closed === 'undefined') {
            setTimeout(() => {
                const message = '🎵 共享歌单加载完成后请点击"打开网易云音乐"\n\n如果无法打开，请点击右上角"..."，选择"在浏览器中打开"\n\n或者复制链接在浏览器中打开：\n' + url;

                // 创建一个更友好的提示框
                if (confirm(message + '\n\n点击"确定"复制链接')) {
                    // 尝试复制链接到剪贴板
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(url).then(() => {
                            alert('✅ 链接已复制到剪贴板！');
                        }).catch(() => {
                            alert('链接：' + url);
                        });
                    } else {
                        // 降级方案：显示链接让用户手动复制
                        prompt('请复制以下链接：', url);
                    }
                }
            }, 100);
        }
    } else {
        // 非微信浏览器，直接跳转
        // 不阻止默认行为，让 <a> 标签的 target="_blank" 生效
        return true;
    }
}

// ==================== 汉堡菜单功能 ====================
function toggleNavMenu() {
    const navMenu = document.getElementById('nav-menu');
    const hamburgerBtn = document.getElementById('hamburger-btn');

    navMenu.classList.toggle('active');
    hamburgerBtn.classList.toggle('active');

    // 切换 body 滚动
    if (navMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

// 导航到指定 section
function navigateTo(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        // 平滑滚动到目标 section
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // 关闭菜单
        setTimeout(() => {
            toggleNavMenu();
        }, 300);
    }
}

// 点击菜单外部关闭菜单
document.addEventListener('click', (e) => {
    const navMenu = document.getElementById('nav-menu');
    const hamburgerBtn = document.getElementById('hamburger-btn');

    if (navMenu && hamburgerBtn) {
        // 如果菜单是打开的，且点击的不是菜单或汉堡按钮
        if (navMenu.classList.contains('active') &&
            !navMenu.contains(e.target) &&
            !hamburgerBtn.contains(e.target)) {
            toggleNavMenu();
        }
    }
});

// ESC 键关闭菜单
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const navMenu = document.getElementById('nav-menu');
        if (navMenu && navMenu.classList.contains('active')) {
            toggleNavMenu();
        }
    }
});

// 数据存储
let data = {
    foodies: [],
    drinkers: [],
    gamePreferences: [], // 保留旧数据兼容性
    vibeVotes: [], // 新的投票系统
    krystalLikes: 0,
    memberLikes: {}, // 团队成员点赞数
    memberComments: {}, // 团队成员留言
    customMembers: [], // 自定义添加的成员
    visits: 0,
    lastVisit: null
};

// Support 团队成员（从后端加载）
let supportMembers = [];

// 导航菜单项（从后端加载）
let navMenuItems = [];

// 选中的vibe选项（临时存储）
let selectedVibes = new Set();

// 当前留言的成员
let currentCommentMember = null;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOMContentLoaded event fired');
    await loadData();
    console.log('✅ Data loaded');
    renderNavMenu(); // 渲染导航菜单
    initCountdown();
    trackVisit();
    renderAll();
    console.log('✅ renderAll() completed');
    console.log('✅ About to call renderAllTeamMembers()');
    renderAllTeamMembers();
    updateCommentBadges();

    // 渲染游戏组局大厅
    renderGameLobbies();
    // 启动自动刷新
    startLobbyAutoRefresh();

    // 确保翻译应用到动态生成的内容
    if (typeof applyLanguage === 'function') {
        applyLanguage();
    }
    console.log('🎉 Initialization complete');
});

// 复制地址功能（点击卡片）
function copyAddressCard() {
    const address = '411 Flemington Rd, Chapel Hill, NC 27517';
    navigator.clipboard.writeText(address).then(() => {
        showToast(currentLang === 'zh' ? '✅ 地址已复制到剪贴板！' : '✅ Address copied to clipboard!');
    }).catch(err => {
        console.error('复制失败:', err);
        showToast(currentLang === 'zh' ? '❌ 复制失败，请手动复制' : '❌ Copy failed, please copy manually');
    });
}

// 打开 Google Map
function openGoogleMap() {
    const googleMapUrl = 'https://maps.app.goo.gl/5D9MWpw4kGd1TpCD8';
    window.open(googleMapUrl, '_blank');
    showToast(currentLang === 'zh' ? '🗺️ 正在打开 Google Map...' : '🗺️ Opening Google Map...');
}

// Toast 通知
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 图片查看模态窗口
function openImageModal(src) {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('modal-image');
    img.src = src;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// 倒计时
function initCountdown() {
    const partyDate = new Date('2025-11-22T20:30:00');

    function updateCountdown() {
        const now = new Date();
        const diff = partyDate - now;

        if (diff <= 0) {
            document.getElementById('countdown').innerHTML = t('hero.countdown.inProgress');
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('countdown').innerHTML =
            `${days}${t('hero.countdown.days')} ${hours}${t('hero.countdown.hours')} ${minutes}${t('hero.countdown.minutes')} ${seconds}${t('hero.countdown.seconds')}`;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// 加载数据
async function loadData() {
    try {
        const response = await fetch(`${API_URL}/data`);
        if (response.ok) {
            const serverData = await response.json();
            data = { ...data, ...serverData };

            // 加载 Support 成员
            if (serverData.supportMembers && Array.isArray(serverData.supportMembers)) {
                supportMembers = serverData.supportMembers;
            }

            // 加载导航菜单
            if (serverData.navMenuItems && Array.isArray(serverData.navMenuItems)) {
                navMenuItems = serverData.navMenuItems;
            }
        }
    } catch (error) {
        console.log('使用本地数据');
        // 从 localStorage 加载
        const localData = localStorage.getItem('partyData');
        if (localData) {
            data = JSON.parse(localData);
            if (data.supportMembers && Array.isArray(data.supportMembers)) {
                supportMembers = data.supportMembers;
            }
            if (data.navMenuItems && Array.isArray(data.navMenuItems)) {
                navMenuItems = data.navMenuItems;
            }
        }
    }
}

// 渲染导航菜单
function renderNavMenu() {
    const navMenuList = document.querySelector('.nav-menu-list');
    if (!navMenuList || navMenuItems.length === 0) return;

    const html = navMenuItems.map(item => `
        <li><a href="#${item.target}" onclick="navigateTo('${item.target}')" data-i18n="nav.${item.id}">${item.label}</a></li>
    `).join('');

    navMenuList.innerHTML = html;

    // 重新应用翻译
    if (typeof applyLanguage === 'function') {
        applyLanguage();
    }
}

// 保存数据
async function saveData() {
    // 保存到 localStorage
    localStorage.setItem('partyData', JSON.stringify(data));
    
    // 保存到服务器
    try {
        await fetch(`${API_URL}/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.log('服务器保存失败，已保存到本地');
    }
}

// 记录访问
async function trackVisit() {
    data.visits++;
    data.lastVisit = new Date().toISOString();
    await saveData();
}

// 渲染所有列表
function renderAll() {
    renderFoodies();
    renderDrinkers();
    renderGamePreferences();
    renderVibeVotes();
    updateKrystalLikes();
    updateAllMemberLikes();
    updateCommentBadges();
}

// 小馋猫列表
function addFoodie() {
    const nameInput = document.getElementById('foodie-name');
    const name = nameInput.value.trim();

    if (!name) {
        alert(t('alert.enterName'));
        return;
    }
    
    if (data.foodies.includes(name)) {
        alert('你已经在列表中了！');
        return;
    }
    
    data.foodies.push(name);
    nameInput.value = '';
    saveData();
    renderFoodies();
}

function renderFoodies() {
    const container = document.getElementById('foodies-list');
    if (!container) {
        console.warn('⚠️ foodies-list container not found');
        return;
    }

    if (data.foodies.length === 0) {
        container.innerHTML = `<p style="text-align: center; opacity: 0.6;" data-i18n="foodies.empty">${t('foodies.empty')}</p>`;
        return;
    }

    container.innerHTML = data.foodies.map(name => `
        <div class="list-item">
            🐱 ${name}
        </div>
    `).join('');
}

// 逃酒排行榜
function addDrinker() {
    const nameInput = document.getElementById('drinker-name');
    const countInput = document.getElementById('drink-count');
    const name = nameInput.value.trim();
    const count = parseInt(countInput.value);
    
    if (!name) {
        alert(t('alert.enterName'));
        return;
    }

    if (!count || count < 1) {
        alert(t('alert.enterCount'));
        return;
    }
    
    // 检查是否已存在
    const existingIndex = data.drinkers.findIndex(d => d.name === name);
    if (existingIndex !== -1) {
        data.drinkers[existingIndex].count = count;
    } else {
        data.drinkers.push({ name, count });
    }
    
    // 排序
    data.drinkers.sort((a, b) => b.count - a.count);
    
    nameInput.value = '';
    countInput.value = '';
    saveData();
    renderDrinkers();
}

function renderDrinkers() {
    const container = document.getElementById('drinking-leaderboard');
    if (!container) {
        console.warn('⚠️ drinking-leaderboard container not found');
        return;
    }

    if (data.drinkers.length === 0) {
        container.innerHTML = `<p style="text-align: center; opacity: 0.6; grid-column: 1/-1;" data-i18n="drinking.empty">${t('drinking.empty')}</p>`;
        return;
    }

    container.innerHTML = data.drinkers.map((drinker, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        const medal = index < 3 ? medals[index] : `#${index + 1}`;

        return `
            <div class="leaderboard-item">
                <div class="rank">${medal}</div>
                <div class="name">${drinker.name}</div>
                <div class="drinks">${t('drinking.tonight')} ${drinker.count} ${t('drinking.cups')}</div>
            </div>
        `;
    }).join('');
}

// 游戏偏好
function addGamePreference() {
    const nameInput = document.getElementById('voter-name');
    const preferenceSelect = document.getElementById('game-preference');
    const name = nameInput.value.trim();
    const preference = preferenceSelect.value;
    
    if (!name) {
        alert('请输入你的名字！');
        return;
    }
    
    if (!preference) {
        alert('请选择游戏类型！');
        return;
    }
    
    // 检查是否已存在
    const existingIndex = data.gamePreferences.findIndex(p => p.name === name);
    if (existingIndex !== -1) {
        data.gamePreferences[existingIndex].preference = preference;
    } else {
        data.gamePreferences.push({ name, preference });
    }
    
    nameInput.value = '';
    preferenceSelect.value = '';
    saveData();
    renderGamePreferences();
}

function renderGamePreferences() {
    const container = document.getElementById('game-preferences-list');
    if (!container) {
        console.warn('⚠️ game-preferences-list container not found');
        return;
    }

    if (data.gamePreferences.length === 0) {
        container.innerHTML = '<p style="text-align: center; opacity: 0.6; grid-column: 1/-1;">还没有人提交偏好~</p>';
        return;
    }
    
    // 按游戏类型分组
    const grouped = {};
    data.gamePreferences.forEach(({ name, preference }) => {
        if (!grouped[preference]) {
            grouped[preference] = [];
        }
        grouped[preference].push(name);
    });
    
    let html = '';
    for (const [preference, names] of Object.entries(grouped)) {
        html += `
            <div class="preference-item" style="grid-column: 1/-1;">
                <div style="font-weight: 600; color: var(--accent); margin-bottom: 10px;">
                    ${preference} (${names.length}人)
                </div>
                <div style="font-size: 0.9rem; opacity: 0.8;">
                    ${names.join(', ')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// 团队成员点赞
async function likeMember(memberId) {
    if (!data.memberLikes) {
        data.memberLikes = {};
    }

    if (!data.memberLikes[memberId]) {
        data.memberLikes[memberId] = 0;
    }

    data.memberLikes[memberId]++;

    try {
        const response = await fetch(`${API_URL}/member-likes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId, likes: data.memberLikes[memberId] })
        });

        if (response.ok) {
            updateMemberLikes(memberId);
            showToast(currentLang === 'zh' ? '😍 点赞成功！' : '😍 Liked!');
        }
    } catch (error) {
        console.error('点赞失败:', error);
    }

    // 保存到本地
    localStorage.setItem('partyData', JSON.stringify(data));
}

function updateMemberLikes(memberId) {
    const element = document.getElementById(`likes-${memberId}`);
    if (element && data.memberLikes) {
        element.textContent = data.memberLikes[memberId] || 0;
    }
}

function updateAllMemberLikes() {
    if (!data.memberLikes) return;

    Object.keys(data.memberLikes).forEach(memberId => {
        updateMemberLikes(memberId);
    });
}

// 打开留言模态窗口
function openCommentModal(memberId, memberName) {
    currentCommentMember = memberId;
    const modal = document.getElementById('comment-modal');
    const nameElement = document.getElementById('comment-member-name');

    nameElement.textContent = memberName;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 清空表单
    document.getElementById('comment-author').value = '';
    document.getElementById('comment-text').value = '';

    // 渲染留言列表
    renderComments(memberId);

    // 更新徽章（确保显示最新的留言数）
    updateCommentBadges();
}

function closeCommentModal() {
    const modal = document.getElementById('comment-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    currentCommentMember = null;
}

// 提交留言
async function submitComment() {
    if (!currentCommentMember) return;

    const author = document.getElementById('comment-author').value.trim();
    const text = document.getElementById('comment-text').value.trim();

    if (!author || !text) {
        showToast(currentLang === 'zh' ? '❌ 请填写完整信息' : '❌ Please fill in all fields');
        return;
    }

    if (!data.memberComments) {
        data.memberComments = {};
    }

    if (!data.memberComments[currentCommentMember]) {
        data.memberComments[currentCommentMember] = [];
    }

    const comment = {
        author,
        text,
        timestamp: new Date().toISOString()
    };

    data.memberComments[currentCommentMember].push(comment);

    try {
        const response = await fetch(`${API_URL}/member-comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                memberId: currentCommentMember,
                comments: data.memberComments[currentCommentMember]
            })
        });

        if (response.ok) {
            showToast(currentLang === 'zh' ? '✅ 留言成功！' : '✅ Comment posted!');
            document.getElementById('comment-author').value = '';
            document.getElementById('comment-text').value = '';
            renderComments(currentCommentMember);
            // 更新徽章数量和派对留言总计
            updateCommentBadges();
        }
    } catch (error) {
        console.error('留言失败:', error);
    }

    // 保存到本地
    localStorage.setItem('partyData', JSON.stringify(data));
}

// 渲染留言列表
function renderComments(memberId) {
    const container = document.getElementById('comments-container');

    if (!data.memberComments || !data.memberComments[memberId] || data.memberComments[memberId].length === 0) {
        container.innerHTML = `<div class="no-comments">${currentLang === 'zh' ? '还没有留言，快来抢沙发吧！' : 'No comments yet. Be the first!'}</div>`;
        return;
    }

    const comments = data.memberComments[memberId];
    const html = comments.map(comment => {
        const date = new Date(comment.timestamp);
        const timeStr = date.toLocaleString(currentLang === 'zh' ? 'zh-CN' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="comment-item">
                <div class="comment-author">${comment.author}</div>
                <div class="comment-content">${comment.text}</div>
                <div class="comment-time">${timeStr}</div>
            </div>
        `;
    }).reverse().join('');

    container.innerHTML = html;

    // 更新徽章
    updateCommentBadges();
}

// 更新所有成员的留言数量徽章
function updateCommentBadges() {
    // 获取所有成员 ID（包括默认成员、Support成员和自定义成员）
    const defaultMembers = ['yudi', 'noah', 'krystal', 'lizhehao'];
    const supportMemberIds = supportMembers ? supportMembers.map(m => m.id) : [];
    const customMemberIds = data.customMembers ? data.customMembers.map(m => m.id) : [];
    const allMembers = [...defaultMembers, ...supportMemberIds, ...customMemberIds];

    // 移除重复的成员 ID
    const uniqueMembers = [...new Set(allMembers)];

    let totalComments = 0;

    uniqueMembers.forEach(memberId => {
        const badge = document.getElementById(`comment-badge-${memberId}`);
        if (badge) {
            const count = data.memberComments && data.memberComments[memberId]
                ? data.memberComments[memberId].length
                : 0;
            badge.textContent = count;
            totalComments += count;

            // 如果有留言，显示徽章；否则隐藏
            if (count > 0) {
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    });

    // 更新派对留言总计数
    const totalCommentsElement = document.getElementById('total-comments-count');
    if (totalCommentsElement) {
        totalCommentsElement.textContent = totalComments;
    }
}

// Krystal 点赞（保留兼容性）
async function likeKrystal() {
    await likeMember('krystal');
}

function updateKrystalLikes() {
    const element = document.getElementById('krystal-likes');
    if (element) {
        element.textContent = data.krystalLikes;
    }
}

// 管理员面板
function toggleAdmin() {
    const content = document.getElementById('admin-content');
    const isVisible = content.style.display !== 'none';
    
    if (isVisible) {
        content.style.display = 'none';
    } else {
        content.style.display = 'block';
        updateAdminStats();
    }
}

function updateAdminStats() {
    const stats = document.getElementById('admin-stats');
    
    const lastVisitDate = data.lastVisit ? new Date(data.lastVisit).toLocaleString('zh-CN') : '无';
    
    stats.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h4 style="color: var(--accent); margin-bottom: 10px;">📊 访问统计</h4>
            <p>总访问次数: <strong>${data.visits}</strong></p>
            <p>最后访问: <strong>${lastVisitDate}</strong></p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: var(--accent); margin-bottom: 10px;">🐱 小馋猫</h4>
            <p>报名人数: <strong>${data.foodies.length}</strong></p>
            ${data.foodies.length > 0 ? `<p style="font-size: 0.9rem; opacity: 0.7;">${data.foodies.join(', ')}</p>` : ''}
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: var(--accent); margin-bottom: 10px;">🍺 逃酒排行榜</h4>
            <p>参与人数: <strong>${data.drinkers.length}</strong></p>
            <p>总杯数: <strong>${data.drinkers.reduce((sum, d) => sum + d.count, 0)}</strong></p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: var(--accent); margin-bottom: 10px;">🎮 游戏偏好</h4>
            <p>投票人数: <strong>${data.gamePreferences.length}</strong></p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: var(--accent); margin-bottom: 10px;">😍 Krystal点赞</h4>
            <p>点赞数: <strong>${data.krystalLikes}</strong></p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
            <button onclick="exportData()" class="btn btn-primary" style="width: 100%; padding: 10px;">
                导出数据
            </button>
            <button onclick="clearData()" class="btn" style="width: 100%; padding: 10px; margin-top: 10px; background: rgba(255,0,0,0.3);">
                清空数据
            </button>
        </div>
    `;
}

// 导出数据
function exportData() {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `party-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// 清空数据
function clearData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        data = {
            foodies: [],
            drinkers: [],
            gamePreferences: [],
            krystalLikes: 0,
            visits: 0,
            lastVisit: null
        };
        saveData();
        renderAll();
        updateAdminStats();
        alert('数据已清空！');
    }
}

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 游戏教程数据
const gameData = {
    'texas-holdem': {
        title: '♠️ 德州扑克 Texas Hold\'em',
        content: `
            <h3>游戏简介</h3>
            <p>德州扑克是世界上最流行的扑克游戏之一，结合了策略、心理和运气。</p>

            <h3>基本规则</h3>
            <ol>
                <li>每位玩家发2张底牌（只有自己能看）</li>
                <li>公共牌分三轮发出：翻牌（3张）、转牌（1张）、河牌（1张）</li>
                <li>用自己的2张底牌和5张公共牌组成最好的5张牌</li>
                <li>每轮可以下注、跟注、加注或弃牌</li>
            </ol>

            <h3>牌型大小（从大到小）</h3>
            <ol>
                <li>皇家同花顺：同花色的A-K-Q-J-10</li>
                <li>同花顺：同花色的连续5张牌</li>
                <li>四条：4张相同点数的牌</li>
                <li>葫芦：3张相同 + 2张相同</li>
                <li>同花：5张同花色的牌</li>
                <li>顺子：5张连续的牌</li>
                <li>三条：3张相同点数的牌</li>
                <li>两对：2对相同点数的牌</li>
                <li>一对：2张相同点数的牌</li>
                <li>高牌：以上都没有时，比最大的牌</li>
            </ol>
        `
    },
    'mahjong': {
        title: '🀄️ 麻将 Mahjong',
        content: `
            <h3>游戏简介</h3>
            <p>麻将是中国传统的四人桌上游戏，这里介绍最简单的基础玩法。</p>

            <h3>基本规则</h3>
            <ol>
                <li>四人游戏，每人起手13张牌</li>
                <li>轮流摸牌、打牌，目标是胡牌</li>
                <li>胡牌基本型：4组顺子/刻子 + 1对将牌</li>
                <li>可以吃、碰、杠来组牌</li>
            </ol>

            <h3>基本操作</h3>
            <ul>
                <li><strong>吃</strong>：上家打的牌可以和自己的牌组成顺子（如：1-2-3）</li>
                <li><strong>碰</strong>：任何人打的牌，自己有一对可以碰成三张</li>
                <li><strong>杠</strong>：有四张相同的牌可以杠</li>
                <li><strong>胡</strong>：凑齐胡牌型即可胡牌</li>
            </ul>

            <h3>常见胡牌类型</h3>
            <ul>
                <li><strong>平胡</strong>：基本胡牌型</li>
                <li><strong>七对</strong>：7对对子</li>
                <li><strong>清一色</strong>：全部同一花色</li>
                <li><strong>碰碰胡</strong>：全是刻子</li>
            </ul>

            <p><em>具体规则可能因地区而异，建议游戏前统一规则！</em></p>
        `
    },
    'landlord': {
        title: '🃏 斗地主 Fight the Landlord',
        content: `
            <h3>游戏简介</h3>
            <p>斗地主是中国最流行的扑克游戏，三人游戏，一人当地主，另外两人合作对抗。</p>

            <h3>基本规则</h3>
            <ol>
                <li>三人游戏，使用54张牌（含大小王）</li>
                <li>每人发17张牌，留3张底牌</li>
                <li>叫地主，地主拿走3张底牌</li>
                <li>地主先出牌，其他人轮流出牌</li>
                <li>地主先出完牌则地主赢，否则农民赢</li>
            </ol>

            <h3>常见牌型</h3>
            <ul>
                <li><strong>单张</strong>：任意一张牌</li>
                <li><strong>对子</strong>：两张相同的牌</li>
                <li><strong>三张</strong>：三张相同的牌</li>
                <li><strong>三带一/二</strong>：三张相同 + 1张/1对</li>
                <li><strong>顺子</strong>：5张以上连续的牌</li>
                <li><strong>连对</strong>：3对以上连续的对子</li>
                <li><strong>飞机</strong>：连续的三张</li>
                <li><strong>炸弹</strong>：4张相同的牌</li>
                <li><strong>王炸</strong>：大王 + 小王（最大）</li>
            </ul>
        `
    },
    'pool': {
        title: '🎱 桌球 Pool',
        content: `
            <h3>游戏简介</h3>
            <p>桌球（台球）是一项优雅的运动，需要精准的控制和策略思考。</p>

            <h3>8球规则（最常见）</h3>
            <ol>
                <li>使用15个彩球（1-7号全色球，9-15号花色球，8号黑球）</li>
                <li>开球后，先进球的一方选择全色或花色</li>
                <li>必须先打完自己的7个球</li>
                <li>最后打8号黑球进指定袋</li>
                <li>提前打进8号球或8号球进错袋则输</li>
            </ol>

            <h3>基本技巧</h3>
            <ul>
                <li>瞄准：对准目标球的接触点</li>
                <li>力度：根据距离调整击球力度</li>
                <li>走位：考虑母球的停留位置</li>
                <li>防守：让对手难以进球</li>
            </ul>
        `
    },
    'switch': {
        title: '🎮 Switch 游戏',
        content: `
            <h3>游戏简介</h3>
            <p>Nintendo Switch 是任天堂的游戏主机，有丰富的派对游戏！</p>

            <h3>推荐派对游戏</h3>
            <ul>
                <li><strong>马里奥派对</strong>：经典派对游戏，各种小游戏</li>
                <li><strong>马里奥赛车</strong>：竞速游戏，支持多人对战</li>
                <li><strong>任天堂明星大乱斗</strong>：格斗游戏</li>
                <li><strong>胡闹厨房</strong>：合作烹饪游戏</li>
                <li><strong>舞力全开</strong>：跳舞游戏</li>
                <li><strong>健身环大冒险</strong>：运动游戏</li>
            </ul>

            <h3>游戏技巧</h3>
            <p>每个游戏都有教程，建议先玩一轮熟悉操作。派对模式下，重在参与和欢乐！</p>
        `
    },
    'xiaojie': {
        title: '🎴 小姐牌（中国版）',
        content: `
            <h3>游戏规则</h3>
            <div style="text-align: center; margin: 20px 0;">
                <img src="小姐牌规则.JPG" alt="小姐牌规则" style="max-width: 100%; border-radius: 10px; cursor: pointer;" onclick="openImageModal('小姐牌规则.JPG')">
                <p style="margin-top: 10px; font-size: 0.9rem; opacity: 0.8;">点击图片查看大图</p>
            </div>
        `
    },
    'ten-half': {
        title: '🎲 十点半',
        content: `
            <h3>游戏简介</h3>
            <p>十点半是一种简单有趣的扑克游戏，类似21点但目标是10.5点。</p>

            <h3>基本规则</h3>
            <ol>
                <li>使用一副扑克牌（去掉大小王）</li>
                <li>A=1点，2-10按牌面，J/Q/K=0.5点</li>
                <li>庄家给每人发一张牌</li>
                <li>玩家可以选择要牌或停牌</li>
                <li>目标是让手牌总点数接近10.5点</li>
                <li>超过10.5点则爆掉（输）</li>
                <li>最接近10.5点的人赢</li>
            </ol>

            <h3>特殊规则</h3>
            <ul>
                <li><strong>五小</strong>：5张牌不超过10.5点，自动赢</li>
                <li><strong>天王</strong>：第一张就是人头牌（0.5点），可以选择翻倍</li>
            </ul>
        `
    },
    'pingpong': {
        title: '🏓 乒乓球 Beer Pong',
        content: `
            <h3>游戏简介</h3>
            <p>Beer Pong 是经典的派对饮酒游戏，需要技巧和运气！</p>

            <h3>基本规则</h3>
            <ol>
                <li>两队对战，每队2人</li>
                <li>桌子两端各摆10个杯子（三角形排列）</li>
                <li>杯子里装饮料（啤酒或其他饮料）</li>
                <li>轮流投球，目标是投进对方的杯子</li>
                <li>球进杯后，对方要喝掉那杯饮料</li>
                <li>先清空对方所有杯子的队伍获胜</li>
            </ol>

            <h3>特殊规则</h3>
            <ul>
                <li><strong>反弹球</strong>：球反弹后进杯，对方喝2杯</li>
                <li><strong>两球都进</strong>：可以再投一轮</li>
                <li><strong>重新排列</strong>：每队可以要求重新排列杯子2次</li>
            </ul>

            <a href="https://www.youtube.com/watch?v=-gIg4sQTMco" target="_blank" class="video-link">
                📺 观看教程视频
            </a>
        `
    },
    'rage-cage': {
        title: '🍺 Rage Cage',
        content: `
            <h3>游戏简介</h3>
            <p>Rage Cage 是一个快节奏、刺激的派对饮酒游戏！</p>

            <h3>游戏设置</h3>
            <ul>
                <li>在桌子中央摆一圈杯子（装少量饮料）</li>
                <li>中间放一个"国王杯"（装满饮料）</li>
                <li>准备2个乒乓球</li>
            </ul>

            <h3>基本规则</h3>
            <ol>
                <li>两个球从相反方向开始</li>
                <li>拿到球的人要把球投进自己面前的杯子</li>
                <li>投进后，把球传给下一个人</li>
                <li>如果你投进了，而下一个人还没投进，你可以把杯子"叠"到他的杯子上</li>
                <li>被叠杯的人要喝掉杯子里的饮料，然后继续投球</li>
                <li>最后剩下国王杯的人要喝掉</li>
            </ol>

            <h3>游戏技巧</h3>
            <ul>
                <li>快速投球，给下一个人压力</li>
                <li>保持冷静，越急越投不进</li>
                <li>可以选择反弹投球</li>
            </ul>

            <a href="https://www.youtube.com/watch?v=G7ADZhO9QGA" target="_blank" class="video-link">
                📺 观看教程视频
            </a>
        `
    },
    'ride-bus': {
        title: '🚌 Ride the Bus',
        content: `
            <h3>游戏简介</h3>
            <p>Ride the Bus 是一个经典的扑克饮酒游戏，分为多个阶段。</p>

            <h3>第一阶段：猜牌</h3>
            <ol>
                <li><strong>红还是黑？</strong> - 猜错喝1口</li>
                <li><strong>高还是低？</strong> - 猜错喝2口</li>
                <li><strong>里还是外？</strong> - 猜错喝3口</li>
                <li><strong>花色？</strong> - 猜错喝4口</li>
            </ol>

            <h3>第二阶段：金字塔</h3>
            <ul>
                <li>摆出金字塔形状的牌（底层5张，往上递减）</li>
                <li>翻牌时，有相同牌的人可以指定别人喝</li>
                <li>底层1口，往上递增</li>
            </ul>

            <h3>第三阶段：坐公交</h3>
            <ol>
                <li>手牌最多的人"坐公交"</li>
                <li>翻牌，遇到人头牌（J/Q/K/A）要喝酒并重新开始</li>
                <li>成功翻完所有牌才能下车</li>
            </ol>

            <a href="https://www.youtube.com/watch?v=HyMCieQRXSc" target="_blank" class="video-link">
                📺 观看教程视频1
            </a>
            <a href="https://www.youtube.com/watch?v=DBYMq7VZNxw" target="_blank" class="video-link">
                📺 观看教程视频2
            </a>
        `
    },
    '789': {
        title: '🎲 789（适合多人）',
        content: `
            <h3>游戏简介</h3>
            <p>789 是一个简单刺激的骰子饮酒游戏，适合多人参与！</p>

            <h3>游戏设置</h3>
            <ul>
                <li>准备2粒骰子和一个筛盅</li>
                <li>准备一个公共杯</li>
            </ul>

            <h3>游戏规则</h3>
            <ol>
                <li>把两粒骰子放在筛盅里，轮流摇</li>
                <li>相加结果：
                    <ul>
                        <li><strong>2、3、4、5、6</strong> - 不用喝酒</li>
                        <li><strong>7</strong> - 不喝酒，往公共杯随意加酒</li>
                        <li><strong>8</strong> - 把公共杯里的酒喝一半</li>
                        <li><strong>9</strong> - 喝完所有的酒，再随意加酒</li>
                        <li><strong>对1（两个1）</strong> - 可以指定在座的任何一个人喝</li>
                    </ul>
                </li>
            </ol>

            <h3>游戏技巧</h3>
            <ul>
                <li>摇到7时可以多加点酒，增加刺激度</li>
                <li>注意观察公共杯里的酒量</li>
                <li>对1是最好的结果，可以指定别人喝</li>
            </ul>
        `
    },
    'titanic': {
        title: '🚢 泰坦尼克（人数不限）',
        content: `
            <h3>游戏简介</h3>
            <p>泰坦尼克是一个紧张刺激的饮酒游戏，看谁能让"船"不沉！</p>

            <h3>游戏设置</h3>
            <ol>
                <li>在酒杯中倒入半杯酒</li>
                <li>将一个瓶盖倒放在酒里，确保瓶盖不沉</li>
            </ol>

            <h3>游戏规则</h3>
            <ol>
                <li>玩家轮流往瓶盖里倒酒</li>
                <li>每次可以倒任意量的酒</li>
                <li>谁弄沉了瓶盖罚酒两杯</li>
            </ol>

            <h3>游戏技巧</h3>
            <ul>
                <li>可以少量多次倒酒，增加紧张感</li>
                <li>观察瓶盖的浮力状态</li>
                <li>心理战术：假装要倒很多，实际只倒一点</li>
            </ul>

            <p><em>提示：选择合适大小的瓶盖很重要！</em></p>
        `
    },
    'blow-cards': {
        title: '💨 吹扑克牌（适合多人）',
        content: `
            <h3>游戏简介</h3>
            <p>吹扑克牌是一个考验肺活量和运气的饮酒游戏！</p>

            <h3>游戏设置</h3>
            <ol>
                <li>在杯中倒入酒</li>
                <li>将扑克牌放在酒杯上</li>
            </ol>

            <h3>游戏规则</h3>
            <ol>
                <li>所有人轮流吹牌</li>
                <li>吹下多少张都可以</li>
                <li>吹掉最后一张的喝光杯中酒</li>
            </ol>

            <h3>特殊规则</h3>
            <p><strong>PS：吹到只剩一张牌，下一位必须喝！</strong></p>

            <h3>游戏技巧</h3>
            <ul>
                <li>控制吹气的力度</li>
                <li>可以从侧面吹，减少吹掉的牌数</li>
                <li>注意剩余牌数，避免成为倒数第二个</li>
            </ul>
        `
    },
    'phone-bomb': {
        title: '💣 手机炸弹（适合多人）',
        content: `
            <h3>游戏简介</h3>
            <p>手机炸弹是一个紧张刺激的问答饮酒游戏，考验反应速度！</p>

            <h3>游戏设置</h3>
            <ol>
                <li>设置一个手机倒计时（不告诉在场玩家具体时间）</li>
                <li>建议设置30秒-2分钟之间</li>
            </ol>

            <h3>游戏规则</h3>
            <ol>
                <li>主持人提出问题后把手机传给下一个人</li>
                <li>拿到手机的人必须回答完问题才能继续传递</li>
                <li>手机在谁手里响了就接受惩罚（喝酒）</li>
            </ol>

            <h3>问题示例</h3>
            <ul>
                <li>说出一个以"X"开头的城市</li>
                <li>说出一部你看过的电影</li>
                <li>说出一个明星的名字</li>
                <li>说出一种水果</li>
                <li>说出一个你去过的国家</li>
            </ul>

            <h3>游戏技巧</h3>
            <ul>
                <li>快速思考，不要犹豫</li>
                <li>可以设置主题，增加难度</li>
                <li>答案不能重复之前说过的</li>
            </ul>
        `
    },
    'pyramid': {
        title: '🔺 金字塔（适合多人）',
        content: `
            <h3>游戏简介</h3>
            <p>金字塔是一个策略性很强的扑克饮酒游戏，需要记忆和运气！</p>

            <h3>游戏设置</h3>
            <ol>
                <li>一副牌去掉大小王</li>
                <li>按照1张到5张，把牌盖住摆成金字塔状</li>
                <li>对应 5、4、3、2、1 杯（最顶层1张代表5杯）</li>
                <li>剩余的牌平均分给大家</li>
            </ol>

            <h3>游戏规则</h3>
            <ol>
                <li>轮流翻金字塔的牌</li>
                <li>若手上有相同点数的牌，可以指定一人喝酒</li>
                <li>被指定的人如果也有这张牌，可以反弹</li>
                <li>若没有则喝酒</li>
                <li>喝酒杯数 = 该牌所在层数对应的杯数</li>
            </ol>

            <h3>特殊规则</h3>
            <p><strong>PS：其他人有对应牌可以选择救人（出牌帮忙反弹）</strong></p>

            <h3>游戏技巧</h3>
            <ul>
                <li>记住自己手里的牌</li>
                <li>观察别人出过什么牌</li>
                <li>顶层的牌杯数最多，要小心</li>
                <li>可以联合其他玩家一起反弹</li>
            </ul>
        `
    }
};

// 打开游戏模态窗口
function openGameModal(gameId) {
    const modal = document.getElementById('game-modal');
    const title = document.getElementById('modal-game-title');
    const content = document.getElementById('modal-game-content');

    const game = gameData[gameId];
    if (game) {
        title.textContent = game.title;
        content.innerHTML = game.content;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// 关闭游戏模态窗口
function closeGameModal() {
    const modal = document.getElementById('game-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// 点击模态窗口外部关闭
document.addEventListener('click', (e) => {
    const gameModal = document.getElementById('game-modal');
    if (e.target === gameModal) {
        closeGameModal();
    }

    // 留言模态窗口点击外部关闭
    const commentModal = document.getElementById('comment-modal');
    if (e.target === commentModal) {
        closeCommentModal();
    }

    // 图片模态窗口点击外部关闭
    const imageModal = document.getElementById('image-modal');
    if (e.target === imageModal) {
        closeImageModal();
    }
});

// ESC键关闭模态窗口
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeGameModal();
        closeCommentModal();
        closeImageModal();
    }
});

// Vibe Poll 功能
// 点击选项切换选中状态
document.addEventListener('DOMContentLoaded', () => {
    const vibeOptions = document.querySelectorAll('.vibe-option');
    vibeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const vibe = option.dataset.vibe;
            if (selectedVibes.has(vibe)) {
                selectedVibes.delete(vibe);
                option.classList.remove('selected');
            } else {
                selectedVibes.add(vibe);
                option.classList.add('selected');
            }
        });
    });
});

// 提交 vibe 投票
async function submitVibeVote() {
    const nameInput = document.getElementById('vibe-voter-name');
    const name = nameInput.value.trim();

    if (!name) {
        alert(t('alert.enterName'));
        return;
    }

    if (selectedVibes.size === 0) {
        alert(t('alert.selectVibe'));
        return;
    }

    const vibes = Array.from(selectedVibes);

    // 检查是否已投票
    const existingIndex = data.vibeVotes.findIndex(v => v.name === name);
    if (existingIndex !== -1) {
        data.vibeVotes[existingIndex].vibes = vibes;
    } else {
        data.vibeVotes.push({ name, vibes });
    }

    // 清空选择
    nameInput.value = '';
    selectedVibes.clear();
    document.querySelectorAll('.vibe-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // 保存并渲染
    await saveData();
    renderVibeVotes();

    // 发送到服务器
    try {
        await fetch(`${API_URL}/vibe-votes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, vibes })
        });
    } catch (error) {
        console.error('保存投票失败:', error);
    }
}

// 渲染 vibe 投票结果
function renderVibeVotes() {
    // 统计每个选项的票数
    const voteCounts = {
        drinking: 0,
        card: 0,
        board: 0,
        video: 0,
        chill: 0
    };

    data.vibeVotes.forEach(vote => {
        vote.vibes.forEach(vibe => {
            if (voteCounts[vibe] !== undefined) {
                voteCounts[vibe]++;
            }
        });
    });

    // 计算总票数
    const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
    const maxVotes = Math.max(...Object.values(voteCounts), 1);

    // 更新每个选项的显示
    Object.keys(voteCounts).forEach(vibe => {
        const option = document.querySelector(`.vibe-option[data-vibe="${vibe}"]`);
        if (option) {
            const count = voteCounts[vibe];
            const percentage = totalVotes > 0 ? (count / maxVotes) * 100 : 0;

            const voteText = count === 1 ? t('vibe.vote') : t('vibe.votes');
            option.querySelector('.vibe-count').innerHTML =
                `${count} <span data-i18n="${count === 1 ? 'vibe.vote' : 'vibe.votes'}">${voteText}</span>`;
            option.querySelector('.vibe-bar-fill').style.width = `${percentage}%`;
        }
    });

    // 显示投票者列表
    const votersList = document.getElementById('vibe-voters-list');
    if (!votersList) {
        console.warn('⚠️ vibe-voters-list container not found');
        return;
    }
    if (data.vibeVotes.length === 0) {
        votersList.innerHTML = `<p style="text-align: center; opacity: 0.6;" data-i18n="vibe.empty">${t('vibe.empty')}</p>`;
        return;
    }

    const vibeNames = {
        drinking: t('vibe.drinking') + ' 🍺',
        card: t('vibe.card') + ' 🃏',
        board: t('vibe.board') + ' 🎲',
        video: t('vibe.video') + ' 🎮',
        chill: t('vibe.chill') + ' 🛋️'
    };

    votersList.innerHTML = data.vibeVotes.map(vote => `
        <div class="vibe-voter-item">
            <div class="vibe-voter-name">${vote.name}</div>
            <div class="vibe-voter-choices">
                ${vote.vibes.map(v => vibeNames[v] || v).join(', ')}
            </div>
        </div>
    `).join('');
}

// ==================== Support 团队成员管理 ====================

// 渲染所有团队成员（包括自定义成员的自动归档）
function renderAllTeamMembers() {
    console.log('🔍 renderAllTeamMembers() called');

    // 渲染各个分类的成员
    renderCategoryMembers('food', 'food-team-grid');
    renderCategoryMembers('dessert', 'dessert-team-grid');
    renderCategoryMembers('drinks', 'drinks-team-grid');
    renderCategoryMembers('support', 'support-team-grid');

    // 更新点赞数和留言数
    updateAllMemberLikes();
    updateCommentBadges();
    console.log('✅ renderAllTeamMembers() completed');
}

// 渲染特定分类的成员
function renderCategoryMembers(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`⚠️ Container ${containerId} not found`);
        return;
    }

    // 获取该分类的自定义成员
    let customMembers = [];
    if (data.customMembers && data.customMembers.length > 0) {
        customMembers = data.customMembers.filter(m => m.category === category);
    }

    console.log(`✅ Rendering ${category}:`, customMembers.length, 'custom members');

    // 对于 food、dessert、drinks 分类，只追加自定义成员，不替换整个容器
    if (category === 'food' || category === 'dessert' || category === 'drinks') {
        // 移除之前添加的自定义成员卡片（保留固定成员）
        const existingCustomCards = container.querySelectorAll('.team-card[data-custom="true"]');
        existingCustomCards.forEach(card => card.remove());

        // 如果没有自定义成员，直接返回
        if (customMembers.length === 0) {
            return;
        }

        // 生成自定义成员卡片
        const customCards = customMembers.map(member => {
            const deleteBtn = `<button onclick="deleteMember('${member.id}')" class="delete-member-btn" title="删除成员">🗑️</button>`;

            let displayName = member.name;
            if (displayName && !displayName.startsWith('@')) {
                displayName = '@' + displayName;
            }

            return `
                <div class="team-card" data-member="${member.id}" data-custom="true">
                    ${deleteBtn}
                    <div class="role">${member.role}</div>
                    <div class="name">${displayName}</div>
                    ${member.description ? `<div class="description">${member.description}</div>` : ''}
                    <div class="team-actions">
                        <button class="like-btn" onclick="likeMember('${member.id}')">
                            😍 <span class="like-count" id="likes-${member.id}">0</span>
                        </button>
                        <button class="comment-btn" onclick="openCommentModal('${member.id}', '${member.name}')">
                            💬 <span data-i18n="team.comment">留言</span>
                            <span class="comment-badge" id="comment-badge-${member.id}">0</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // 追加到容器末尾
        container.insertAdjacentHTML('beforeend', customCards);
        return;
    }

    // 对于 support 分类，包含从后端加载的成员
    const allMembers = [...supportMembers, ...customMembers];
    console.log(`✅ Rendering support:`, allMembers.length, 'total members');

    const memberCards = allMembers.map(member => {
        const deleteBtn = member.isDefault ? '' :
            `<button onclick="deleteMember('${member.id}')" class="delete-member-btn" title="删除成员">🗑️</button>`;

        // 处理名字显示
        let displayName = member.name;
        if (displayName && !displayName.startsWith('@')) {
            displayName = '@' + displayName;
        }

        return `
            <div class="team-card" data-member="${member.id}">
                ${deleteBtn}
                <div class="role">${member.role}</div>
                <div class="name">${displayName}</div>
                ${member.description ? `<div class="description">${member.description}</div>` : ''}
                <div class="team-actions">
                    <button class="like-btn" onclick="likeMember('${member.id}')">
                        😍 <span class="like-count" id="likes-${member.id}">0</span>
                    </button>
                    <button class="comment-btn" onclick="openCommentModal('${member.id}', '${member.name}')">
                        💬 <span data-i18n="team.comment">留言</span>
                        <span class="comment-badge" id="comment-badge-${member.id}">0</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // 添加"我也想帮忙"卡片
    const addMemberCard = `
        <div class="team-card add-member-card" onclick="openAddMemberModal()" style="cursor: pointer;">
            <div class="role">✨</div>
            <div class="name" style="font-size: 1.3rem; margin-top: 10px;">
                <span data-i18n="team.wantToHelp">今晚我也想帮忙！</span>
            </div>
            <div style="font-size: 2.5rem; margin-top: 15px;">➕</div>
        </div>
    `;

    container.innerHTML = memberCards + addMemberCard;
}

// 处理角色选择变化
function handleRoleChange() {
    const roleSelect = document.getElementById('new-member-role');
    const customInput = document.getElementById('new-member-role-custom');
    const messageInput = document.getElementById('new-member-message');

    // 角色对应的提示词映射
    const placeholderMap = {
        '做一道菜': '我打算做...（例如：黑暗料理麻辣香锅、五级辣度水煮鱼）',
        '帮寿星挡酒': '我的挡酒绝招是...（例如：装醉比寿星还真、悄悄倒花盆）',
        '扛寿星回家': '今晚的扛人计划是...（例如：公主抱、Scooter泰塔尼克号）',
        '接送人🚗': '我今晚几点到几点可以接人...（这其实是我逃酒的理由😏）',
        '带大家玩游戏！': '我想带大家玩...（例如：德州扑克、麻将、斗地主、桌球、Switch、《小姐牌》、789、十点半、泰坦尼克、吹扑克牌、手机炸弹、金字塔、乒乓球、Rage Cage、Ride the Bus）',
        '调酒': '我直接自由发挥了老铁们（例如：失忆莫吉托、后悔长岛冰茶）',
        '帮忙做提拉米苏': '请！！！7点半到！！（🍮）',
        '帮忙打扫卫生': '我老靠谱了！（扫地收桌样样行💪）',
        '帮忙布置': '寿星真欠我的'
    };

    // 处理自定义输入显示/隐藏
    if (roleSelect.value === 'custom') {
        customInput.style.display = 'block';
        customInput.focus();
        messageInput.placeholder = '我是隐藏BOSS，打算...（例如：即兴rap、跳游泳池）';
    } else {
        customInput.style.display = 'none';
        customInput.value = '';

        // 更新留言框的 placeholder
        messageInput.placeholder = placeholderMap[roleSelect.value] || '留言（选填）';
    }
}

// 打开添加成员模态窗口
function openAddMemberModal() {
    const modal = document.getElementById('add-member-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 自动填充上次使用的名字
    const savedName = localStorage.getItem('userName');
    const nameInput = document.getElementById('new-member-name');
    if (savedName) {
        nameInput.value = savedName;
    } else {
        nameInput.value = '';
    }

    // 清空角色选择
    document.getElementById('new-member-role').value = '';
    document.getElementById('new-member-role-custom').style.display = 'none';
    document.getElementById('new-member-role-custom').value = '';

    // 清空留言框
    document.getElementById('new-member-message').value = '';
}

// 关闭添加成员模态窗口
function closeAddMemberModal() {
    const modal = document.getElementById('add-member-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// 添加新成员
async function addNewMember() {
    let name = document.getElementById('new-member-name').value.trim();
    const roleSelect = document.getElementById('new-member-role');
    const customInput = document.getElementById('new-member-role-custom');
    const messageInput = document.getElementById('new-member-message');

    // 获取角色值
    let role = roleSelect.value === 'custom' ? customInput.value.trim() : roleSelect.value;

    // 获取留言（可选）
    const message = messageInput.value.trim();

    if (!name || !role) {
        showToast(currentLang === 'zh' ? '❌ 请填写姓名和角色' : '❌ Please fill in name and role');
        return;
    }

    // 保存名字到 localStorage
    localStorage.setItem('userName', name);

    // 自动添加 @ 符号（如果用户没有输入）
    if (!name.startsWith('@')) {
        name = '@' + name;
    }

    // 判断归档分类和提示信息
    let category = 'support'; // 默认归档到 Support
    let categoryName = 'Support组';

    if (role === '做一道菜') {
        category = 'food';
        categoryName = '大厨组';
    } else if (role === '帮忙做提拉米苏') {
        category = 'dessert';
        categoryName = '饭后点心组';
    } else if (role === '调酒') {
        category = 'drinks';
        categoryName = '酒水组';
    }

    // 生成唯一 ID
    const id = 'custom_' + Date.now();

    const newMember = {
        id,
        name,
        role,
        category,
        description: message || '', // 将留言作为 description
        isDefault: false
    };

    if (!data.customMembers) {
        data.customMembers = [];
    }

    data.customMembers.push(newMember);

    try {
        const response = await fetch(`${API_URL}/custom-members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customMembers: data.customMembers })
        });

        if (response.ok) {
            // 根据分类显示不同的成功提示
            const successMessage = currentLang === 'zh'
                ? `✅ 您已被添加到【${categoryName}】！`
                : `✅ Added to ${categoryName}!`;
            showToast(successMessage);
            closeAddMemberModal();
            renderAllTeamMembers();
        }
    } catch (error) {
        console.error('添加成员失败:', error);
    }

    // 保存到本地
    localStorage.setItem('partyData', JSON.stringify(data));
}

// 删除成员
async function deleteMember(memberId) {
    if (!confirm(currentLang === 'zh' ? '确定要删除这个成员吗？' : 'Delete this member?')) {
        return;
    }

    data.customMembers = data.customMembers.filter(m => m.id !== memberId);

    try {
        const response = await fetch(`${API_URL}/custom-members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customMembers: data.customMembers })
        });

        if (response.ok) {
            showToast(currentLang === 'zh' ? '✅ 成员已删除' : '✅ Member deleted');
            renderAllTeamMembers();
        }
    } catch (error) {
        console.error('删除成员失败:', error);
    }

    // 保存到本地
    localStorage.setItem('partyData', JSON.stringify(data));
}

// ==================== 游戏组局功能 ====================

let lobbyAutoRefreshInterval;

// 渲染游戏组局大厅
async function renderGameLobbies() {
    try {
        const response = await fetch(`${API_URL}/game-lobbies`);
        const result = await response.json();
        const lobbies = result.lobbies || [];

        const container = document.getElementById('game-lobbies-container');
        if (!container) return;

        // 如果没有组局，显示空状态
        if (lobbies.length === 0) {
            container.innerHTML = `
                <div class="lobby-empty">
                    <div class="lobby-empty-icon">🎮</div>
                    <div class="lobby-empty-text">暂无组局，快来发起第一个吧！</div>
                </div>
            `;
            return;
        }

        // 按创建时间倒序排列
        lobbies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // 获取当前用户名
        const currentUser = localStorage.getItem('userName') || '';

        // 渲染组局卡片
        const html = lobbies.map(lobby => {
            const isOrganizer = currentUser && lobby.organizer === currentUser;
            const deleteBtn = isOrganizer
                ? `<button onclick="deleteGameLobby('${lobby.id}')" class="delete-lobby-btn">🗑️ 删除</button>`
                : '';

            return `
                <div class="lobby-card">
                    <div class="lobby-game">🎲 ${lobby.game}</div>
                    <div class="lobby-info">
                        <span class="lobby-info-icon">👤</span>
                        <span>发起人：${lobby.organizer}</span>
                    </div>
                    ${lobby.time ? `
                        <div class="lobby-info">
                            <span class="lobby-info-icon">🕒</span>
                            <span>时间：${lobby.time}</span>
                        </div>
                    ` : ''}
                    ${lobby.message ? `
                        <div class="lobby-info">
                            <span class="lobby-info-icon">💬</span>
                            <span>${lobby.message}</span>
                        </div>
                    ` : ''}
                    <div class="lobby-participants">
                        <div class="participants-label">🙌 已响应 (${lobby.participants.length}人)：</div>
                        <div class="participants-list">
                            ${lobby.participants.map(p => `<span class="participant-tag">${p}</span>`).join('')}
                        </div>
                    </div>
                    <div class="lobby-actions">
                        <button onclick="joinGameLobby('${lobby.id}')" class="join-btn">+1 想玩</button>
                        ${deleteBtn}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    } catch (error) {
        console.error('加载游戏组局失败:', error);
    }
}

// 打开创建组局模态窗口
function openCreateLobbyModal() {
    const modal = document.getElementById('create-lobby-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 自动填充发起人姓名
    const savedName = localStorage.getItem('userName');
    const organizerInput = document.getElementById('lobby-organizer');
    if (savedName) {
        organizerInput.value = savedName;
    } else {
        organizerInput.value = '';
    }

    // 清空其他字段
    document.getElementById('lobby-game').value = '';
    document.getElementById('lobby-time').value = '';
    document.getElementById('lobby-message').value = '';
}

// 关闭创建组局模态窗口
function closeCreateLobbyModal() {
    const modal = document.getElementById('create-lobby-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// 创建游戏组局
async function createGameLobby() {
    let organizer = document.getElementById('lobby-organizer').value.trim();
    const game = document.getElementById('lobby-game').value;
    const time = document.getElementById('lobby-time').value.trim();
    const message = document.getElementById('lobby-message').value.trim();

    // 验证必填字段
    if (!organizer || !game) {
        showToast('❌ 请填写发起人姓名和选择游戏');
        return;
    }

    // 保存名字到 localStorage
    localStorage.setItem('userName', organizer);

    // 自动添加 @ 符号
    if (!organizer.startsWith('@')) {
        organizer = '@' + organizer;
    }

    try {
        const response = await fetch(`${API_URL}/game-lobbies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ organizer, game, time, message })
        });

        if (response.ok) {
            showToast('✅ 组局发起成功！');
            closeCreateLobbyModal();
            renderGameLobbies();
        } else {
            const error = await response.json();
            showToast('❌ ' + (error.error || '发起失败'));
        }
    } catch (error) {
        console.error('创建组局失败:', error);
        showToast('❌ 创建组局失败');
    }
}

// 加入游戏组局
async function joinGameLobby(lobbyId) {
    let userName = localStorage.getItem('userName');

    // 如果没有保存的用户名，提示输入
    if (!userName) {
        userName = prompt('请输入您的名字：');
        if (!userName) return;

        userName = userName.trim();
        localStorage.setItem('userName', userName);
    }

    // 自动添加 @ 符号
    if (!userName.startsWith('@')) {
        userName = '@' + userName;
    }

    try {
        const response = await fetch(`${API_URL}/game-lobbies/${lobbyId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName })
        });

        if (response.ok) {
            showToast('✅ 已加入组局！');
            renderGameLobbies();
        } else {
            const error = await response.json();
            showToast('❌ ' + (error.error || '加入失败'));
        }
    } catch (error) {
        console.error('加入组局失败:', error);
        showToast('❌ 加入组局失败');
    }
}

// 删除游戏组局
async function deleteGameLobby(lobbyId) {
    if (!confirm('确定要删除这个组局吗？')) {
        return;
    }

    const organizer = localStorage.getItem('userName');
    if (!organizer) {
        showToast('❌ 无法验证身份');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/game-lobbies/${lobbyId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ organizer })
        });

        if (response.ok) {
            showToast('✅ 组局已删除');
            renderGameLobbies();
        } else {
            const error = await response.json();
            showToast('❌ ' + (error.error || '删除失败'));
        }
    } catch (error) {
        console.error('删除组局失败:', error);
        showToast('❌ 删除组局失败');
    }
}

// 启动游戏组局自动刷新
function startLobbyAutoRefresh() {
    // 每5秒刷新一次
    lobbyAutoRefreshInterval = setInterval(() => {
        renderGameLobbies();
    }, 5000);
}

// 停止自动刷新
function stopLobbyAutoRefresh() {
    if (lobbyAutoRefreshInterval) {
        clearInterval(lobbyAutoRefreshInterval);
    }
}
