// 国际化翻译数据
const translations = {
    zh: {
        // Hero Section
        'hero.title': '🎂 Tianlai的生日派对',
        'hero.subtitle': 'Wuhu～～～～起飞',
        'hero.countdown.inProgress': '🎉 Let\'s party!',
        'hero.countdown.days': '天',
        'hero.countdown.hours': '小时',
        'hero.countdown.minutes': '分钟',
        'hero.countdown.seconds': '秒',

        // Info Section
        'info.title': '📍 派对信息',
        'info.time.label': '时间',
        'info.time.value': '11月22日 晚上8:30',
        'info.location': '地点',
        'info.clickToCopy': '点击卡片复制地址',
        'info.clickToView': '点击查看大图',
        'info.title': '派对须知',
        'info.dress': '没有Dress Code，穿的舒适美丽帅气就行！',
        'info.gift': '不用带礼物，如果一定要带，带点吃的喝的就行！',
        'info.contact': '有急事给寿星打电话：',
        'info.parking.label': '停车',
        'info.parking.value': '停车在入口处',
        'info.smoking.label': '吸烟',
        'info.smoking.value': '请勿在室内吸烟，室外火炉处可以吸烟！🚬',
        
        // Schedule Section
        'schedule.title': '⏰ 时间安排',
        'schedule.setup': '开始布置（想提前来布置的朋友可以来）',
        'schedule.tiramisu': '🍰 制作提拉米苏（对制作提拉米苏感兴趣的朋友可以提前来）',
        'schedule.start': '🎉 派对正式开始😍',
        'schedule.snacks': '开始提供夜宵',
        'schedule.cake': '吃蛋糕',
        'schedule.after': 'After Party',
        
        // Team Section
        'team.title': '👥 团队成员',
        'team.music': '🎵 音乐',
        'team.food': '🍜 夜宵',
        'team.dessert': '🍰 点心',
        'team.drinks': '🍷 酒水',
        'team.support': '🎯 其他支持',
        'team.dj': 'DJ',
        'team.chef': '大厨',
        'team.master': '提拉米苏大师',
        'team.bartender': '调酒师',
        'team.playlist': '当晚的音乐 List',
        'team.dinner': 'DINNER',
        'team.after11': 'AFTER 11',
        'team.likeButton': '给她点赞',
        'team.comment': '留言',
        'team.addMember': '添加成员',
        'team.wantToHelp': '今晚我还想帮忙！',
        'team.addMemberTitle': '今晚我还想帮忙！',
        'team.memberNamePlaceholder': '成员名字',
        'team.memberRolePlaceholder': '角色/职责',
        'team.addMemberBtn': '添加',

        // Noah, Krystal, 李哲豪
        'team.noah.role': '当晚的大厨',
        'team.noah.note': '有少量素食选项',
        'team.krystal.role': '提拉米苏大师',
        'team.lizhehao.name': '@李哲豪',
        'team.lizhehao.role': '调酒师',
        'team.lizhehao.note1': '酒水管够！要喝酒的就别开车来了！',
        'team.lizhehao.note2': '提供水和软饮料',

        // Comment Section
        'comment.titlePrefix': '给',
        'comment.titleSuffix': '留言',
        'comment.namePlaceholder': '你的名字',
        'comment.textPlaceholder': '写下你想说的话...',
        'comment.submit': '发送留言',
        'comment.listTitle': '所有留言',
        'team.likes': '个赞',
        
        // Navigation Menu
        'nav.title': '导航菜单',
        'nav.home': '🏠 首页',
        'nav.info': '📍 派对信息',
        'nav.schedule': '⏰ 时间安排',
        'nav.team': '✨ 派对团队',
        'nav.foodies': '🐱 小馋猫列表',
        'nav.drinking': '🍺 逃酒排行榜',
        'nav.games': '🎮 游戏',

        // Foodies Section
        'foodies.title': '🐱 小馋猫列表',
        'foodies.subtitle': '如果觉得自己是小馋猫的，想吃夜宵的，请留下自己的名字！',
        'foodies.placeholder': '输入你的名字',
        'foodies.button': '我是小馋猫',
        'foodies.empty': '还没有小馋猫报名~',
        
        // Drinking Section
        'drinking.title': '🍺 逃酒排行榜',
        'drinking.subtitle': '今晚你要喝几杯？',
        'drinking.rules': '规则：每5个俯卧撑可以代替半杯 | 一杯等于100口',
        'drinking.namePlaceholder': '输入你的名字',
        'drinking.countPlaceholder': '我要逃几杯',
        'drinking.button': '加入排行榜',
        'drinking.empty': '还没有人加入排行榜~',
        'drinking.tonight': '今晚我要喝',
        'drinking.cups': '杯',
        
        // Games Section
        'games.title': '🎮 游戏',
        'games.hint': '点击查看教程',
        'games.texasHoldem': '德州扑克',
        'games.mahjong': '麻将',
        'games.landlord': '斗地主',
        'games.pool': '桌球',
        'games.switch': 'Switch',
        'games.xiaojie': '小姐牌',
        'games.tenHalf': '十点半',
        'games.pingpong': '乒乓球',
        'games.rageCage': 'Rage Cage',
        'games.rideBus': 'Ride the Bus',
        'games.789': '789',
        'games.titanic': '泰坦尼克',
        'games.blowCards': '吹扑克牌',
        'games.phoneBomb': '手机炸弹',
        'games.pyramid': '金字塔',
        
        // Vibe Poll
        'vibe.title': '✨ Preference Poll: What\'s your vibe?',
        'vibe.subtitle': '选择你今晚想玩的类型（可多选）',
        'vibe.drinking': 'Drinking Games',
        'vibe.card': 'Card Games',
        'vibe.board': 'Board Games',
        'vibe.video': 'Video Games',
        'vibe.chill': 'Just Chilling',
        'vibe.votes': 'votes',
        'vibe.vote': 'vote',
        'vibe.namePlaceholder': '输入你的名字',
        'vibe.button': '提交投票',
        'vibe.empty': '还没有人投票~',
        
        // Admin
        'admin.button': '管理员',
        'admin.title': '后台监控',
        'admin.export': '导出数据',
        'admin.clear': '清空数据',
        
        // Alerts
        'alert.enterName': '请输入你的名字！',
        'alert.enterCount': '请输入杯数！',
        'alert.selectVibe': '请至少选择一个选项！',
        'alert.confirmClear': '确定要清空所有数据吗？此操作不可恢复！'
    },
    en: {
        // Hero Section
        'hero.title': '🎂 Tianlai\'s Birthday Party',
        'hero.subtitle': 'Let\'s celebrate this special night together',
        'hero.countdown.inProgress': '🎉 Let\'s party!',
        'hero.countdown.days': 'Days',
        'hero.countdown.hours': 'Hours',
        'hero.countdown.minutes': 'Minutes',
        'hero.countdown.seconds': 'Seconds',

        // Info Section
        'info.title': '📍 Party Info',
        'info.time.label': 'Time',
        'info.time.value': 'November 22, 8:30 PM',
        'info.location': 'Location',
        'info.clickToCopy': 'Click card to copy address',
        'info.clickToView': 'Click to view larger image',
        'info.title': 'Party Info',
        'info.dress': 'No dress code - just be comfortable and look great!',
        'info.gift': 'No need to bring gifts! But if you insist, some food or drinks would be nice!',
        'info.contact': 'For urgent matters, call the birthday star: ',
        'info.parking.label': 'Parking',
        'info.parking.value': 'Park at the entrance',
        'info.smoking.label': 'Smoking',
        'info.smoking.value': 'No indoor smoking. Outdoor fire pit area is OK! 🚬',
        
        // Schedule Section
        'schedule.title': '⏰ Schedule',
        'schedule.setup': 'Setup begins (early birds welcome!)',
        'schedule.tiramisu': '🍰 Tiramisu making session (early birds welcome!)',
        'schedule.start': '🎉 Party officially starts😍',
        'schedule.snacks': 'Late night snacks served',
        'schedule.cake': 'Cake time',
        'schedule.after': 'After Party',
        
        // Team Section
        'team.title': '👥 Team',
        'team.music': '🎵 Music',
        'team.food': '🍜 Food',
        'team.dessert': '🍰 Dessert',
        'team.drinks': '🍷 Drinks',
        'team.support': '🎯 Support',
        'team.dj': 'DJ',
        'team.chef': 'Chef',
        'team.master': 'Tiramisu Master',
        'team.bartender': 'Bartender',
        'team.playlist': 'Tonight\'s Playlist',
        'team.dinner': 'DINNER',
        'team.after11': 'AFTER 11',
        'team.likeButton': 'Like',
        'team.comment': 'Comment',
        'team.addMember': 'Add Member',
        'team.wantToHelp': 'I also want to help tonight!',
        'team.addMemberTitle': 'I also want to help tonight!',
        'team.memberNamePlaceholder': 'Member Name',
        'team.memberRolePlaceholder': 'Role/Responsibility',
        'team.addMemberBtn': 'Add',

        // Noah, Krystal, 李哲豪
        'team.noah.role': 'Chef of the Night',
        'team.noah.note': 'Some vegetarian options available',
        'team.krystal.role': 'Tiramisu Master',
        'team.lizhehao.name': '@Li Zhehao',
        'team.lizhehao.role': 'Bartender',
        'team.lizhehao.note1': 'Plenty of drinks! Don\'t drive if you\'re drinking!',
        'team.lizhehao.note2': 'Water and soft drinks provided',

        // Comment Section
        'comment.titlePrefix': 'Leave a comment for',
        'comment.titleSuffix': '',
        'comment.namePlaceholder': 'Your name',
        'comment.textPlaceholder': 'Write your message...',
        'comment.submit': 'Post Comment',
        'comment.listTitle': 'All Comments',
        'team.likes': 'likes',
        
        // Navigation Menu
        'nav.title': 'Navigation',
        'nav.home': '🏠 Home',
        'nav.info': '📍 Party Info',
        'nav.schedule': '⏰ Schedule',
        'nav.team': '✨ Team',
        'nav.foodies': '🐱 Foodie List',
        'nav.drinking': '🍺 Drinking',
        'nav.games': '🎮 Games',

        // Foodies Section
        'foodies.title': '🐱 Foodie List',
        'foodies.subtitle': 'If you think you\'re a foodie and want late night snacks, please leave your name!',
        'foodies.placeholder': 'Enter your name',
        'foodies.button': 'I\'m a Foodie',
        'foodies.empty': 'No foodies yet~',
        
        // Drinking Section
        'drinking.title': '🍺 Drinking Leaderboard',
        'drinking.subtitle': 'How many drinks tonight?',
        'drinking.rules': 'Rules: 5 push-ups = half drink | 1 drink = 100 sips',
        'drinking.namePlaceholder': 'Enter your name',
        'drinking.countPlaceholder': 'Number of drinks',
        'drinking.button': 'Join Leaderboard',
        'drinking.empty': 'No one on the leaderboard yet~',
        'drinking.tonight': 'Tonight I\'ll drink',
        'drinking.cups': 'drinks',
        
        // Games Section
        'games.title': '🎮 Games',
        'games.hint': 'Click for tutorial',
        'games.texasHoldem': 'Texas Hold\'em',
        'games.mahjong': 'Mahjong',
        'games.landlord': 'Fight the Landlord',
        'games.pool': 'Pool',
        'games.switch': 'Switch',
        'games.xiaojie': 'Old Maid (Chinese)',
        'games.tenHalf': 'Ten and a Half',
        'games.pingpong': 'Beer Pong',
        'games.rageCage': 'Rage Cage',
        'games.rideBus': 'Ride the Bus',
        'games.789': '789',
        'games.titanic': 'Titanic',
        'games.blowCards': 'Blow the Cards',
        'games.phoneBomb': 'Phone Bomb',
        'games.pyramid': 'Pyramid',
        
        // Vibe Poll
        'vibe.title': '✨ Preference Poll: What\'s your vibe?',
        'vibe.subtitle': 'Choose what you want to play tonight (multiple choices allowed)',
        'vibe.drinking': 'Drinking Games',
        'vibe.card': 'Card Games',
        'vibe.board': 'Board Games',
        'vibe.video': 'Video Games',
        'vibe.chill': 'Just Chilling',
        'vibe.votes': 'votes',
        'vibe.vote': 'vote',
        'vibe.namePlaceholder': 'Enter your name',
        'vibe.button': 'Submit Vote',
        'vibe.empty': 'No votes yet~',
        
        // Admin
        'admin.button': 'Admin',
        'admin.title': 'Admin Panel',
        'admin.export': 'Export Data',
        'admin.clear': 'Clear Data',
        
        // Alerts
        'alert.enterName': 'Please enter your name!',
        'alert.enterCount': 'Please enter the number of drinks!',
        'alert.selectVibe': 'Please select at least one option!',
        'alert.confirmClear': 'Are you sure you want to clear all data? This cannot be undone!'
    }
};

