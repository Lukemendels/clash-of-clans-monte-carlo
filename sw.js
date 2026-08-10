const CACHE="basecracker-v0.1.0";
const ASSETS=[
  "./","./index.html","./styles.css","./manifest.webmanifest","./icon.svg",
  "./src/app.js","./src/model.js","./src/sim.js","./src/optimizer.js","./src/worker.js","./src/dossier.js","./src/gemini.js","./src/projection.js"
];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res;})).catch(()=>caches.match("./index.html")));
});
