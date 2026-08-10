import { newBase, addStructure, updateStructure, removeAt, sanitizeBase, makeDemoBase, STRUCTURE_CATALOG, GRID_SIZE } from "./model.js";
import { TH7_RULESET } from "./rulesets/th7.js";
import { TH7_COMBAT_RULESET } from "./rulesets/th7-combat.js";
import { validateBaseLegality } from "./legality.js";
import { STRATEGIES, attackGeometry } from "./sim.js";
import { runWizardBuilderHutFixture } from "./combat/kernel.js";
import { projectionFromCanvas, tileToScreen, screenToTile } from "./projection.js";

const $ = q => document.querySelector(q);
const $$ = q => [...document.querySelectorAll(q)];
const BUILDER_CALIBRATION = { centerX:0.5, topY:0.08, gridWidth:0.82, gridHeight:0.78 };

let base = sanitizeBase(loadJson("cocmc-base", newBase()));
let crackResult = loadJson("cocmc-crack", null);
let selectedType = "town_hall";
let selectedLevel = TH7_RULESET.entities[selectedType].maxLevel;
let mode = "place";
let currentTab = "capture";
let worker = null;
let drawing = false;
let lastPaintKey = null;
let kernelTrace = null;

boot();

function boot(){
  populatePalettes();
  bindTabs();
  bindControls();
  syncForm();
  resizeCanvas();
  renderAll();
  persist();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
  window.addEventListener("resize",debounce(()=>{resizeCanvas();drawCanvas();},120));
}

function bindTabs(){
  $$(".tab").forEach(btn=>btn.addEventListener("click",()=>{
    currentTab=btn.dataset.tab;
    $$(".tab").forEach(x=>x.classList.toggle("active",x===btn));
    $$(".panel").forEach(x=>x.classList.toggle("active",x.id===`panel-${currentTab}`));
    if(currentTab==="capture") requestAnimationFrame(()=>{resizeCanvas();drawCanvas();});
    if(currentTab==="kernel") renderKernel();
  }));
}

function populatePalettes(){
  const palette=$("#palette");
  palette.innerHTML="";
  for(const [type,spec] of Object.entries(TH7_RULESET.entities)){
    const b=document.createElement("button");
    b.className="palette-item";
    b.dataset.type=type;
    b.innerHTML=`<span class="glyph">${esc(spec.glyph||"□")}</span><span>${esc(spec.label)}</span><small data-count-for="${type}">0/${spec.maxCount}</small>`;
    b.onclick=()=>{selectedType=type;selectedLevel=spec.maxLevel;mode="place";syncSelectedLevel();updatePalette();};
    palette.appendChild(b);
  }
  const strategy=$("#strategy");
  strategy.innerHTML=`<option value="">Auto — compare strategies</option>`+Object.entries(STRATEGIES).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join("");
  syncSelectedLevel();
  updatePalette();
}

function bindControls(){
  const canvas=$("#canvas");
  canvas.addEventListener("pointerdown",e=>{drawing=true;lastPaintKey=null;canvas.setPointerCapture?.(e.pointerId);paintPointer(e);});
  canvas.addEventListener("pointermove",e=>{if(drawing && (mode==="erase" || selectedType==="wall"))paintPointer(e);});
  const end=()=>{drawing=false;lastPaintKey=null;};
  canvas.addEventListener("pointerup",end);
  canvas.addEventListener("pointercancel",end);
  canvas.addEventListener("pointerleave",()=>{if(!drawing)end();});

  $("#erase").onclick=()=>{mode="erase";updatePalette();};
  $("#clear-base").onclick=()=>{if(confirm("Start a new empty TH7 base?")){base=newBase();crackResult=null;persist();renderAll();}};
  $("#demo-base").onclick=()=>{base=makeDemoBase();crackResult=null;persist();renderAll();toast("Loaded complete max-inventory TH7 demo.");};
  $("#selected-level").addEventListener("input",e=>{selectedLevel=Number(e.target.value)||1;syncSelectedLevel();});
  $("#export-base").onclick=()=>downloadJson("th7-base.json",base);
  $("#import-base").addEventListener("change",importBase);
  $("#save-meta").onclick=()=>{updateMeta();persist();renderAll();toast("TH7 base metadata saved.");};
  $("#run-fixture").onclick=()=>{kernelTrace=runWizardBuilderHutFixture();renderKernel();toast("Deterministic combat fixture executed.");};
  $("#copy-trace").onclick=()=>{const trace=kernelTrace||runWizardBuilderHutFixture();copyText(JSON.stringify(trace,null,2),"Combat trace copied.");};
  $("#download-trace").onclick=()=>downloadJson("wizard-vs-builder-hut-trace.json",kernelTrace||runWizardBuilderHutFixture());
  $("#run-crack").onclick=runCrack;
}

