// ══════════════════════════════════════════════
// Amit Mobile Service Worker — added 2026-09-08, the real difference found
// between this app (kept losing sign-in on force-quit) and AmitScan (never
// does). AmitScan registers a service worker; this app never had one. A
// registered service worker is part of what tells iOS an installed
// home-screen app is a genuine standalone PWA rather than a bare bookmark
// — copied directly from AmitScan's proven pattern (network-first, since
// AmitBooks' own earlier cache-first version caused real staleness bugs).
// ══════════════════════════════════════════════
const AM_CACHE='amitmobile-shell-v1';
const AM_APP_SHELL=['./AmitMobile.html','./manifest.json'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(AM_CACHE).then(c=>c.addAll(AM_APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==AM_CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  e.respondWith(
    fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(AM_CACHE).then(c=>c.put(req,copy));
      return res;
    }).catch(()=>caches.match(req))
  );
});
