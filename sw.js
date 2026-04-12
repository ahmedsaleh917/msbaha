const CACHE_NAME = 'safaa-soul-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html', // تأكد أن اسم ملفك الأساسي هو index.html
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&family=Amiri:wght@400;700&display=swap'
];

// تثبيت الـ Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// تفعيل وتحديث الـ Cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// استراتيجية الاستجابة: التحقق من الشبكة أولاً ثم الذاكرة التخزينية
self.addEventListener('fetch', (event) => {
  // لا نقوم بتخزين طلبات الـ API (الطقس والمواقيت) لأنها متغيرة لحظياً
  if (event.request.url.includes('api.openweathermap.org') || event.request.url.includes('api.aladhan.com')) {
    return; 
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
