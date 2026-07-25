/* ============================================
Selena 工作台 - 核心应用
============================================ */

// ===== 存储工具 =====
const Store = {
get(key, def) {
try { const v = localStorage.getItem('selena_' + key); return v ? JSON.parse(v) : def; }
catch(e) { return def; }
},
set(key, val) { localStorage.setItem('selena_' + key, JSON.stringify(val)); }
};

// ===== Toast =====
function toast(msg) {
const t = document.getElementById('toast');
t.textContent = msg;
t.classList.add('show');
setTimeout(() => t.classList.remove('show'), 2000);
}

// ===== 视图切换 =====
function navigate(view) {
document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
const el = document.getElementById(view + 'View') || document.getElementById(view);
if (el) el.classList.add('active');
// 底部导航高亮
document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === view));
// 滚到顶部
window.scrollTo(0, 0);
// 触发各视图刷新
if (view === 'accounting') renderAccounting();
if (view === 'todo') renderTodos();
if (view === 'english') loadEnglishSentence();
if (view === 'fitness') loadFitness();
if (view === 'reading') renderBooks();
}

// ===== 日期/时间 =====
function getToday() { return new Date().toISOString().slice(0, 10); }
function formatDate() {
const d = new Date();
const week = ['日','一','二','三','四','五','六'];
return `${d.getMonth()+1}月${d.getDate()}日 周${week[d.getDay()]}`;
}

// ===== 每日一句 =====
const QUOTES = [
{ en: "The best time to plant a tree was 20 years ago. The second best time is now.", zh: "种树最好的时间是20年前，其次是现在。" },
{ en: "Success is not final, failure is not fatal: it is the courage to continue that counts.", zh: "成功不是终点，失败也不是末日，重要的是继续前行的勇气。" },
{ en: "The only way to do great work is to love what you do.", zh: "成就伟业的唯一途径是热爱你所做的事。" },
{ en: "Don't watch the clock; do what it does. Keep going.", zh: "别看时钟，学它的样子——一直走。" },
{ en: "The future belongs to those who believe in the beauty of their dreams.", zh: "未来属于那些相信梦想之美的人。" },
{ en: "It always seems impossible until it's done.", zh: "在完成之前，一切看起来都不可能。" },
{ en: "Be the change you wish to see in the world.", zh: "成为你想在世界上看到的改变。" },
{ en: "Quality is not an act, it is a habit.", zh: "品质不是一种行为，而是一种习惯。" }
];

function loadDailyQuote() {
const idx = new Date().getDate() % QUOTES.length;
const q = QUOTES[idx];
document.getElementById('quoteText').textContent = '"' + q.en + '"';
document.getElementById('quoteTrans').textContent = q.zh;
}

// ===== 仪表盘初始化 =====
function initDashboard() {
document.getElementById('todayDate').textContent = formatDate();
loadDailyQuote();
updateDashboard();
}

function updateDashboard() {
const expenses = Store.get('expenses', []);
const today = getToday();
const todayExp = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
document.getElementById('todayExpense').textContent = '¥' + todayExp.toFixed(2);

const todos = Store.get('todos', []);
const pending = todos.filter(t => !t.done);
document.getElementById('todoCount').textContent = pending.length + ' 项';
document.getElementById('todoPending').textContent = pending.length ? '点击查看' : '全部完成 🎉';

// 健身状态
const fitnessLog = Store.get('fitnessLog', {});
document.getElementById('fitnessStatus').textContent = fitnessLog[today] ? '已完成 ✓' : '未完成';

// 阅读进度
const currentBook = Store.get('currentBook', null);
if (currentBook) {
document.getElementById('readingBook').textContent = currentBook.title;
document.getElementById('readingProgress').textContent = (currentBook.progress || 0) + '%';
}
}

// ===== 记账模块 =====
let selectedCategory = null;
const CAT_ICONS = { '餐饮':'🍱','交通':'🚗','购物':'🛍️','娱乐':'🎮','学习':'📚','健身':'💪','美妆':'💄','其他':'📌' };

function initAccounting() {
// 分类按钮
document.querySelectorAll('.cat-btn').forEach(btn => {
btn.addEventListener('click', () => {
document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
selectedCategory = btn.dataset.cat;
});
});

// 保存
document.getElementById('saveExpenseBtn').addEventListener('click', () => {
const amount = parseFloat(document.getElementById('accAmount').value);
if (!amount || amount <= 0) { toast('请输入金额'); return; }
if (!selectedCategory) { toast('请选择分类'); return; }
const note = document.getElementById('accNote').value || '';
const expenses = Store.get('expenses', []);
expenses.unshift({
id: Date.now(),
amount,
category: selectedCategory,
note,
date: getToday(),
time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
});
Store.set('expenses', expenses);
// 重置
document.getElementById('accAmount').value = '';
document.getElementById('accNote').value = '';
document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
selectedCategory = null;
toast('✓ 记账成功');
renderAccounting();
updateDashboard();
});
}