// 当前语言
let currentLang = localStorage.getItem('language') || 'zh';

// 切换语言
function toggleLanguage() {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('language', currentLang);
    applyLanguage();
    updateLanguageButton();

    // 重新渲染动态内容
    if (typeof renderAll === 'function') {
        renderAll();
    }

    // 重新渲染时间安排
    if (typeof renderTimeline === 'function') {
        renderTimeline();
    }

    // 重新渲染团队成员（支持双语）
    if (typeof renderAllTeamMembers === 'function') {
        renderAllTeamMembers();
    }
}

// 应用语言
function applyLanguage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = translations[currentLang][key];
        if (translation) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
                // 更新 glitch 效果的 data-text 属性
                if (el.classList.contains('glitch')) {
                    el.setAttribute('data-text', translation);
                }
            }
        }
    });

    // 处理 placeholder 翻译
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translation = translations[currentLang][key];
        if (translation) {
            el.placeholder = translation;
        }
    });

    // 更新 HTML lang 属性
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
}

// 更新语言按钮
function updateLanguageButton() {
    const icon = document.getElementById('lang-icon');
    const text = document.getElementById('lang-text');

    // 当前是中文，显示美国国旗（表示可以切换到英文）
    if (currentLang === 'zh') {
        icon.textContent = '🇺🇸';
        text.textContent = 'EN';
    } else {
        // 当前是英文，显示中国国旗（表示可以切换到中文）
        icon.textContent = '🇨🇳';
        text.textContent = '中文';
    }
}

// 获取翻译文本
function t(key) {
    return translations[currentLang][key] || key;
}

// 页面加载时应用语言
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage();
    updateLanguageButton();
});
