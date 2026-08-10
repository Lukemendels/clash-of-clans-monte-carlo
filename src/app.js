import { newBase, addStructure, updateStructure, removeAt, sanitizeBase, makeDemoBase, STRUCTURE_CATALOG, GRID_SIZE } from "./model.js";
import { TH7_RULESET } from "./rulesets/th7.js";
import { validateBaseLegality } from "./legality.js";
import { STRATEGIES, attackGeometry } from "./sim.js";
import { buildDossier, buildReviewPrompt } from "./dossier.js";
import { extractBaseWithGemini, reviewDossierWithGemini } from "./gemini.js";
import { projectionFromCanvas, tileToScreen, screenToTile } from "./projection.js";

const $ = q => document.querySelector(q);
const $$ = q => [...document.querySelectorAll(q)];

let base = sanitizeBase(loadJson("cocmc-base", newBase()));
let crackResult = loadJson("cocmc-crack", null);
let screenshotImage = null;
let screenshotDataUrl = null;
let selectedType = "town_hall";
let selectedLevel = TH7_RULESET.entities[selectedType].maxLevel;
let mode = "place";
let extractionStatus = "human-built";
let calibration = loadJson("cocmc-calibration", { centerX:0.5, topY:0.17, gridWidth:0.78, gridHeight:0.62 });
let currentTab = "capture";
let worker = null;
let drawing = false;
let lastPaintKey = null;

boot();

function boot(){
  populatePalettes(); bindTabs(); bindControls(); syncForm(); resizeCanvas(); renderAll(); persist();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
  window.addEventListener("resize",debounce(()=>{resizeCanvas();drawCanvas();},120));
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
  palette.innerHTML="";
  for(const [type,spec] of Object.entries(TH7_RULESET.entities)){
    const b=document.createElement("button");
    b.className="palette-item"; b.dataset.type=type;
    b.innerHTML=`<span class="glyph">${esc(spec.glyph||"□")}</span><span>${esc(spec.label)}</span><small data-count-for="${type}">0/${spec.maxCount}</small>`;
    b.onclick=()=>{selectedType=type;selectedLevel=spec.maxLevel;mode="place";syncSelectedLevel();updatePalette();};
    palette.appendChild(b);
  }
  const strategy=$("#strategy");
  strategy.innerHTML=`<option value="">Auto — compare strategies</option>`+Object.entries(STRATEGIES).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join("");
  syncSelectedLevel(); updatePalette();
}

function bindControls(){
  $("#screenshot")?.addEventListener("change",onScreenshot);
  const canvas=$("#canvas");
  canvas.addEventListener("pointerdown",e=>{drawing=true;lastPaintKey=null;canvas.setPointerCapture?.(e.pointerId);paintPointer(e);});
  canvas.addEventListener("pointermove",e=>{if(drawing && (mode==="erase" || selectedType==="wall"))paintPointer(e);});
  const end=()=>{drawing=false;lastPaintKey=null;};
  canvas.addEventListener("pointerup",end);canvas.addEventListener("pointercancel",end);canvas.addEventListener("pointerleave",()=>{if(!drawing)end();});
  $("#erase").onclick=()=>{mode="erase";updatePalette();};
  $("#clear-base").onclick=()=>{if(confirm("Start a new empty TH7 base?")){base=newBase();crackResult=null;extractionStatus="human-built";persist();renderAll();}};
  $("#demo-base").onclick=()=>{base=makeDemoBase();crackResult=null;extractionStatus="demo";persist();renderAll();};
  $("#selected-level").addEventListener("input",e=>{selectedLevel=Number(e.target.value)||1;syncSelectedLevel();});
  $("#export-base").onclick=()=>downloadJson("th7-base.json",base);
  $("#import-base").addEventListener("change",importBase);
  $("#save-meta").onclick=()=>{updateMeta();persist();renderAll();toast("TH7 base metadata saved.");};
  $("#run-crack").onclick=runCrack;
  $("#copy-dossier").onclick=()=>copyText(JSON.stringify(makeDossier(),null,2),"Dossier copied.");
  $("#copy-review-prompt").onclick=()=>copyText(buildReviewPrompt(makeDossier()),"LLM review prompt copied.");
  $("#download-dossier").onclick=()=>downloadJson("attack-dossier.json",makeDossier());
  $("#gemini-extract")?.addEventListener("click",geminiExtract);
  $("#gemini-review").onclick=geminiReview;
  $("#apply-review").onclick=applyReviewPatch;
  $("#api-key").value=sessionStorage.getItem("cocmc-gemini-key")||"";
  $("#api-key").addEventListener("input",e=>sessionStorage.setItem("cocmc-gemini-key",e.target.value));
  $("#model").value=localStorage.getItem("cocmc-model")||"gemini-3.6-flash";
  $("#model").addEventListener("change",e=>localStorage.setItem("cocmc-model",e.target.value));
  $("#thinking").value=localStorage.getItem("cocmc-thinking")||"high";
  $("#thinking").addEventListener("change",e=>localStorage.setItem("cocmc-thinking",e.target.value));
  ["centerX","topY","gridWidth","gridHeight"].forEach(k=>{
    const el=$(`#cal-${k}`); if(!el)return; el.value=calibration[k];
    el.addEventListener("input",()=>{calibration[k]=Number(el.value);localStorage.setItem("cocmc-calibration",JSON.stringify(calibration));drawCanvas();});
  });
}

