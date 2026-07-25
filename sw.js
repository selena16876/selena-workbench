// Selena 工作台 Service Worker
const CACHE_NAME = 'selena-dashboard-v1';
const ASSETS = [
'./',
'./index.html',
'./style.css',
'./app.js',
'./manifest.json'
];

// 安装 - 缓存核心资源
self.addEventListener('install', e => {
e.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
);
self.skipWaiting();
});

// 激活 - 清理旧缓存
self.addEventListener('activate', e => {
e.waitUntil(
caches.keys().then(keys => Promise.all(
keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
))
);
self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', e => {
// 只缓存同源GET请求
if (e.request.method !== 'GET') return;

e.respondWith(
caches.match(e.request).then(cached => {
// 有缓存就用缓存，同时后台更新
const fetchPromise = fetch(e.request).then(response => {
if (response && response.status === 200 && e.request.url.startsWith(self.location.origin)) {
const clone = response.clone();
caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
}
return response;
}).catch(() => cached);
return cached || fetchPromise;
})
);
});
