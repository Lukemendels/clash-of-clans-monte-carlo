import { newBase, addStructure, removeAt, sanitizeBase, makeDemoBase, STRUCTURE_CATALOG, GRID_SIZE } from "./model.js";
import { STRATEGIES, attackGeometry } from "./sim.js";
import { buildDossier, buildReviewPrompt } from "./dossier.js";
import { extractBaseWithGemini, reviewDossierWithGemini } from "./gemini.js";
import { projectionFromCanvas, tileToScreen, screenToTile } from "./projection.js";

const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];

let base = loadJson("cocmc-base", newBase());
let crackResult = loadJson("cocmc-crack", null);
let screenshotImage = null;
let screenshotDataUrl = null;
let selectedType = "town_hall";
let mode = "place";
let extractionStatus = "manual-or-unverified";
let calibration = loadJson("cocmc-calibration", { centerX:0.5, topY:0.17, gridWidth:0.78, gridHeight:0.62 });
let currentTab = "capture";
let worker = null;

boot();

function boot() {
  populatePalettes();
  bindTabs();
  bindControls();
  syncForm();
  resizeCanvas();
  renderAll();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
  window.addEventListener("resize", debounce(()=>{resizeCanvas();drawCanvas();},120));
}

function bindTabs(){
  $$(".tab").forEach(btn=>btn.addEventListener("click",()=>{
    currentTab=btn.dataset.tab;
    $$(".tab").forEach(x=>x.classList.toggle("active",x===btn));
    $$(".panel").forEach(x=>x.classList.toggle("active",x.id===`panel-${currentTab}`));
    if(currentTab==="capture") requestAnimationFrame(()=>{resizeCanvas();drawCanvas();});
    if(currentTab==="dossier") renderDossier();
  }));
}

function populatePalettes(){
  const palette=$("#palette");
  for(const [type,spec] of Object.entries(STRUCTURE_CATALOG)){
    const b=document.createElement("button"); b.className="palette-item"; b.dataset.type=type;
    b.innerHTML=`<span class="glyph">${esc(spec.glyph||"□")}</span><span>${esc(spec.label)}</span>`;
    b.onclick=()=>{selectedType=type;mode="place";updatePalette();};
    palette.appendChild(b);
  }
  const strategy=$("#strategy");
  strategy.innerHTML=`<option value="">Auto — compare strategies</option>`+Object.entries(STRATEGIES).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join("");
  updatePalette();
}

function bindControls(){
  $("#screenshot").addEventListener("change",onScreenshot);
  $("#canvas").addEventListener("pointerdown",onCanvasPointer);
  $("#erase").onclick=()=>{mode="erase";updatePalette();};
  $("#clear-base").onclick=()=>{ if(confirm("Clear reconstructed base state?")){ base=newBase();persist();renderAll(); } };
  $("#demo-base").onclick=()=>{base=makeDemoBase();extractionStatus="demo";persist();renderAll();};
  $("#export-base").onclick=()=>downloadJson("base-model.json",base);
  $("#import-base").addEventListener("change",importBase);
  $("#save-meta").onclick=()=>{ updateMeta(); persist(); renderAll(); toast("Base metadata saved."); };
  $("#run-crack").onclick=runCrack;
  $("#copy-dossier").onclick=()=>copyText(JSON.stringify(makeDossier(),null,2),"Dossier copied.");
  $("#copy-review-prompt").onclick=()=>copyText(buildReviewPrompt(makeDossier()),"LLM review prompt copied.");
  $("#download-dossier").onclick=()=>downloadJson("attack-dossier.json",makeDossier());
  $("#gemini-extract").onclick=geminiExtract;
  $("#gemini-review").onclick=geminiReview;
  $("#apply-review").onclick=applyReviewPatch;
  $("#api-key").value=sessionStorage.getItem("cocmc-gemini-key")||"";
  $("#api-key").addEventListener("input",e=>sessionStorage.setItem("cocmc-gemini-key",e.target.value));
  $("#model").value=localStorage.getItem("cocmc-model")||"gemini-3.6-flash";
  $("#model").addEventListener("change",e=>localStorage.setItem("cocmc-model",e.target.value));
  $("#thinking").value=localStorage.getItem("cocmc-thinking")||"high";
  $("#thinking").addEventListener("change",e=>localStorage.setItem("cocmc-thinking",e.target.value));
  ["centerX","topY","gridWidth","gridHeight"].forEach(k=>{
    const el=$(`#cal-${k}`); el.value=calibration[k];
    el.addEventListener("input",()=>{calibration[k]=Number(el.value); localStorage.setItem("cocmc-calibration",JSON.stringify(calibration)); drawCanvas();});
  });
  ["hiddenTeslaCount","trapDensity","ccThreat","pathingNoise"].forEach(k=>{
    $(`#u-${k}`).addEventListener("input",()=>{base.uncertainty[k]=Number($(`#u-${k}`).value);persist();renderUncertaintyLabels();});
  });
}

