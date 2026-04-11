/**
 * 🕋 Service Worker لتطبيق "مسبحة صفاء الروح"
 * استراتيجية: Cache-First للأصول، Network-First للبيانات
 */

const CACHE_NAME = 'sabri-tasbeeh-v2.0';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://i.postimg.cc/zGSvxgCn/1775323811617.png'
];

// 📦 التثبيت: تخزين الأصول الأساسية
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ فتح الكاش:', CACHE_NAME);
                return cache.addAll(STATIC_ASSETS.filter(url => !url.includes('font-awesome')));
            })
            .then(() => self.skipWaiting())
            .catch((err) => console.log('❌ فشل التخزين:', err))
    );
});

// 🔄 التنشيط: حذف الكاش القديم
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('🗑️ حذف الكاش القديم:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// 🌐 اعتراض الطلبات
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // تجاهل غير GET
    if (request.method !== 'GET') return;
    const url = new URL(request.url);

    // Cache-First للخطوط والصور وCSS
    if (url.href.includes('fonts.googleapis') || 
        url.href.includes('font-awesome') ||
        url.href.includes('postimg') ||
        url.pathname.endsWith('.css') || 
        url.pathname.endsWith('.png') || 
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.svg')) {
        
        event.respondWith(
            caches.match(request)
                .then((cached) => {
                    if (cached) return cached;
                    return fetch(request)
                        .then((response) => {
                            if (response.ok) {
                                const clone = response.clone();
                                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                            }
                            return response;
                        });
                })
        );
        return;
    }

    // Network-First للصفحة الرئيسية مع fallback للكاش
    if (request.destination === 'document' || url.pathname === '/' || url.pathname.endsWith('index.html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    // الاستراتيجية الافتراضية
    event.respondWith(
        caches.match(request)
            .then((cached) => cached || fetch(request).catch(() => {
                if (request.destination === 'document') {                    return caches.match('/index.html');
                }
            }))
    );
});

// 📡 التعامل مع رسائل من الصفحة
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data?.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
        event.waitUntil(
            caches.open(CACHE_NAME).then(cache => cache.addAll(event.data.urls))
        );
    }
});

console.log('🕋 Service Worker لـ "مسبحة صفاء الروح" جاهز');
