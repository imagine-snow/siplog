// Cache only the app shell and same-origin static assets. Records live in IndexedDB.
const CACHE='jiuji-shell-v7';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/offline.html','/icon-192.png','/icon-512.png','/manifest.webmanifest','/manifest.webmanifest?v=7','/manifest.en.webmanifest?v=7','/brand/mark.svg','/brand/app-icon.svg','/brand/icon-192.png','/brand/icon-512.png','/brand/maskable-512.png','/brand/apple-touch-icon.png','/data/drinks.json?v=4'])));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('jiuji-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]));});
async function cacheShell(cache,response){if(response.ok&&response.headers.get('content-type')?.includes('text/html')){const html=await response.clone().text();if(html.includes('data-jiuji-app'))await cache.put('/',response.clone());}}
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'&&url.pathname==='/'){
  event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(event.request);await cacheShell(cache,response);return response;}catch{return (await cache.match('/'))||(await cache.match('/offline.html'));}})());return;
 }
 if((/\.(?:js|css|woff2?|png|svg)$/.test(url.pathname)||url.pathname==='/data/drinks.json')&&!url.pathname.includes('__'))event.respondWith((async()=>{const cache=await caches.open(CACHE);const existing=await cache.match(event.request);if(existing)return existing;const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;})());
});
self.addEventListener('message',event=>{
 if(event.data?.type!=='WARM_SHELL')return;
 event.waitUntil((async()=>{const cache=await caches.open(CACHE);const response=await fetch('/');await cacheShell(cache,response);for(const path of event.data.assets??[]){const url=new URL(path,self.location.origin);if(url.origin===self.location.origin&&/\.(?:js|css)$/.test(url.pathname)){try{await cache.add(url.href);}catch{}}}})());
});
