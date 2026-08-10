const CACHE="basecracker-v0.2.0-th7";
const ASSETS=[
  "./","./index.html","./styles.css","./builder.css","./manifest.webmanifest","./icon.svg",
  "./src/app.js","./src/model.js","./src/legality.js","./src/rulesets/th7.js",
  "./src/sim.js","./src/optimizer.js","./src/worker.js","./src/dossier.js","./src/gemini.js","./src/projection.js"
];

self.addEventListener("install",event=>event.waitUntil(
  caches.open(CACHE)
    .then(c=>c.addAll(ASSETS))
    .then(()=>self.skipWaiting())
));

self.addEventListener("activate",event=>event.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  event.respondWith(
    fetch(event.request,{cache:"no-store"})
      .then(res=>{
        if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}
        return res;
      })
      .catch(async()=>{
        const cached=await caches.match(event.request);
        if(cached) return cached;
        if(event.request.mode==="navigate") return caches.match("./index.html");
        throw new Error("Offline and no cached response available.");
      })
  );
});