function renderAccounting() {
const expenses = Store.get('expenses', []);
const now = new Date();
const monthStr = now.toISOString().slice(0, 7);

const monthExp = expenses.filter(e => e.date.startsWith(monthStr)).reduce((s, e) => s + e.amount, 0);
document.getElementById('monthExpense').textContent = '¥' + monthExp.toFixed(2);

const weekStart = new Date(now);
weekStart.setDate(now.getDate() - now.getDay());
const weekExp = expenses.filter(e => new Date(e.date) >= weekStart).reduce((s, e) => s + e.amount, 0);
document.getElementById('weekExpense').textContent = '¥' + weekExp.toFixed(2);

// 分类统计
const catMap = {};
expenses.filter(e => e.date.startsWith(monthStr)).forEach(e => {
catMap[e.category] = (catMap[e.category] || 0) + e.amount;
});
const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
document.getElementById('topCategory').textContent = sorted[0] ? sorted[0][0] : '-';

// 图表
const chart = document.getElementById('categoryChart');
const maxVal = sorted[0] ? sorted[0][1] : 1;
const colors = ['#6C5CE7','#00B894','#FF7675','#FDCB6E','#74b9ff','#e17055','#a29bfe','#55efc4'];
chart.innerHTML = sorted.length ? sorted.map((c, i) => `
<div class="bar-row">
<span class="bar-label">${CAT_ICONS[c[0]] || '📌'} ${c[0]}</span>
<div class="bar-track">
<div class="bar-fill" style="width:${(c[1]/maxVal*100)}%;background:${colors[i%colors.length]}">¥${c[1].toFixed(0)}</div>
</div>
</div>
`).join('') : '<div class="empty">暂无数据，开始记账吧</div>';

// 记录列表
const list = document.getElementById('expenseList');
list.innerHTML = expenses.length ? expenses.slice(0, 20).map(e => `
<div class="expense-item">
<div class="expense-icon">${CAT_ICONS[e.category] || '📌'}</div>
<div class="expense-info">
<div class="expense-cat">${e.category}</div>
${e.note ? `<div class="expense-note">${e.note}</div>` : ''}
<div class="expense-time">${e.date} ${e.time || ''}</div>
</div>
<div class="expense-amount">-¥${e.amount.toFixed(2)}</div>
<button class="expense-del" data-id="${e.id}">✕</button>
</div>
`).join('') : '<div class="empty">还没有记录</div>';

list.querySelectorAll('.expense-del').forEach(b => {
b.addEventListener('click', () => {
const id = parseInt(b.dataset.id);
const exps = Store.get('expenses', []);
Store.set('expenses', exps.filter(e => e.id !== id));
renderAccounting();
updateDashboard();
toast('已删除');
});
});
}

// ===== 跨境电商数据 =====
const EC_NEWS = [
{ tag: '行业动态', title: '亚马逊宣布2025年FBA费用调整', summary: '亚马逊对标准尺寸商品FBA配送费上调3-5%，同时推出新的入库绩效指标(IPI)要求，卖家需保持IPI分数500以上以避免仓储限制。', date: '2025-07-20' },
{ tag: '选品趋势', title: '女鞋品类：厚底运动鞋持续热销', summary: 'Platform厚底老爹鞋、Cloud运动鞋继续领跑亚马逊女鞋BSR。舒适通勤鞋搜索量同比增长35%，运动休闲风仍是主旋律。', date: '2025-07-22' },
{ tag: '平台政策', title: 'Walmart Marketplace开放更多第三方卖家', summary: 'Walmart持续扩大第三方卖家规模，对跨境卖家审核加快。新增WFS仓储服务支持小件商品，配送时效缩短至2天。', date: '2025-07-18' },
{ tag: '营销策略', title: 'Target推出新一轮Circle Week促销', summary: 'Target Circle Week涵盖服饰鞋包品类，女鞋和手袋折扣力度达40-50%。第三方卖家可参与促销活动获取额外流量曝光。', date: '2025-07-21' },
{ tag: '选品趋势', title: '包包品类：迷你包和托特包两极分化', summary: '迷你斜挎包在Z世代中持续流行，而大容量托特包在职场女性中需求稳定。皮质通勤包客单价$40-80区间竞争较小。', date: '2025-07-23' }
];

const PRODUCTS = [
{ platform: 'amazon', cat: 'shoes', name: 'Steve Madden 厚底运动鞋', price: '$89.95', emoji: '👟', tags: ['热销','厚底','通勤'] },
{ platform: 'amazon', cat: 'shoes', name: 'Cloud Monster 缓冲跑鞋', price: '$169.99', emoji: '👟', tags: ['新品','运动','舒适'] },
{ platform: 'amazon', cat: 'shoes', name: 'Dr. Scholls 舒适平底鞋', price: '$49.99', emoji: '👠', tags: ['通勤','舒适'] },
{ platform: 'amazon', cat: 'bags', name: 'MK Jet Set 托特包', price: '$128.00', emoji: '👜', tags: ['经典','职场'] },
{ platform: 'amazon', cat: 'bags', name: 'Coach Tabby 迷你包', price: '$195.00', emoji: '👜', tags: ['热销','迷你'] },
{ platform: 'amazon', cat: 'bags', name: '斜挎尼龙腰包', price: '$22.99', emoji: '🎒', tags: ['低价','休闲'] },
{ platform: 'target', cat: 'shoes', name: 'Madison 系带乐福鞋', price: '$39.99', emoji: '👞', tags: ['新品','复古'] },
{ platform: 'target', cat: 'shoes', name: 'Cloudslide 凉拖', price: '$25.00', emoji: '👡', tags: ['夏季','舒适'] },
{ platform: 'target', cat: 'bags', name: 'Leather Crossbody 斜挎包', price: '$44.99', emoji: '👜', tags: ['简约'] },
{ platform: 'target', cat: 'bags', name: 'Canvas Tote 帆布托特', price: '$19.99', emoji: '👜', tags: ['低价','日常'] },
{ platform: 'walmart', cat: 'shoes', name: 'Athletic Running Sneakers', price: '$29.97', emoji: '👟', tags: ['低价','运动'] },
{ platform: 'walmart', cat: 'shoes', name: 'Slip On Casual Flats', price: '$19.88', emoji: '👞', tags: ['低价','休闲'] },
{ platform: 'walmart', cat: 'bags', name: 'Faux Leather Satchel', price: '$24.88', emoji: '👜', tags: ['低价','通勤'] },
{ platform: 'walmart', cat: 'bags', name: 'Mini Backpack 小背包', price: '$17.97', emoji: '🎒', tags: ['低价','休闲'] },
{ platform: 'kohls', cat: 'shoes', name: 'Nike Tanjun 运动鞋', price: '$54.99', emoji: '👟', tags: ['品牌','经典'] },
{ platform: 'kohls', cat: 'shoes', name: 'Crocs 经典洞洞鞋', price: '$44.99', emoji: '👡', tags: ['夏季','舒适'] },
{ platform: 'kohls', cat: 'bags', name: 'Vera Bradley 花纹包', price: '$59.99', emoji: '👜', tags: ['品牌','花纹'] },
{ platform: 'kohls', cat: 'bags', name: 'Sonoma 皮革手提包', price: '$39.99', emoji: '👜', tags: ['简约'] }
];