function resizeCanvas(){
  const canvas=$("#canvas"),rect=canvas.getBoundingClientRect();
  if(rect.width<10)return;
  const dpr=Math.min(devicePixelRatio||1,2),h=Math.max(420,Math.min(720,rect.width*.9));
  canvas.width=Math.round(rect.width*dpr);
  canvas.height=Math.round(h*dpr);
  canvas.style.height=`${h}px`;
}

function paintPointer(event){
  const canvas=$("#canvas"),rect=canvas.getBoundingClientRect();
  const sx=(event.clientX-rect.left)*(canvas.width/rect.width),sy=(event.clientY-rect.top)*(canvas.height/rect.height);
  const t=screenToTile(sx,sy,projectionFromCanvas(canvas,BUILDER_CALIBRATION));
  const x=Math.floor(t.x),y=Math.floor(t.y);
  if(x<0||y<0||x>=GRID_SIZE||y>=GRID_SIZE)return;
  const key=`${mode}:${selectedType}:${x},${y}`;
  if(key===lastPaintKey)return;
  lastPaintKey=key;

  const before=base.structures.length;
  if(mode==="erase") base=removeAt(base,x,y);
  else base=addStructure(base,selectedType,x,y,{level:selectedLevel});

  if(base.structures.length===before && mode!=="erase"){
    const spec=TH7_RULESET.entities[selectedType],count=base.structures.filter(s=>s.type===selectedType).length;
    if(count>=spec.maxCount) toast(`${spec.label}: TH7 maximum is ${spec.maxCount}.`,true);
  }
  crackResult=null;
  persist();
  renderAll();
}

function drawCanvas(){
  const canvas=$("#canvas");
  if(!canvas.width)return;
  const ctx=canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#091018";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const p=projectionFromCanvas(canvas,BUILDER_CALIBRATION);
  ctx.lineWidth=Math.max(1,canvas.width/900);
  ctx.strokeStyle="rgba(160,210,255,.24)";
  for(let i=0;i<=GRID_SIZE;i++){
    line(ctx,tileToScreen(i,0,p),tileToScreen(i,GRID_SIZE,p));
    line(ctx,tileToScreen(0,i,p),tileToScreen(GRID_SIZE,i,p));
  }

  for(const s of base.structures){
    const spec=STRUCTURE_CATALOG[s.type];
    if(!spec)continue;
    const [fw,fh]=spec.footprint;
    const c=tileToScreen(s.x+fw/2,s.y+fh/2,p);
    const rx=Math.max(4,p.tileW*fw*.42),ry=Math.max(3,p.tileH*fh*.42);
    ctx.beginPath();
    ctx.ellipse(c.x,c.y,rx,ry,0,0,Math.PI*2);
    ctx.fillStyle=spec.category==="defense"?"rgba(255,118,93,.76)":spec.category==="trap"?"rgba(255,190,92,.76)":s.type==="town_hall"?"rgba(255,213,94,.86)":s.type==="wall"?"rgba(195,205,216,.75)":spec.category==="resource"?"rgba(96,180,255,.62)":"rgba(78,205,196,.62)";
    ctx.fill();
    if(s.type!=="wall"){
      ctx.fillStyle="#061019";
      ctx.font=`bold ${Math.max(7,p.tileH*1.0)}px system-ui`;
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.fillText(spec.glyph,c.x,c.y-2);
      ctx.font=`${Math.max(6,p.tileH*.7)}px system-ui`;
      ctx.fillText(`L${s.level}`,c.x,c.y+Math.max(7,p.tileH*.65));
    }
  }

  if(crackResult?.results?.[0]) drawAttack(ctx,p,crackResult.results[0].plan);
}

function drawAttack(ctx,p,plan){
  const g=attackGeometry(plan),a=tileToScreen(g.entry.x,g.entry.y,p),b=tileToScreen(g.target.x,g.target.y,p);
  ctx.save();
  ctx.strokeStyle="rgba(116,255,167,.95)";
  ctx.lineWidth=Math.max(3,p.tileH*.35);
  ctx.setLineDash([12,8]);
  line(ctx,a,b);
  ctx.restore();
}

function renderAll(){
  drawCanvas();
  renderBaseTable();
  renderStats();
  renderLegality();
  renderInventoryTable();
  renderPaletteCounts();
  renderKernel();
  renderCrack();
  syncForm();
}

