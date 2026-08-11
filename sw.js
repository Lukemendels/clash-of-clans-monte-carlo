const CACHE="clash-upgrade-planner-v0.1-phase2";
const ASSETS=[
  "./","./index.html","./planner.css","./manifest.webmanifest","./icon.svg",
  "./src/planner-app.js","./src/planner-store.js",
  "./src/import/village-data-ids.js","./src/import/village-export.js",
  "./src/progression/core-th1-th9.js","./src/progression/heroes-th9.js","./src/progression/research-th9.js","./src/progression/target-th9.js",
  "./src/strategy/luke-th9-rush.js"
];

self.addEventListener("install",event=>event.waitUntil(
  caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
));

self.addEventListener("activate",event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  event.respondWith(
    fetch(event.request,{cache:"no-store"})
      .then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return res;})
      .catch(async()=>{
        const cached=await caches.match(event.request);
        if(cached)return cached;
        if(event.request.mode==="navigate")return caches.match("./index.html");
        throw new Error("Offline and no cached response available.");
      })
  );
});