const PROMOS = [
{ platform: 'Amazon', title: 'Prime Day 秋季返场', detail: '预计9月下旬。会员专享折扣，女鞋品类历史折扣30-60%。建议提前备货、设置Coupon、优化Listing。', deadline: '预计 2025年9月' },
{ platform: 'Target', title: 'Circle Week 服饰促销', detail: 'Target Circle会员享受额外40-50% off鞋包。第三方卖家可提报参与，需提前2周申请。', deadline: '本月底截止' },
{ platform: 'Walmart', title: 'Walmart+ 会员日', detail: 'Walmart+会员专属折扣，运动鞋和休闲包有大额减免。WFS入仓商品优先曝光。', deadline: '每月第一个周五' },
{ platform: 'Kohls', title: 'Kohl\'s Cash 返现活动', detail: '每消费$50返$10 Kohl\'s Cash，可叠加折扣码。女鞋品类参与力度大。', deadline: '本周末截止' },
{ platform: '通用', title: 'Q4 备货截止提醒', detail: '亚马逊FBA Q4入库截止日通常在10月中旬。如需参加黑五网一，女鞋女包需9月前完成备货发往FBA。', deadline: '2025年10月中旬' }
];

function initEcommerce() {
// Tab切换
document.querySelectorAll('#ecomTabs .tab-btn').forEach(btn => {
btn.addEventListener('click', () => {
document.querySelectorAll('#ecomTabs .tab-btn').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
document.querySelectorAll('#ecommerceView .tab-content').forEach(c => c.classList.remove('active'));
document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
});
});

// 资讯
document.getElementById('newsList').innerHTML = EC_NEWS.map(n => `
<div class="news-item">
<span class="news-tag">${n.tag}</span>
<div class="news-title">${n.title}</div>
<div class="news-summary">${n.summary}</div>
<div class="news-date">📅 ${n.date}</div>
</div>
`).join('');

// 商品筛选
let curPlatform = 'all', curCat = 'all';
document.querySelectorAll('#tab-products .filter-btn[data-platform]').forEach(btn => {
btn.addEventListener('click', () => {
document.querySelectorAll('#tab-products .filter-btn[data-platform]').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
curPlatform = btn.dataset.platform;
renderProducts(curPlatform, curCat);
});
});
document.querySelectorAll('#tab-products .filter-btn[data-category]').forEach(btn => {
btn.addEventListener('click', () => {
document.querySelectorAll('#tab-products .filter-btn[data-category]').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
curCat = btn.dataset.category;
renderProducts(curPlatform, curCat);
});
});
renderProducts('all', 'all');

// 促销
document.getElementById('promoList').innerHTML = PROMOS.map(p => `
<div class="promo-card">
<div class="promo-platform">${p.platform}</div>
<div class="promo-title">${p.title}</div>
<div class="promo-detail">${p.detail}</div>
<div class="promo-deadline">⏰ ${p.deadline}</div>
</div>
`).join('');
}

function renderProducts(platform, cat) {
const filtered = PRODUCTS.filter(p =>
(platform === 'all' || p.platform === platform) &&
(cat === 'all' || p.cat === cat)
);
const platformNames = { amazon:'亚马逊', target:'Target', walmart:'Walmart', kohls:'Kohls' };
const platformColors = { amazon:'#FF9900', target:'#CC0000', walmart:'#0071CE', kohls:'#CC0000' };
document.getElementById('productList').innerHTML = filtered.map(p => `
<div class="product-card">
<div class="product-img">${p.emoji}</div>
<div class="product-info">
<span class="product-platform" style="background:${platformColors[p.platform]}">${platformNames[p.platform]}</span>
<div class="product-name">${p.name}</div>
<div class="product-price">${p.price}</div>
<div class="product-tags">${p.tags.map(t => `<span class="product-tag">${t}</span>`).join('')}</div>
</div>
</div>
`).join('');
}

// ===== 待办模块 =====
let curFilter = 'all';

