// Selena 工作台 Service Worker
const CACHE_NAME = 'selena-dashboard-v2';
const ASSETS = [
'./',
'./index.html',
'./style.css',
'./app.js',
'./manifest.json'
];

// 安装 - 预缓存核心资源
self.addEventListener('install', e => {
e.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
);
self.skipWaiting(); // 立即激活新版本
});

// 激活 - 清理所有旧缓存
self.addEventListener('activate', e => {
e.waitUntil(
caches.keys().then(keys => Promise.all(
keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
))
);
self.clients.claim(); // 立即接管页面
});

// 拦截请求 - network-first 策略(优先联网拿最新,失败才用缓存)
self.addEventListener('fetch', e => {
if (e.request.method !== 'GET') return;

e.respondWith(
fetch(e.request).then(response => {
// 联网成功,缓存一份再返回
if (response && response.status === 200 && e.request.url.startsWith(self.location.origin)) {
const clone = response.clone();
caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
}
return response;
}).catch(() => {
// 联网失败,用缓存(离线可用)
return caches.match(e.request);
})
);
});