function onScreenshot(event){
  const file=event.target.files?.[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    screenshotDataUrl=reader.result;
    screenshotImage=new Image();
    screenshotImage.onload=()=>{resizeCanvas();drawCanvas(); toast("Screenshot loaded. Align the grid, then place/correct structures or run Gemini extraction.");};
    screenshotImage.src=screenshotDataUrl;
  };
  reader.readAsDataURL(file);
}

function resizeCanvas(){
  const canvas=$("#canvas"); const rect=canvas.getBoundingClientRect(); if(rect.width<10)return;
  const dpr=Math.min(devicePixelRatio||1,2); const h=Math.max(420,Math.min(720,rect.width*0.78));
  canvas.width=Math.round(rect.width*dpr); canvas.height=Math.round(h*dpr); canvas.style.height=`${h}px`;
}

function onCanvasPointer(event){
  const canvas=$("#canvas"); const rect=canvas.getBoundingClientRect();
  const sx=(event.clientX-rect.left)*(canvas.width/rect.width); const sy=(event.clientY-rect.top)*(canvas.height/rect.height);
  const p=projectionFromCanvas(canvas,calibration); const t=screenToTile(sx,sy,p);
  if(t.x<0||t.y<0||t.x>=GRID_SIZE||t.y>=GRID_SIZE)return;
  if(mode==="erase") base=removeAt(base,t.x,t.y);
  else base=addStructure(base,selectedType,Math.floor(t.x),Math.floor(t.y));
  extractionStatus="human-edited"; persist(); renderAll();
}

function drawCanvas(){
  const canvas=$("#canvas"); if(!canvas.width)return; const ctx=canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#091018"; ctx.fillRect(0,0,canvas.width,canvas.height);
  if(screenshotImage){
    const scale=Math.min(canvas.width/screenshotImage.width,canvas.height/screenshotImage.height);
    const w=screenshotImage.width*scale,h=screenshotImage.height*scale;
    ctx.globalAlpha=.78; ctx.drawImage(screenshotImage,(canvas.width-w)/2,(canvas.height-h)/2,w,h); ctx.globalAlpha=1;
  } else {
    ctx.fillStyle="#11202d"; ctx.fillRect(canvas.width*.12,canvas.height*.08,canvas.width*.76,canvas.height*.84);
    ctx.fillStyle="#9bb0c4"; ctx.font=`${Math.max(18,canvas.width/35)}px system-ui`; ctx.textAlign="center";
    ctx.fillText("Upload a base screenshot or load the demo base",canvas.width/2,canvas.height/2);
  }
  const p=projectionFromCanvas(canvas,calibration);
  ctx.lineWidth=Math.max(1,canvas.width/900); ctx.strokeStyle="rgba(160,210,255,.22)";
  for(let i=0;i<=GRID_SIZE;i++){
    const a=tileToScreen(i,0,p),b=tileToScreen(i,GRID_SIZE,p),c=tileToScreen(0,i,p),d=tileToScreen(GRID_SIZE,i,p);
    line(ctx,a,b); line(ctx,c,d);
  }
  for(const s of base.structures){
    const spec=STRUCTURE_CATALOG[s.type]||STRUCTURE_CATALOG.generic;
    const c=tileToScreen(s.x+s.size/2,s.y+s.size/2,p);
    const rx=Math.max(4,p.tileW*s.size*.42), ry=Math.max(3,p.tileH*s.size*.42);
    ctx.beginPath(); ctx.ellipse(c.x,c.y,rx,ry,0,0,Math.PI*2);
    ctx.fillStyle=spec.kind==="defense"?"rgba(255,118,93,.72)":s.type==="town_hall"?"rgba(255,213,94,.82)":s.type==="wall"?"rgba(195,205,216,.7)":"rgba(78,205,196,.58)";
    ctx.fill();
    if(s.type!=="wall"){
      ctx.fillStyle="#061019"; ctx.font=`bold ${Math.max(8,p.tileH*1.2)}px system-ui`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(spec.glyph,c.x,c.y);
    }
  }
  if(crackResult?.results?.[0]) drawAttack(ctx,p,crackResult.results[0].plan);
}

