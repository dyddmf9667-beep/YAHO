// 野虎 FC — Service Worker
// 오프라인 캐싱 지원

const CACHE_NAME = 'yahofc-v1';
const CACHED_FILES = [
  './index.html',
  './manifest.json'
];

// 설치: 핵심 파일 캐싱
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHED_FILES);
    })
  );
  self.skipWaiting();
});

// 활성화: 구버전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 요청 처리: 캐시 우선, 실패 시 네트워크
self.addEventListener('fetch', event => {
  // localStorage 앱이므로 HTML/JS만 캐싱, 나머지는 네트워크 우선
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // 유효한 응답만 캐싱
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      }).catch(() => {
        // 네트워크 없을 때 캐시에서 index.html 반환
        return caches.match('./index.html');
      });
    })
  );
});
