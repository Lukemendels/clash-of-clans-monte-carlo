import { parseVillageExport,formatRemaining,summarizeOffense } from "./import/village-export.js";
import { labelFor } from "./import/village-data-ids.js";
import { loadPlannerState,savePlannerState,clearPlannerState } from "./planner-store.js";
import { LUKE_TH9_RUSH_STRATEGY } from "./strategy/luke-th9-rush.js";
import { MAX_OFFENSE_TH9_TARGET } from "./progression/target-th9.js";

const $=q=>document.querySelector(q);
let state=null;

boot();

async function boot(){
  bind();
  state=await loadPlannerState("village",null).catch(()=>null);
  render();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
}

function bind(){
  $("#import-village").addEventListener("click",importText);
  $("#paste-village").addEventListener("click",async()=>{
    try{$("#village-json").value=await navigator.clipboard.readText();toast("Pasted from clipboard.");}
    catch{toast("Clipboard read blocked. Paste manually instead.",true);}
  });
  $("#clear-village").addEventListener("click",async()=>{
    if(!confirm("Clear the locally stored village snapshot?")) return;
    await clearPlannerState("village"); state=null; $("#village-json").value=""; render(); toast("Local village state cleared.");
  });
}

async function importText(){
  try{
    const parsed=parseVillageExport($("#village-json").value.trim());
    await savePlannerState("village",parsed);
    state=parsed;
    render();
    $("#village-json").value="";
    toast(`Synced TH${parsed.townHall} village.`);
  }catch(error){toast(error.message||String(error),true);}
}

function render(){
  $("#strategy-summary").innerHTML=`<strong>Goal:</strong> rush to TH${LUKE_TH9_RUSH_STRATEGY.targetTownHall}, then finish max offense before recoding.<br><strong>Protected sleep:</strong> ${LUKE_TH9_RUSH_STRATEGY.sleepWindow.start}–${LUKE_TH9_RUSH_STRATEGY.sleepWindow.end} · ${LUKE_TH9_RUSH_STRATEGY.builderCount} builders.<br><strong>Storage:</strong> requirement-only. <strong>Defense:</strong> placement-only during this bounded goal.`;
  $("#target-summary").textContent=`Target: TH${MAX_OFFENSE_TH9_TARGET.townHall} max offense · defenses deferred.`;

  if(!state){
    $("#sync-status").textContent="No village synced yet.";
    $("#summary-cards").innerHTML=emptyCard("Paste the in-game Village Data Export to initialize the planner.");
    $("#builder-jobs").innerHTML=emptyCard("No builder state yet.");
    $("#lab-job").innerHTML=emptyCard("No Laboratory state yet.");
    $("#offense-state").innerHTML="";
    $("#research-state").innerHTML="";
    $("#import-notes").innerHTML="";
    return;
  }

  const age=Math.max(0,Math.floor((Date.now()-state.exportedAtMs)/1000));
  $("#sync-status").textContent=`TH${state.townHall} · snapshot ${formatRemaining(age)} old · ${new Date(state.exportedAtMs).toLocaleString()}`;
  const activeBuilders=state.builderJobs.length;
  const research=state.researchJobs[0]||null;
  $("#summary-cards").innerHTML=[
    metric("Town Hall",`TH${state.townHall}`),
    metric("Builders",`${activeBuilders}/${LUKE_TH9_RUSH_STRATEGY.builderCount} active`),
    metric("Laboratory",research?`${research.label} L${research.fromLevel}→${research.toLevel}`:"No research timer"),
    metric("Next boundary",nextBoundary()),
  ].join("");

  $("#builder-jobs").innerHTML=state.builderJobs.length?state.builderJobs.map(jobCard).join(""):emptyCard("No active Home Village builder upgrades detected.");
  $("#lab-job").innerHTML=research?jobCard(research):labIdleCard();
  renderOffense();
  renderResearch();
  renderNotes();
}

function nextBoundary(){
  const jobs=[...state.builderJobs,...state.researchJobs].sort((a,b)=>a.finishAtMs-b.finishAtMs);
  if(!jobs.length)return "All lanes idle";
  const job=jobs[0];
  return `${job.label} ${new Date(job.finishAtMs).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}`;
}

function jobCard(job){
  const now=Date.now();
  const remaining=Math.max(0,Math.round((job.finishAtMs-now)/1000));
  return `<article class="job-card"><div><span class="lane">${job.lane==="builder"?"BUILDER":"LAB"}</span><h3>${esc(job.label)} <span>L${job.fromLevel} → L${job.toLevel}</span></h3></div><div class="job-time"><strong>${formatRemaining(remaining)}</strong><small>${new Date(job.finishAtMs).toLocaleString([], {weekday:"short",hour:"numeric",minute:"2-digit"})}</small></div></article>`;
}

function labIdleCard(){
  const labUpgrade=state.builderJobs.find(x=>x.id==="laboratory");
  if(labUpgrade) return `<article class="job-card warning"><div><span class="lane">LAB</span><h3>No active research</h3><p>Laboratory building is upgrading to L${labUpgrade.toLevel}; a new research job cannot start until it finishes.</p></div><div class="job-time"><strong>${new Date(labUpgrade.finishAtMs).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</strong><small>next research start</small></div></article>`;
  return `<article class="job-card warning"><div><span class="lane">LAB</span><h3>Laboratory idle</h3><p>No active troop/spell research timer was detected in the export.</p></div></article>`;
}

function renderOffense(){
  const offense=summarizeOffense(state);
  const rows=Object.entries(offense.buildings).filter(([,levels])=>levels.length).map(([id,levels])=>row(labelFor(id),formatGrouped(levels))).join("")+
    Object.entries(offense.heroes).map(([id,v])=>row(labelFor(id),levelText(v))).join("");
  $("#offense-state").innerHTML=rows||`<tr><td colspan="2">No offensive state mapped.</td></tr>`;
}

function renderResearch(){
  const groups=[...state.units,...state.spells];
  $("#research-state").innerHTML=groups.length?groups.map(x=>row(x.label,`L${x.level}${x.upgrade?` → L${x.upgrade.toLevel} (${formatRemaining(x.upgrade.remainingSeconds)})`:""}`)).join(""):`<tr><td colspan="2">No troop/spell levels mapped.</td></tr>`;
}

function renderNotes(){
  const unknownCount=Object.values(state.unknown).flat().length;
  const notes=[];
  if(state.builderBasePresent)notes.push("Builder Base data detected and intentionally excluded from the Home Village planner.");
  if(unknownCount)notes.push(`${unknownCount} unmapped/auxiliary export records retained as non-authoritative unknowns; they do not affect Phase 2 offensive-state parsing.`);
  notes.push("Current Gold, Elixir, and Dark Elixir balances are not present in Village Data Export.");
  notes.push("Helper levels/cooldowns/assignments are not present in Village Data Export.");
  $("#import-notes").innerHTML=notes.map(x=>`<li>${esc(x)}</li>`).join("");
}

function formatGrouped(levels){
  return levels.map(x=>`${x.count>1?`${x.count}× `:""}L${x.level}${x.upgrade?` → L${x.upgrade.toLevel} upgrading`:""}`).join(" · ");
}
function levelText(v){return `L${v.level}${v.upgrade?` → L${v.upgrade.toLevel} upgrading`:""}`;}
function metric(label,value){return `<article class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`;}
function row(a,b){return `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`;}
function emptyCard(text){return `<article class="empty">${esc(text)}</article>`;}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function toast(message,error=false){const el=$("#toast");el.textContent=message;el.classList.toggle("error",error);el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2800);}