function drawAttack(ctx,p,plan){
  const g=attackGeometry(plan); const a=tileToScreen(g.entry.x,g.entry.y,p),b=tileToScreen(g.target.x,g.target.y,p);
  ctx.save();ctx.strokeStyle="rgba(116,255,167,.95)";ctx.lineWidth=Math.max(3,p.tileH*.35);ctx.setLineDash([12,8]);line(ctx,a,b);ctx.restore();
}

function renderAll(){
  drawCanvas(); renderBaseTable(); renderStats(); renderUncertaintyLabels(); renderCrack(); renderDossier(); syncForm();
}

function renderBaseTable(){
  const rows=base.structures.filter(s=>s.type!=="wall").sort((a,b)=>a.type.localeCompare(b.type));
  $("#structure-list").innerHTML=rows.length?rows.map(s=>`<tr><td>${esc(STRUCTURE_CATALOG[s.type]?.label||s.type)}</td><td>${s.x}, ${s.y}</td><td>${s.size}</td><td>${Math.round((s.confidence??1)*100)}%</td><td><button class="tiny" data-delete="${s.id}">×</button></td></tr>`).join(""):`<tr><td colspan="5" class="muted">No structures reconstructed yet.</td></tr>`;
  $$("[data-delete]").forEach(b=>b.onclick=()=>{base.structures=base.structures.filter(s=>s.id!==b.dataset.delete);persist();renderAll();});
}

function renderStats(){
  const defenses=base.structures.filter(s=>STRUCTURE_CATALOG[s.type]?.kind==="defense").length;
  const walls=base.structures.filter(s=>s.type==="wall").length;
  $("#base-stats").innerHTML=`<strong>${base.structures.length}</strong> objects · <strong>${defenses}</strong> defenses · <strong>${walls}</strong> walls`;
}
function renderUncertaintyLabels(){
  for(const k of ["hiddenTeslaCount","trapDensity","ccThreat","pathingNoise"]){ const el=$(`#u-${k}`); if(el)el.value=base.uncertainty[k]; const out=$(`#v-${k}`); if(out)out.textContent=Number(base.uncertainty[k]).toFixed(k==="hiddenTeslaCount"?0:2); }
}
function renderCrack(){
  const box=$("#crack-results");
  if(!crackResult?.results?.length){ box.innerHTML=`<div class="empty">Run the search to rank robust attack policies.</div>`; return; }
  box.innerHTML=crackResult.results.map(r=>`<article class="result-card ${r.rank===1?"best":""}"><div class="result-head"><span>#${r.rank} ${esc(STRATEGIES[r.plan.strategy]?.label||r.plan.strategy)}</span><strong>${pct(r.summary.threeStarRate)} proxy 3★</strong></div><div class="metrics"><span>${r.summary.meanDestruction}% mean</span><span>${r.summary.p10Destruction}% p10</span><span>${pct(r.summary.twoPlusRate)} 2★+</span><span>${Math.round(r.plan.angle)}° entry</span></div><details><summary>Tap sequence + parameters</summary><pre>${esc(JSON.stringify({plan:r.plan,tapSequence:r.tapSequence,failures:r.summary.failures},null,2))}</pre></details></article>`).join("");
}
function renderDossier(){
  const d=makeDossier(); $("#dossier-preview").textContent=JSON.stringify(d,null,2);
  $("#review-output").textContent=loadJson("cocmc-review",null)?JSON.stringify(loadJson("cocmc-review",null),null,2):"No model review yet.";
}
function syncForm(){
  $("#base-name").value=base.meta.name||""; $("#town-hall").value=base.meta.townHall||10; $("#base-notes").value=base.meta.notes||"";
}
function updateMeta(){ base.meta.name=$("#base-name").value.trim()||"Untitled base"; base.meta.townHall=Number($("#town-hall").value)||10; base.meta.notes=$("#base-notes").value.trim(); }