function initTodo() {
document.getElementById('addTodoBtn').addEventListener('click', addTodoFromInput);
document.getElementById('todoInput').addEventListener('keypress', e => {
if (e.key === 'Enter') addTodoFromInput();
});

document.querySelectorAll('#todoView .filter-btn[data-filter]').forEach(btn => {
btn.addEventListener('click', () => {
document.querySelectorAll('#todoView .filter-btn').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
curFilter = btn.dataset.filter;
renderTodos();
});
});

// 语音输入
document.getElementById('voiceTodoBtn').addEventListener('click', startVoiceInput);
}

function addTodoFromInput() {
const input = document.getElementById('todoInput');
const text = input.value.trim();
if (!text) return;
addTodo(text, 'manual');
input.value = '';
}

function addTodo(text, source) {
const todos = Store.get('todos', []);
todos.unshift({ id: Date.now(), text, done: false, source, date: getToday() });
Store.set('todos', todos);
renderTodos();
updateDashboard();
toast('✓ 已添加待办');
}

function renderTodos() {
const todos = Store.get('todos', []);
let filtered = todos;
if (curFilter === 'pending') filtered = todos.filter(t => !t.done);
if (curFilter === 'done') filtered = todos.filter(t => t.done);

const list = document.getElementById('todoList');
list.innerHTML = filtered.length ? filtered.map(t => `
<div class="todo-item">
<div class="todo-check ${t.done ? 'done' : ''}" data-id="${t.id}">${t.done ? '✓' : ''}</div>
<div class="todo-text ${t.done ? 'done' : ''}">${t.text}${t.source === 'voice' ? ' <span class="todo-source">🎤</span>' : ''}</div>
<button class="todo-del" data-id="${t.id}">✕</button>
</div>
`).join('') : '<div class="empty">暂无待办</div>';

list.querySelectorAll('.todo-check').forEach(c => {
c.addEventListener('click', () => {
const id = parseInt(c.dataset.id);
const ts = Store.get('todos', []);
const t = ts.find(x => x.id === id);
if (t) { t.done = !t.done; Store.set('todos', ts); renderTodos(); updateDashboard(); }
});
});
list.querySelectorAll('.todo-del').forEach(b => {
b.addEventListener('click', () => {
const id = parseInt(b.dataset.id);
Store.set('todos', Store.get('todos', []).filter(x => x.id !== id));
renderTodos(); updateDashboard();
});
});
}

// 语音识别
let recognition = null;
function initSpeechRecognition() {
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
recognition = new SR();
recognition.lang = 'zh-CN';
recognition.continuous = false;
recognition.interimResults = true;

recognition.onresult = (e) => {
let transcript = '';
for (let i = 0; i < e.results.length; i++) {
transcript += e.results[i][0].transcript;
}
document.getElementById('voiceStatus').textContent = '听到：' + transcript;
if (e.results[e.results.length - 1].isFinal) {
if (transcript.trim()) {
addTodo(transcript.trim(), 'voice');
}
}
};
recognition.onerror = (e) => {
document.getElementById('voiceStatus').textContent = '识别出错：' + e.error;
resetVoiceBtn();
};
recognition.onend = () => { resetVoiceBtn(); };
}
}

function resetVoiceBtn() {
const btn = document.getElementById('voiceTodoBtn');
btn.classList.remove('recording');
btn.querySelector('.voice-text').textContent = '点击语音输入';
}

function startVoiceInput() {
if (!recognition) {
// 降级方案：使用 input 模式
toast('当前浏览器不支持语音识别，请使用文字输入');
document.getElementById('todoInput').focus();
return;
}
const btn = document.getElementById('voiceTodoBtn');
if (btn.classList.contains('recording')) {
recognition.stop();
resetVoiceBtn();
return;
}
btn.classList.add('recording');
btn.querySelector('.voice-text').textContent = '正在聆听... 点击停止';
document.getElementById('voiceStatus').textContent = '🎤 请说话...';
try {
recognition.start();
} catch(e) {
toast('请点击允许麦克风权限');
resetVoiceBtn();
}
}

// ===== 英语模块 =====
const SENTENCES = [
{ en: "I'd like to order a coffee, please.", zh: "我想点一杯咖啡。" },
{ en: "Could you tell me the way to the station?", zh: "你能告诉我去车站怎么走吗？" },
{ en: "I'm really interested in cross-border e-commerce.", zh: "我对跨境电商非常感兴趣。" },
{ en: "What time does the store open?", zh: "这家店几点开门？" },
{ en: "I've been learning English for 40 days on Duolingo.", zh: "我在多邻国学英语已经40天了。" },
{ en: "This product is very popular among young women.", zh: "这款产品在年轻女性中非常受欢迎。" },
{ en: "Could you give me a discount?", zh: "能给我打个折吗？" },
{ en: "I'm looking for a pair of comfortable running shoes.", zh: "我在找一双舒适的跑鞋。" },
{ en: "The sales of this bag have increased by 30%.", zh: "这款包的销量增长了30%。" },
{ en: "What's your return policy?", zh: "你们的退货政策是什么？" }
];

let curSentenceIdx = 0;

