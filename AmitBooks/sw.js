// ══════════════════════════════════════════════
// AmitBooks Service Worker — Offline VIEWING parity, not offline writing.
// Two strategies:
//  1. App shell (this HTML/CSS/JS file, the manifest, the icon) —
//     NETWORK-FIRST, falling back to cache only when actually offline.
//     Changed 2026-08-01 from an earlier cache-first version that caused
//     a real bug: a normal reload (F5) could keep serving a stale cached
//     copy of AmitBooks.html for many versions after a new one was
//     pushed, while only a hard refresh (Ctrl+Shift+R) bypassed it — Ryan
//     hit this directly (page flip-flopping between v1.71 and v1.84).
//     Network-first means the live version always wins whenever there's
//     a connection; the cache is purely the offline fallback now, never
//     the default.
//  2. Supabase REST GET requests (reading books, accounts, bills, etc.) —
//     network-first, falling back to the last successful cached response
//     when offline, so whatever was last synced stays visible after a
//     reload with no internet. Writes (POST/PATCH/DELETE) are always sent
//     straight to the network and simply fail offline, on purpose — a
//     silently-queued write that syncs later risks a stale/conflicting
//     entry nobody reviewed. That's real offline WRITE support, and it
//     needs its own design pass before it's safe to build, not a shortcut
//     bolted on here.
// ══════════════════════════════════════════════
const AB_CACHE='amitbooks-shell-v2';
const AB_APP_SHELL=['./AmitBooks.html','./manifest.json'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(AB_CACHE).then(c=>c.addAll(AB_APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==AB_CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return; // writes always go straight to the network, never intercepted

  const url=new URL(req.url);
  const isSupabaseRead=url.hostname.endsWith('.supabase.co')&&url.pathname.startsWith('/rest/v1/');

  if(isSupabaseRead){
    // Network-first: always try live data first, fall back to the last
    // cached copy of THIS exact request only when the network fails.
    e.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(AB_CACHE).then(c=>c.put(req,copy));
        return res;
      }).catch(()=>caches.match(req))
    );
    return;
  }

  if(url.origin===self.location.origin){
    // App shell: network-first. Always try to get the live, current file;
    // only fall back to whatever's cached if the network request itself
    // fails (i.e. genuinely offline). This is what makes a normal reload
    // always show the version that's actually been pushed.
    e.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(AB_CACHE).then(c=>c.put(req,copy));
        return res;
      }).catch(()=>caches.match(req))
    );
  }
});