async function runCrack(){
  updateMeta(); persist();
  if(base.structures.length<5){toast("Add or extract more of the base before running the search.",true);return;}
  if(worker)worker.terminate(); worker=new Worker(new URL("./worker.js",import.meta.url),{type:"module"});
  const btn=$("#run-crack");btn.disabled=true;btn.textContent="Cracking…";$("#progress").textContent="Starting Monte Carlo search…";
  worker.onmessage=(e)=>{
    if(e.data.type==="progress"){
      const p=e.data.progress; $("#progress").textContent=`Generation ${p.generation}/${p.generations} · ${p.calls.toLocaleString()} simulated attacks · current best ${pct(p.best.summary.threeStarRate)} proxy 3★`;
    } else if(e.data.type==="result"){
      crackResult=e.data.result; localStorage.setItem("cocmc-crack",JSON.stringify(crackResult)); btn.disabled=false;btn.textContent="Run Monte Carlo crack";$("#progress").textContent=`Done · ${crackResult.searchCalls.toLocaleString()} search rollouts + ${crackResult.verificationCalls.toLocaleString()} verification rollouts.`;renderAll();worker.terminate();worker=null;
    } else { finishWorkerError(e.data.error); }
  };
  worker.onerror=e=>finishWorkerError(e.message);
  worker.postMessage({base,options:{budget:Number($("#budget").value)||1600,generations:Number($("#generations").value)||4,seed:Number($("#seed").value)||1337,strategy:$("#strategy").value||null}});
}
function finishWorkerError(msg){$("#run-crack").disabled=false;$("#run-crack").textContent="Run Monte Carlo crack";$("#progress").textContent=`Error: ${msg}`;if(worker)worker.terminate();worker=null;}

async function geminiExtract(){
  if(!screenshotImage){toast("Upload a screenshot first.",true);return;}
  const btn=$("#gemini-extract");btn.disabled=true;btn.textContent="Extracting…";
  try{
    const annotated=$("#canvas").toDataURL("image/jpeg",.9);
    const extracted=await extractBaseWithGemini({apiKey:$("#api-key").value.trim(),model:$("#model").value.trim()||"gemini-3.6-flash",thinkingLevel:$("#thinking").value,annotatedImageDataUrl:annotated,townHall:Number($("#town-hall").value)||10});
    extracted.uncertainty={...base.uncertainty}; base=extracted; extractionStatus="gemini-vision-unverified"; crackResult=null; persist(); renderAll(); toast("Gemini reconstruction loaded. Inspect and correct it before simulation.");
  }catch(err){toast(err.message||String(err),true);}finally{btn.disabled=false;btn.textContent="Extract base with Gemini";}
}

async function geminiReview(){
  if(!crackResult){toast("Run the Monte Carlo crack first.",true);return;}
  const btn=$("#gemini-review");btn.disabled=true;btn.textContent="Reviewing…";
  try{
    const review=await reviewDossierWithGemini({apiKey:$("#api-key").value.trim(),model:$("#model").value.trim()||"gemini-3.6-flash",thinkingLevel:$("#thinking").value,dossier:makeDossier()});
    localStorage.setItem("cocmc-review",JSON.stringify(review));renderDossier();toast("Gemini review complete. Patch remains proposal-only until you apply it.");
  }catch(err){toast(err.message||String(err),true);}finally{btn.disabled=false;btn.textContent="Review top attack with Gemini";}
}
function applyReviewPatch(){
  const review=loadJson("cocmc-review",null); if(!review?.patch||!crackResult?.results?.[0]){toast("No review patch to apply.",true);return;}
  const patch=Object.fromEntries(Object.entries(review.patch).filter(([,v])=>v!==null&&v!==undefined));
  crackResult.results[0].plan={...crackResult.results[0].plan,...patch};
  localStorage.setItem("cocmc-crack",JSON.stringify(crackResult));renderAll();toast("Patch applied to the displayed top plan. Re-run Monte Carlo to validate it.");
}
function makeDossier(){return buildDossier(base,crackResult,{extractionStatus});}

function importBase(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{base=sanitizeBase(JSON.parse(r.result));crackResult=null;extractionStatus="imported";persist();renderAll();toast("Base model imported.");}catch(err){toast("Invalid base JSON.",true);}};r.readAsText(f);}
function updatePalette(){ $$(".palette-item").forEach(x=>x.classList.toggle("selected",mode==="place"&&x.dataset.type===selectedType)); $("#erase").classList.toggle("selected",mode==="erase"); }
function persist(){localStorage.setItem("cocmc-base",JSON.stringify(base));if(crackResult)localStorage.setItem("cocmc-crack",JSON.stringify(crackResult));else localStorage.removeItem("cocmc-crack");}
function loadJson(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch{return fallback;}}
function line(ctx,a,b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function pct(v){return `${Math.round((v||0)*100)}%`;}
function esc(s){return String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function debounce(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};}
function downloadJson(name,obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
async function copyText(text,msg){try{await navigator.clipboard.writeText(text);toast(msg);}catch{toast("Clipboard unavailable; use the dossier preview.",true);}}
function toast(msg,error=false){const el=$("#toast");el.textContent=msg;el.classList.toggle("error",error);el.classList.add("show");setTimeout(()=>el.classList.remove("show"),4200);}