function initEnglish() {
document.getElementById('playSentenceBtn').addEventListener('click', () => {
speak(document.getElementById('speakSentence').textContent, 'en-US');
});
document.getElementById('recordSpeakBtn').addEventListener('click', recordSpeak);
document.getElementById('playListenBtn').addEventListener('click', () => {
const s = SENTENCES[curSentenceIdx];
speak(s.en, 'en-US');
document.getElementById('listenSentence').textContent = '🔊 正在播放...';
setTimeout(() => {
document.getElementById('listenSentence').textContent = '请写下你听到的内容';
}, 2000);
});
document.getElementById('checkListenBtn').addEventListener('click', () => {
const input = document.getElementById('listenInput').value.trim().toLowerCase();
const answer = SENTENCES[curSentenceIdx].en.toLowerCase();
const fb = document.getElementById('listenFeedback');
if (!input) { fb.textContent = '请先输入'; fb.className = 'eng-feedback error'; return; }
const similarity = calcSimilarity(input, answer);
if (similarity > 0.8) {
fb.innerHTML = `✓ 很好！准确率 ${(similarity*100).toFixed(0)}%<br>原文：${SENTENCES[curSentenceIdx].en}<br>译文：${SENTENCES[curSentenceIdx].zh}`;
fb.className = 'eng-feedback success';
} else {
fb.innerHTML = `✗ 再听听看。准确率 ${(similarity*100).toFixed(0)}%<br>原文：${SENTENCES[curSentenceIdx].en}<br>译文：${SENTENCES[curSentenceIdx].zh}`;
fb.className = 'eng-feedback error';
}
curSentenceIdx = (curSentenceIdx + 1) % SENTENCES.length;
document.getElementById('listenInput').value = '';
});

// 单词本
document.getElementById('addWordBtn').addEventListener('click', () => {
const word = document.getElementById('wordInput').value.trim();
const meaning = document.getElementById('wordMeaning').value.trim();
if (!word || !meaning) { toast('请填写完整'); return; }
const words = Store.get('words', []);
words.unshift({ word, meaning, id: Date.now() });
Store.set('words', words);
document.getElementById('wordInput').value = '';
document.getElementById('wordMeaning').value = '';
renderWords();
toast('✓ 已添加');
});
renderWords();
}

function loadEnglishSentence() {
curSentenceIdx = Math.floor(Math.random() * SENTENCES.length);
const s = SENTENCES[curSentenceIdx];
document.getElementById('speakSentence').textContent = s.en;
document.getElementById('speakFeedback').textContent = '译文：' + s.zh;
document.getElementById('speakFeedback').className = 'eng-feedback';
document.getElementById('listenSentence').textContent = '点击播放开始听力';
document.getElementById('listenFeedback').textContent = '';
}

function speak(text, lang) {
if ('speechSynthesis' in window) {
window.speechSynthesis.cancel();
const u = new SpeechSynthesisUtterance(text);
u.lang = lang || 'en-US';
u.rate = 0.9;
window.speechSynthesis.speak(u);
} else {
toast('浏览器不支持语音播放');
}
}

function recordSpeak() {
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) { toast('浏览器不支持语音识别'); return; }
const r = new SR();
r.lang = 'en-US';
r.continuous = false;
r.interimResults = false;
const fb = document.getElementById('speakFeedback');
fb.textContent = '🎤 请用英语跟读...';
fb.className = 'eng-feedback';
r.onresult = (e) => {
const heard = e.results[0][0].transcript;
const target = document.getElementById('speakSentence').textContent.toLowerCase();
const sim = calcSimilarity(heard.toLowerCase(), target);
if (sim > 0.7) {
fb.innerHTML = `✓ 发音不错！<br>你说了：${heard}<br>相似度 ${(sim*100).toFixed(0)}%`;
fb.className = 'eng-feedback success';
} else {
fb.innerHTML = `继续练习<br>你说了：${heard}<br>目标：${document.getElementById('speakSentence').textContent}<br>相似度 ${(sim*100).toFixed(0)}%`;
fb.className = 'eng-feedback error';
}
};
r.onerror = () => { fb.textContent = '识别失败，请重试'; fb.className = 'eng-feedback error'; };
r.start();
}

function calcSimilarity(a, b) {
// 简单的词级相似度
const wa = a.replace(/[^a-z\s]/g,'').split(/\s+/).filter(Boolean);
const wb = b.replace(/[^a-z\s]/g,'').split(/\s+/).filter(Boolean);
if (!wb.length) return 0;
const match = wa.filter(w => wb.includes(w)).length;
return match / wb.length;
}

function renderWords() {
const words = Store.get('words', []);
const list = document.getElementById('wordList');
list.innerHTML = words.length ? words.map(w => `
<div class="word-item">
<span class="word-en">${w.word}</span>
<span class="word-zh">${w.meaning}</span>
<button class="word-del" data-id="${w.id}">✕</button>
</div>
`).join('') : '<div class="empty">还没有单词</div>';

list.querySelectorAll('.word-del').forEach(b => {
b.addEventListener('click', () => {
const id = parseInt(b.dataset.id);
Store.set('words', Store.get('words', []).filter(w => w.id !== id));
renderWords();
});
});
}