function onScreenshot(event){
  const file=event.target.files?.[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{screenshotDataUrl=reader.result;screenshotImage=new Image();screenshotImage.onload=()=>{resizeCanvas();drawCanvas();toast("Screenshot loaded as a visual reference only.");};screenshotImage.src=screenshotDataUrl;};
  reader.readAsDataURL(file);
}

function resizeCanvas(){
  const canvas=$("#canvas"),rect=canvas.getBoundingClientRect();if(rect.width<10)return;
  const dpr=Math.min(devicePixelRatio||1,2),h=Math.max(420,Math.min(720,rect.width*.9));
  canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(h*dpr);canvas.style.height=`${h}px`;
}

function paintPointer(event){
  const canvas=$("#canvas"),rect=canvas.getBoundingClientRect();
  const sx=(event.clientX-rect.left)*(canvas.width/rect.width),sy=(event.clientY-rect.top)*(canvas.height/rect.height);
  const t=screenToTile(sx,sy,projectionFromCanvas(canvas,calibration));
  const x=Math.floor(t.x),y=Math.floor(t.y);if(x<0||y<0||x>=GRID_SIZE||y>=GRID_SIZE)return;
  const key=`${mode}:${selectedType}:${x},${y}`;if(key===lastPaintKey)return;lastPaintKey=key;
  const before=base.structures.length;
  if(mode==="erase")base=removeAt(base,x,y);
  else base=addStructure(base,selectedType,x,y,{level:selectedLevel});
  if(base.structures.length===before && mode!=="erase"){
    const spec=TH7_RULESET.entities[selectedType],count=base.structures.filter(s=>s.type===selectedType).length;
    if(count>=spec.maxCount)toast(`${spec.label}: TH7 maximum is ${spec.maxCount}.`,true);
  }
  extractionStatus="human-built";crackResult=null;persist();renderAll();
}

function drawCanvas(){
  const canvas=$("#canvas");if(!canvas.width)return;const ctx=canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#091018";ctx.fillRect(0,0,canvas.width,canvas.height);
  if(screenshotImage){const scale=Math.min(canvas.width/screenshotImage.width,canvas.height/screenshotImage.height);const w=screenshotImage.width*scale,h=screenshotImage.height*scale;ctx.globalAlpha=.45;ctx.drawImage(screenshotImage,(canvas.width-w)/2,(canvas.height-h)/2,w,h);ctx.globalAlpha=1;}
  const p=projectionFromCanvas(canvas,calibration);
  ctx.lineWidth=Math.max(1,canvas.width/900);ctx.strokeStyle="rgba(160,210,255,.24)";
  for(let i=0;i<=GRID_SIZE;i++){line(ctx,tileToScreen(i,0,p),tileToScreen(i,GRID_SIZE,p));line(ctx,tileToScreen(0,i,p),tileToScreen(GRID_SIZE,i,p));}
  for(const s of base.structures){
    const spec=STRUCTURE_CATALOG[s.type];if(!spec)continue;const [fw,fh]=spec.footprint;const c=tileToScreen(s.x+fw/2,s.y+fh/2,p);
    const rx=Math.max(4,p.tileW*fw*.42),ry=Math.max(3,p.tileH*fh*.42);ctx.beginPath();ctx.ellipse(c.x,c.y,rx,ry,0,0,Math.PI*2);
    ctx.fillStyle=spec.category==="defense"?"rgba(255,118,93,.76)":spec.category==="trap"?"rgba(255,190,92,.76)":s.type==="town_hall"?"rgba(255,213,94,.86)":s.type==="wall"?"rgba(195,205,216,.75)":spec.category==="resource"?"rgba(96,180,255,.62)":"rgba(78,205,196,.62)";ctx.fill();
    if(s.type!=="wall"){ctx.fillStyle="#061019";ctx.font=`bold ${Math.max(7,p.tileH*1.0)}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(spec.glyph,c.x,c.y-2);ctx.font=`${Math.max(6,p.tileH*.7)}px system-ui`;ctx.fillText(`L${s.level}`,c.x,c.y+Math.max(7,p.tileH*.65));}
  }
  if(crackResult?.results?.[0])drawAttack(ctx,p,crackResult.results[0].plan);
}

function drawAttack(ctx,p,plan){const g=attackGeometry(plan),a=tileToScreen(g.entry.x,g.entry.y,p),b=tileToScreen(g.target.x,g.target.y,p);ctx.save();ctx.strokeStyle="rgba(116,255,167,.95)";ctx.lineWidth=Math.max(3,p.tileH*.35);ctx.setLineDash([12,8]);line(ctx,a,b);ctx.restore();}

function renderAll(){drawCanvas();renderBaseTable();renderStats();renderLegality();renderPaletteCounts();renderCrack();renderDossier();syncForm();}

function renderBaseTable(){
  const rows=[...base.structures].sort((a,b)=>a.type.localeCompare(b.type)||a.level-b.level);
  $("#structure-list").innerHTML=rows.length?rows.map(s=>{const spec=STRUCTURE_CATALOG[s.type];return `<tr><td>${esc(spec?.label||s.type)}</td><td>${s.x}, ${s.y}</td><td><input class="level-cell" type="number" min="1" max="${spec.maxLevel}" value="${s.level}" data-level="${s.id}"> / ${spec.maxLevel}</td><td>${spec.footprint.join("×")}</td><td><button class="tiny" data-delete="${s.id}">×</button></td></tr>`;}).join(""):`<tr><td colspan="5" class="muted">Empty TH7 base. Choose an object and place it on the grid.</td></tr>`;
  $$("[data-delete]").forEach(b=>b.onclick=()=>{base.structures=base.structures.filter(s=>s.id!==b.dataset.delete);crackResult=null;persist();renderAll();});
  $$("[data-level]").forEach(input=>input.addEventListener("change",()=>{base=updateStructure(base,input.dataset.level,{level:Number(input.value)});crackResult=null;persist();renderAll();}));
}

function renderStats(){
  const v=validateBaseLegality(base);$("#base-stats").innerHTML=`<strong>${v.totals.buildings}</strong> buildings · <strong>${v.totals.walls}/175</strong> walls · <strong>${v.totals.traps}/15</strong> traps · <strong>${v.legal?"TH7-legal":"invalid"}</strong>`;
}

function renderLegality(){
  const el=$("#legality-report");if(!el)return;const v=validateBaseLegality(base);
  const errors=v.errors.length?v.errors.map(e=>`<li>${esc(e.message)}</li>`).join(""):"<li>No legality violations.</li>";
  const inventory=v.inventory.filter(i=>i.maxCount>0).map(i=>`<div class="inventory-row ${i.placed>i.maxCount?"bad":""}"><span>${esc(i.label)}</span><strong>${i.placed}/${i.maxCount}</strong><small>max L${i.maxLevel}</small></div>`).join("");
  el.innerHTML=`<div class="callout"><strong>${v.legal?"LEGAL TH7 STATE":"NOT LEGAL"}</strong><br>${v.maxInventoryComplete?"All maximum TH7 inventory is represented.":"Legal does not mean maxed: continue entering the buildings/traps that actually exist on your account."}</div><ul>${errors}</ul><div class="inventory-list">${inventory}</div>`;
}

function renderPaletteCounts(){
  const counts=validateBaseLegality(base).counts;for(const [type,spec] of Object.entries(TH7_RULESET.entities)){const el=$(`[data-count-for="${type}"]`);if(el)el.textContent=`${counts[type]||0}/${spec.maxCount}`;}
}

function renderCrack(){const box=$("#crack-results");if(!crackResult?.results?.length){box.innerHTML=`<div class="empty">The current search is the legacy proxy engine. M2 will replace it with the exact deterministic combat kernel before Monte Carlo results are treated as real Clash outcomes.</div>`;return;}box.innerHTML=crackResult.results.map(r=>`<article class="result-card ${r.rank===1?"best":""}"><div class="result-head"><span>#${r.rank} ${esc(STRATEGIES[r.plan.strategy]?.label||r.plan.strategy)}</span><strong>${pct(r.summary.threeStarRate)} legacy proxy 3★</strong></div><div class="metrics"><span>${r.summary.meanDestruction}% mean</span><span>${r.summary.p10Destruction}% p10</span><span>${pct(r.summary.twoPlusRate)} 2★+</span></div></article>`).join("");}
function renderDossier(){const d=makeDossier();$("#dossier-preview").textContent=JSON.stringify(d,null,2);$("#review-output").textContent=loadJson("cocmc-review",null)?JSON.stringify(loadJson("cocmc-review",null),null,2):"No model review yet.";}
function syncForm(){$("#base-name").value=base.meta.name||"";$("#town-hall").value=7;$("#base-notes").value=base.meta.notes||"";const id=$("#ruleset-id");if(id)id.textContent=TH7_RULESET.id;syncSelectedLevel();}
function syncSelectedLevel(){const spec=TH7_RULESET.entities[selectedType];const el=$("#selected-level");if(!el||!spec)return;selectedLevel=Math.max(1,Math.min(spec.maxLevel,selectedLevel));el.min=1;el.max=spec.maxLevel;el.value=selectedLevel;const out=$("#selected-level-max");if(out)out.textContent=`max ${spec.maxLevel}`;}
function updateMeta(){base.meta.name=$("#base-name").value.trim()||"TH7 base";base.meta.townHall=7;base.meta.rulesetId=TH7_RULESET.id;base.meta.notes=$("#base-notes").value.trim();}

async function runCrack(){
  updateMeta();persist();const validation=validateBaseLegality(base);if(!validation.legal){toast("Fix TH7 legality errors before running any search.",true);return;}if(base.structures.length<5){toast("Build more of the base before running the legacy proxy.",true);return;}
  if(worker)worker.terminate();worker=new Worker(new URL("./worker.js",import.meta.url),{type:"module"});const btn=$("#run-crack");btn.disabled=true;btn.textContent="Running legacy proxy…";$("#progress").textContent="Starting legacy proxy search…";
  worker.onmessage=e=>{if(e.data.type==="progress"){const p=e.data.progress;$("#progress").textContent=`Generation ${p.generation}/${p.generations} · ${p.calls.toLocaleString()} proxy rollouts`;}else if(e.data.type==="result"){crackResult=e.data.result;localStorage.setItem("cocmc-crack",JSON.stringify(crackResult));btn.disabled=false;btn.textContent="Run legacy proxy";$("#progress").textContent=`Done · ${crackResult.searchCalls.toLocaleString()} proxy rollouts.`;renderAll();worker.terminate();worker=null;}else finishWorkerError(e.data.error);};
  worker.onerror=e=>finishWorkerError(e.message);worker.postMessage({base,options:{budget:Number($("#budget").value)||1600,generations:Number($("#generations").value)||4,seed:Number($("#seed").value)||1337,strategy:$("#strategy").value||null}});
}
function finishWorkerError(msg){$("#run-crack").disabled=false;$("#run-crack").textContent="Run legacy proxy";$("#progress").textContent=`Error: ${msg}`;if(worker)worker.terminate();worker=null;}

async function geminiExtract(){if(!screenshotImage){toast("Upload a screenshot first.",true);return;}const btn=$("#gemini-extract");btn.disabled=true;btn.textContent="Experimental extraction…";try{const annotated=$("#canvas").toDataURL("image/jpeg",.9);const extracted=await extractBaseWithGemini({apiKey:$("#api-key").value.trim(),model:$("#model").value.trim()||"gemini-3.6-flash",thinkingLevel:$("#thinking").value,annotatedImageDataUrl:annotated,townHall:7});base=sanitizeBase(extracted);extractionStatus="gemini-vision-unverified";crackResult=null;persist();renderAll();toast("Experimental vision proposal loaded. Human verification remains authoritative.");}catch(err){toast(err.message||String(err),true);}finally{btn.disabled=false;btn.textContent="Experimental Gemini assist";}}
async function geminiReview(){if(!crackResult){toast("Run a search first.",true);return;}const btn=$("#gemini-review");btn.disabled=true;btn.textContent="Reviewing…";try{const review=await reviewDossierWithGemini({apiKey:$("#api-key").value.trim(),model:$("#model").value.trim()||"gemini-3.6-flash",thinkingLevel:$("#thinking").value,dossier:makeDossier()});localStorage.setItem("cocmc-review",JSON.stringify(review));renderDossier();toast("Gemini review complete; proposal only.");}catch(err){toast(err.message||String(err),true);}finally{btn.disabled=false;btn.textContent="Review top attack with Gemini";}}
function applyReviewPatch(){const review=loadJson("cocmc-review",null);if(!review?.patch||!crackResult?.results?.[0]){toast("No review patch to apply.",true);return;}const patch=Object.fromEntries(Object.entries(review.patch).filter(([,v])=>v!==null&&v!==undefined));crackResult.results[0].plan={...crackResult.results[0].plan,...patch};localStorage.setItem("cocmc-crack",JSON.stringify(crackResult));renderAll();toast("Proposal applied to displayed plan; not validated by exact combat.");}
function makeDossier(){return buildDossier(base,crackResult,{extractionStatus,rulesetId:TH7_RULESET.id,legality:validateBaseLegality(base)});}
function importBase(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{base=sanitizeBase(JSON.parse(r.result));crackResult=null;extractionStatus="imported";persist();renderAll();toast("TH7 base model imported and normalized.");}catch{toast("Invalid base JSON.",true);}};r.readAsText(f);}
function updatePalette(){$$(".palette-item").forEach(x=>x.classList.toggle("selected",mode==="place"&&x.dataset.type===selectedType));$("#erase").classList.toggle("selected",mode==="erase");}
function persist(){localStorage.setItem("cocmc-base",JSON.stringify(base));if(crackResult)localStorage.setItem("cocmc-crack",JSON.stringify(crackResult));else localStorage.removeItem("cocmc-crack");}
function loadJson(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch{return fallback;}}
function line(ctx,a,b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function pct(v){return `${Math.round((v||0)*100)}%`;}
function esc(s){return String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function debounce(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};}
function downloadJson(name,obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
async function copyText(text,msg){try{await navigator.clipboard.writeText(text);toast(msg);}catch{toast("Clipboard unavailable; use the dossier preview.",true);}}
function toast(msg,error=false){const el=$("#toast");el.textContent=msg;el.classList.toggle("error",error);el.classList.add("show");setTimeout(()=>el.classList.remove("show"),4200);}