function renderBaseTable(){
  const rows=[...base.structures].sort((a,b)=>a.type.localeCompare(b.type)||a.level-b.level);
  $("#structure-list").innerHTML=rows.length?rows.map(s=>{
    const spec=STRUCTURE_CATALOG[s.type];
    return `<tr><td>${esc(spec?.label||s.type)}</td><td>${s.x}, ${s.y}</td><td>${spec.footprint.join("×")}</td><td><input class="level-cell" type="number" min="1" max="${spec.maxLevel}" value="${s.level}" data-level="${s.id}"> / ${spec.maxLevel}</td><td><button class="tiny" data-delete="${s.id}">×</button></td></tr>`;
  }).join(""):`<tr><td colspan="5" class="muted">Empty TH7 base. Choose an object and place it on the grid.</td></tr>`;

  $$("[data-delete]").forEach(b=>b.onclick=()=>{base.structures=base.structures.filter(s=>s.id!==b.dataset.delete);crackResult=null;persist();renderAll();});
  $$("[data-level]").forEach(input=>input.addEventListener("change",()=>{base=updateStructure(base,input.dataset.level,{level:Number(input.value)});crackResult=null;persist();renderAll();}));
}

function renderStats(){
  const v=validateBaseLegality(base);
  $("#base-stats").innerHTML=`<strong>${v.totals.buildings}</strong> buildings · <strong>${v.totals.walls}/175</strong> walls · <strong>${v.totals.traps}/15</strong> traps · <strong>${v.legal?"TH7-legal":"invalid"}</strong>`;
}

function renderLegality(){
  const v=validateBaseLegality(base);
  $("#legality-summary").innerHTML=`<div class="callout"><strong>${v.legal?"LEGAL TH7 STATE":"NOT LEGAL"}</strong><br>${v.maxInventoryComplete?"All maximum TH7 inventory is represented.":"This state may be legal without being complete. Enter every object that exists in the target base before exact simulation."}</div>`;
  $("#legality-errors").innerHTML=v.errors.length?`<ul>${v.errors.map(e=>`<li>${esc(e.message)}</li>`).join("")}</ul>`:`<p class="muted">No legality violations.</p>`;
}

function renderInventoryTable(){
  const v=validateBaseLegality(base);
  $("#inventory-table").innerHTML=v.inventory.filter(i=>i.maxCount>0).map(i=>`<tr><td>${esc(i.label)}</td><td>${i.placed}</td><td>${i.maxCount}</td><td>${i.maxLevel}</td></tr>`).join("");
}

function renderPaletteCounts(){
  const counts=validateBaseLegality(base).counts;
  for(const [type,spec] of Object.entries(TH7_RULESET.entities)){
    const el=$(`[data-count-for="${type}"]`);
    if(el)el.textContent=`${counts[type]||0}/${spec.maxCount}`;
  }
}

function renderKernel(){
  const wizard=TH7_COMBAT_RULESET.troops.wizard.levels[4];
  const hut=TH7_COMBAT_RULESET.buildings.builder_hut.levels[1];
  const unresolved=Object.entries(wizard).filter(([,v])=>v?.status==="unresolved").map(([k])=>k);
  $("#mechanics-summary").innerHTML=`
    <div class="metrics">
      <span>Wizard L4: ${wizard.damagePerAttack.value} dmg/hit</span>
      <span>${wizard.attackIntervalMs.value} ms cadence</span>
      <span>${wizard.hitpoints.value} HP</span>
      <span>${wizard.rangeTiles.value} tile range</span>
      <span>Builder Hut L1: ${hut.hitpoints.value} HP</span>
    </div>
    <p class="hint"><strong>Verified fields only.</strong> Unresolved: ${esc(unresolved.join(", "))}. These fields are excluded from the kernel rather than guessed.</p>`;

  const pre=$("#kernel-trace");
  if(!kernelTrace){
    pre.textContent="Run the golden fixture. Time zero will be the first verified damage impact, not deployment.";
    return;
  }
  pre.textContent=JSON.stringify(kernelTrace,null,2);
}