// ===== 健身模块 =====
const MEAL_PLANS = [
[
{ meal: '早餐', icon: '🥚', food: '全麦吐司2片 + 水煮蛋2个 + 牛奶1杯 + 香蕉1根', cal: 450 },
{ meal: '加餐', icon: '🥜', food: '混合坚果一把(30g) + 酸奶1杯', cal: 250 },
{ meal: '午餐', icon: '🍗', food: '鸡胸肉200g + 糙米饭1碗 + 西兰花 + 橄榄油', cal: 600 },
{ meal: '加餐', icon: '🍎', food: '蛋白粉1勺 + 燕麦棒', cal: 200 },
{ meal: '晚餐', icon: '🐟', food: '三文鱼150g + 红薯 + 沙拉 + 牛油果', cal: 550 }
],
[
{ meal: '早餐', icon: '🥣', food: '燕麦粥 + 蛋白粉 + 蓝莓 + 杏仁', cal: 420 },
{ meal: '加餐', icon: '🍌', food: '香蕉花生酱三明治(小)', cal: 280 },
{ meal: '午餐', icon: '🥩', food: '瘦牛肉150g + 意面 + 番茄酱 + 芝士', cal: 620 },
{ meal: '加餐', icon: '🥛', food: '牛奶 + 全麦饼干', cal: 220 },
{ meal: '晚餐', icon: '🍤', food: '虾仁200g + 糙米饭 + 蔬菜汤', cal: 500 }
],
[
{ meal: '早餐', icon: '🍳', food: '煎蛋3个 + 全麦面包 + 牛奶 + 坚果', cal: 480 },
{ meal: '加餐', icon: '🥤', food: '蛋白奶昔(蛋白粉+牛奶+香蕉)', cal: 300 },
{ meal: '午餐', icon: '🍗', food: '鸡腿肉(去皮)200g + 藜麦 + 牛油果沙拉', cal: 580 },
{ meal: '加餐', icon: '🧀', food: '低脂芝士 + 苹果', cal: 200 },
{ meal: '晚餐', icon: '🍲', food: '豆腐 + 鸡肉丸 + 蔬菜煲 + 米饭', cal: 520 }
]
];

const WORKOUTS = [
[
{ name: '深蹲', icon: '🏋️', detail: '徒手深蹲，注意膝盖方向', sets: '3组×15次' },
{ name: '臀桥', icon: '🍑', detail: '收紧臀部，顶峰停顿2秒', sets: '3组×20次' },
{ name: '俯卧撑', icon: '💪', detail: '跪姿俯卧撑，降低难度', sets: '3组×8次' },
{ name: '平板支撑', icon: '🧘', detail: '收紧核心，身体成一线', sets: '3组×30秒' },
{ name: '弓步蹲', icon: '🦵', detail: '交替弓步，膝盖不触地', sets: '3组×12次/侧' }
],
[
{ name: '哑铃划船', icon: '🏋️', detail: '背部发力，肘部贴近身体', sets: '3组×12次' },
{ name: '哑铃推举', icon: '💪', detail: '站姿推举，核心收紧', sets: '3组×10次' },
{ name: '罗马尼亚硬拉', icon: '🦵', detail: '哑铃版，感受大腿后侧拉伸', sets: '3组×12次' },
{ name: '侧平举', icon: '🙆', detail: '轻重量，控制速度', sets: '3组×15次' },
{ name: '卷腹', icon: '🧘', detail: '下背贴地，只用腹肌发力', sets: '3组×20次' }
],
[
{ name: '有氧热身', icon: '🏃', detail: '快走或慢跑', sets: '10分钟' },
{ name: '台阶跳', icon: '🪜', detail: '找稳固台阶，交替踩踏', sets: '3组×20次' },
{ name: '改良俯卧撑', icon: '💪', detail: '上斜俯卧撑(手扶桌椅)', sets: '3组×10次' },
{ name: '深蹲跳', icon: '🦵', detail: '轻跳即可，注重落地缓冲', sets: '3组×10次' },
{ name: '拉伸放松', icon: '🧘', detail: '全身拉伸', sets: '5分钟' }
]
];

let curMealIdx = 0;
let curWorkoutIdx = 0;

function initFitness() {
document.getElementById('changeMealBtn').addEventListener('click', () => {
curMealIdx = (curMealIdx + 1) % MEAL_PLANS.length;
renderMeal();
toast('已切换食谱');
});
document.getElementById('completeWorkoutBtn').addEventListener('click', () => {
const log = Store.get('fitnessLog', {});
log[getToday()] = true;
Store.set('fitnessLog', log);
toast('🎉 完成今日运动！坚持就是胜利');
updateDashboard();
});
}

function loadFitness() {
// 每天轮换运动计划
const dayOfWeek = new Date().getDay();
curWorkoutIdx = dayOfWeek % WORKOUTS.length;
renderMeal();
renderWorkout();
}

function renderMeal() {
const plan = MEAL_PLANS[curMealIdx];
const total = plan.reduce((s, m) => s + m.cal, 0);
document.getElementById('mealPlan').innerHTML = plan.map(m => `
<div class="meal-card">
<div class="meal-icon">${m.icon}</div>
<div class="meal-info">
<div class="meal-name">${m.meal}</div>
<div class="meal-detail">${m.food}</div>
<div class="meal-cal">🔥 ${m.cal} 大卡</div>
</div>
</div>
`).join('') + `<div class="meal-calories-total">今日总热量：${total} 大卡 | 目标 2000 大卡</div>`;
}

function renderWorkout() {
const plan = WORKOUTS[curWorkoutIdx];
const today = new Date();
const week = ['日','一','二','三','四','五','六'];
const titles = ['腿部+核心','上肢+背','全身燃脂'];
document.getElementById('workoutPlan').innerHTML =
`<div style="font-size:13px;color:var(--text-light);margin-bottom:8px">周${week[today.getDay()]} · ${titles[curWorkoutIdx]}</div>` +
plan.map(w => `
<div class="workout-card">
<div class="workout-icon">${w.icon}</div>
<div class="workout-info">
<div class="workout-name">${w.name}</div>
<div class="workout-detail">${w.detail}</div>
</div>
<div class="workout-sets">${w.sets}</div>
</div>
`).join('');
}

// ===== 阅读模块 =====
const BOOKS = [
{ title: '认知觉醒', author: '周岭', cat: 'growth', catName: '个人成长', icon: '🧠', free: false, reason: '剖析大脑规律，解决拖延焦虑，高效行动' },
{ title: '被讨厌的勇气', author: '岸见一郎', cat: 'growth', catName: '个人成长', icon: '🌟', free: false, reason: '阿德勒心理学，学会课题分离，不再内耗' },
{ title: '非暴力沟通', author: '马歇尔·卢森堡', cat: 'growth', catName: '个人成长', icon: '💬', free: false, reason: '用不伤人的方式表达需求，改善人际关系' },
{ title: '高效能人士的七个习惯', author: '史蒂芬·柯维', cat: 'growth', catName: '个人成长', icon: '📋', free: false, reason: '经典自我管理框架，要事第一' },
{ title: '向前一步', author: '谢丽尔·桑德伯格', cat: 'growth', catName: '个人成长', icon: '🚀', free: false, reason: '鼓励女性在职场勇敢争取机会' },
{ title: '纳瓦尔宝典', author: '埃里克·乔根森', cat: 'growth', catName: '个人成长', icon: '💎', free: false, reason: '财富是创造价值的回报，找到热爱' },
{ title: '一网打尽', author: '布拉德·斯通', cat: 'business', catName: '商业', icon: '📦', free: false, reason: '深入理解亚马逊商业逻辑与客户至上文化' },
{ title: '三双鞋', author: '谢家华', cat: 'business', catName: '商业', icon: '👟', free: false, reason: 'Zappos CEO谈极致客户服务，品牌出海必读' },
{ title: '亚马逊跨境电商运营', author: '网经社', cat: 'business', catName: '商业', icon: '🛒', free: false, reason: '选品、站内推广、广告投放核心技术' },
{ title: '小狗钱钱', author: '博多·舍费尔', cat: 'business', catName: '商业', icon: '🐕', free: false, reason: '理财入门故事书，建立基本财商' },
{ title: 'The Wizard of Oz', author: 'L. Frank Baum', cat: 'english', catName: '英语学习', icon: '🌈', free: true, reason: '词汇简单、情节有趣，英语阅读入门', gutenberg: 'https://www.gutenberg.org/files/55/55-h/55-h.htm' },
{ title: 'Pride and Prejudice', author: 'Jane Austen', cat: 'english', catName: '英语学习', icon: '💕', free: true, reason: '经典女性文学，语言优美，日常词汇丰富', gutenberg: 'https://www.gutenberg.org/files/1342/1342-h/1342-h.htm' },
{ title: 'The Call of the Wild', author: 'Jack London', cat: 'english', catName: '英语学习', icon: '🐺', free: true, reason: '篇幅适中、节奏紧凑，适合过渡', gutenberg: 'https://www.gutenberg.org/files/215/215-h/215-h.htm' },
{ title: 'Animal Farm', author: 'George Orwell', cat: 'english', catName: '英语学习', icon: '🐷', free: true, reason: '篇幅短、句式清晰，寓言故事', gutenberg: 'https://www.gutenberg.org/cache/epub/20028/pg20028-images.html' },
{ title: '红楼梦', author: '曹雪芹', cat: 'literature', catName: '文学', icon: '🏮', free: true, reason: '中国文学巅峰，理解人情世故' },
{ title: '浮生六记', author: '沈复', cat: 'literature', catName: '文学', icon: '🍵', free: true, reason: '清代文人真实生活记录，文字质朴动人' },
{ title: '呐喊', author: '鲁迅', cat: 'literature', catName: '文学', icon: '📖', free: true, reason: '现代文学开山之作，短篇集易读', content: 'kudian' },
{ title: '孙子兵法', author: '孙武', cat: 'literature', catName: '文学', icon: '⚔️', free: true, reason: '商业战略与竞争思维经典', content: 'sunzi' }
];

// 公版书内容（内置）
const BOOK_CONTENTS = {
sunzi: `<h2>孙子兵法</h2><h3>始计篇</h3><p>孙子曰：兵者，国之大事，死生之地，存亡之道，不可不察也。</p><p>故经之以五事，校之以计，而索其情：一曰道，二曰天，三曰地，四曰将，五曰法。</p><p>道者，令民与上同意也，故可以与之死，可以与之生，而不畏危。天者，阴阳、寒暑、时制也。地者，远近、险易、广狭、死生也。将者，智、信、仁、勇、严也。法者，曲制、官道、主用也。</p><p>凡此五者，将莫不闻，知之者胜，不知者不胜。故校之以计，而索其情，曰：主孰有道？将孰有能？天地孰得？法令孰行？兵众孰强？士卒孰练？赏罚孰明？吾以此知胜负矣。</p><h3>作战篇</h3><p>孙子曰：凡用兵之法，驰车千驷，革车千乘，带甲十万，千里馈粮，则内外之费，宾客之用，胶漆之材，车甲之奉，日费千金，然后十万之师举矣。</p><p>其用战也贵胜，久则钝兵挫锐，攻城则力屈，久暴师则国用不足。</p><p>故兵闻拙速，未睹巧之久也。夫兵久而国利者，未之有也。</p><h3>谋攻篇</h3><p>孙子曰：夫用兵之法，全国为上，破国次之；全军为上，破军次之；全旅为上，破旅次之；全卒为上，破卒次之；全伍为上，破伍次之。</p><p>是故百战百胜，非善之善者也；不战而屈人之兵，善之善者也。</p><p>故上兵伐谋，其次伐交，其次伐兵，其下攻城。攻城之法，为不得已。</p><p>故曰：知彼知己，百战不殆；不知彼而知己，一胜一负；不知彼，不知己，每战必殆。</p>`,
kudian: `<h2>呐喊 · 自序</h2><p>我在年青时候也曾经做过许多梦，后来大半忘却了，但自己也并不以为可惜。所谓回忆者，虽说可以使人欢欣，有时也不免使人寂寞，而精神的丝缕还牵着已逝的寂寞的时光，又有什么意味呢，而我偏苦于不能全忘却，这不能全忘的一部分，到现在便成了《呐喊》的来由。</p><p>假如一间铁屋子，是绝无窗户而万难破毁的，里面有许多熟睡的人们，不久都要闷死了，然而是从昏睡入死灭，并不感到就死的悲哀。现在你大嚷起来，惊起了较为清醒的几个人，使这不幸的少数者来受无可挽救的临终的苦楚，你倒以为对得起他们么？</p><p>然而几个人既然起来，你不能说决没有毁坏这铁屋的希望。</p>`
};