function renderCrack(){
  const box=$("#crack-results");
  if(!crackResult?.results?.length){
    box.innerHTML=`<div class="empty">Legacy proxy only. The next Monte Carlo implementation will call the deterministic combat kernel; these heuristic percentages are not Clash probabilities.</div>`;
    return;
  }
  box.innerHTML=crackResult.results.map(r=>`<article class="result-card ${r.rank===1?"best":""}"><div class="result-head"><span>#${r.rank} ${esc(STRATEGIES[r.plan.strategy]?.label||r.plan.strategy)}</span><strong>${pct(r.summary.threeStarRate)} legacy proxy 3★</strong></div><div class="metrics"><span>${r.summary.meanDestruction}% mean</span><span>${r.summary.p10Destruction}% p10</span><span>${pct(r.summary.twoPlusRate)} 2★+</span></div></article>`).join("");
}

function syncForm(){
  $("#base-name").value=base.meta.name||"";
  $("#town-hall").value=7;
  $("#base-notes").value=base.meta.notes||"";
  $("#ruleset-id").textContent=TH7_RULESET.id;
  $("#combat-ruleset-id").textContent=TH7_COMBAT_RULESET.id;
  syncSelectedLevel();
}

function syncSelectedLevel(){
  const spec=TH7_RULESET.entities[selectedType],el=$("#selected-level");
  if(!el||!spec)return;
  selectedLevel=Math.max(1,Math.min(spec.maxLevel,selectedLevel));
  el.min=1;el.max=spec.maxLevel;el.value=selectedLevel;
  $("#selected-level-max").textContent=`max ${spec.maxLevel}`;
}

function updateMeta(){
  base.meta.name=$("#base-name").value.trim()||"TH7 base";
  base.meta.townHall=7;
  base.meta.rulesetId=TH7_RULESET.id;
  base.meta.notes=$("#base-notes").value.trim();
}

async function runCrack(){
  updateMeta();
  persist();
  const validation=validateBaseLegality(base);
  if(!validation.legal){toast("Fix TH7 legality errors before running any search.",true);return;}
  if(base.structures.length<5){toast("Build more of the base before running the legacy proxy.",true);return;}
  if(worker)worker.terminate();
  worker=new Worker(new URL("./worker.js",import.meta.url),{type:"module"});
  const btn=$("#run-crack");
  btn.disabled=true;
  btn.textContent="Running legacy proxy…";
  $("#progress").textContent="Starting legacy proxy search…";
  worker.onmessage=e=>{
    if(e.data.type==="progress"){
      const p=e.data.progress;
      $("#progress").textContent=`Generation ${p.generation}/${p.generations} · ${p.calls.toLocaleString()} proxy rollouts`;
    }else if(e.data.type==="result"){
      crackResult=e.data.result;
      localStorage.setItem("cocmc-crack",JSON.stringify(crackResult));
      btn.disabled=false;
      btn.textContent="Run legacy proxy";
      $("#progress").textContent=`Done · ${crackResult.searchCalls.toLocaleString()} proxy rollouts.`;
      renderAll();
      worker.terminate();
      worker=null;
    }else finishWorkerError(e.data.error);
  };
  worker.onerror=e=>finishWorkerError(e.message);
  worker.postMessage({base,options:{budget:Number($("#budget").value)||1600,generations:Number($("#generations").value)||4,seed:Number($("#seed").value)||1337,strategy:$("#strategy").value||null}});
}

function finishWorkerError(msg){
  $("#run-crack").disabled=false;
  $("#run-crack").textContent="Run legacy proxy";
  $("#progress").textContent=`Error: ${msg}`;
  if(worker)worker.terminate();
  worker=null;
}

function importBase(e){
  const f=e.target.files?.[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{try{base=sanitizeBase(JSON.parse(r.result));crackResult=null;persist();renderAll();toast("TH7 base model imported and normalized.");}catch{toast("Invalid base JSON.",true);}};
  r.readAsText(f);
}

function updatePalette(){
  $$(".palette-item").forEach(x=>x.classList.toggle("selected",mode==="place"&&x.dataset.type===selectedType));
  $("#erase").classList.toggle("selected",mode==="erase");
}
function persist(){localStorage.setItem("cocmc-base",JSON.stringify(base));if(crackResult)localStorage.setItem("cocmc-crack",JSON.stringify(crackResult));else localStorage.removeItem("cocmc-crack");}
function loadJson(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch{return fallback;}}
function line(ctx,a,b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function pct(v){return `${Math.round((v||0)*100)}%`;}
function esc(s){return String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function debounce(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};}
function downloadJson(name,obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
async function copyText(text,msg){try{await navigator.clipboard.writeText(text);toast(msg);}catch{toast("Clipboard unavailable.",true);}}
function toast(msg,error=false){const el=$("#toast");el.textContent=msg;el.classList.toggle("error",error);el.classList.add("show");setTimeout(()=>el.classList.remove("show"),4200);}