let curBookFilter = 'all';

function initReading() {
document.querySelectorAll('#readingView .filter-btn').forEach(btn => {
btn.addEventListener('click', () => {
document.querySelectorAll('#readingView .filter-btn').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
curBookFilter = btn.dataset.cat;
renderBooks();
});
});
}

function renderBooks() {
const filtered = curBookFilter === 'all' ? BOOKS : BOOKS.filter(b => b.cat === curBookFilter);
document.getElementById('bookList').innerHTML = filtered.map((b, i) => `
<div class="book-card" data-idx="${BOOKS.indexOf(b)}">
<div class="book-cover">${b.icon}</div>
<div class="book-info">
<div class="book-title">${b.title}</div>
<div class="book-author">${b.author}</div>
<span class="book-cat">${b.catName}</span>
${b.free ? '<span class="book-free">免费读</span>' : ''}
</div>
</div>
`).join('');

document.querySelectorAll('.book-card').forEach(card => {
card.addEventListener('click', () => {
const idx = parseInt(card.dataset.idx);
openBook(BOOKS[idx]);
});
});
}

function openBook(book) {
document.getElementById('readerTitle').textContent = book.title;
const content = document.getElementById('readerContent');

if (book.content && BOOK_CONTENTS[book.content]) {
content.innerHTML = BOOK_CONTENTS[book.content];
navigate('reader');
} else if (book.gutenberg) {
content.innerHTML = `<p>这是一本英文公版书，可以在线免费阅读完整原文。</p>
<p style="text-indent:0"><strong>推荐理由：</strong>${book.reason}</p>
<p>点击下方按钮在浏览器中打开阅读（Project Gutenberg 提供）：</p>
<div style="text-indent:0;text-align:center;margin-top:20px">
<a href="${book.gutenberg}" target="_blank" style="display:inline-block;background:var(--primary);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">📖 在线阅读</a>
</div>
<div style="text-indent:0;margin-top:20px">
<strong>阅读建议：</strong><br>
1. 先通读一遍，不查词典，理解大意<br>
2. 第二遍逐句精读，记录生词<br>
3. 把生词加入英语模块的单词本<br>
4. 每天读10-15页，贵在坚持
</div>`;
navigate('reader');
} else if (book.free) {
content.innerHTML = `<p>这是一本公版书，可以免费阅读。</p>
<p style="text-indent:0"><strong>推荐理由：</strong>${book.reason}</p>
<div style="text-indent:0;text-align:center;margin-top:20px">
<a href="https://www.gutenberg.org/browse/languages/zh" target="_blank" style="display:inline-block;background:var(--primary);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">📖 查找原文</a>
</div>`;
navigate('reader');
} else {
content.innerHTML = `<p>${book.reason}</p>
<p style="text-indent:0;margin-top:16px"><strong>作者：</strong>${book.author}</p>
<p style="text-indent:0"><strong>分类：</strong>${book.catName}</p>
<div style="text-indent:0;text-align:center;margin-top:20px">
<a href="https://www.google.com/search?q=${encodeURIComponent(book.title + ' ' + book.author + ' 电子书')}" target="_blank" style="display:inline-block;background:var(--primary);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">🔍 搜索获取</a>
</div>`;
navigate('reader');
}
}

// ===== 事件绑定 =====
function bindEvents() {
// 所有 data-nav 元素
document.querySelectorAll('[data-nav]').forEach(el => {
el.addEventListener('click', () => navigate(el.dataset.nav));
});

// 快捷操作
document.querySelectorAll('[data-action]').forEach(el => {
el.addEventListener('click', () => {
if (el.dataset.action === 'voiceTodo') {
navigate('todo');
setTimeout(startVoiceInput, 300);
}
});
});

// 底部导航
document.querySelectorAll('.nav-btn').forEach(btn => {
btn.addEventListener('click', () => navigate(btn.dataset.nav));
});
}

// ===== PWA 注册 =====
function registerSW() {
if ('serviceWorker' in navigator) {
navigator.serviceWorker.register('sw.js').catch(() => {});
}
}

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', () => {
initDashboard();
initAccounting();
initEcommerce();
initTodo();
initEnglish();
initFitness();
initReading();
initSpeechRecognition();
bindEvents();
registerSW();

// 更新仪表盘数据
const today = getToday();
const fitnessLog = Store.get('fitnessLog', {});

toast('欢迎回来，Selena ✨');
});

// ===== 天气简单显示 =====
function loadWeather() {
// 顶部已固定显示天气图标，无需外部 API
}
loadWeather();
