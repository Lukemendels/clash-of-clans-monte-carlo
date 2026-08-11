import { HOME_BUILDING_IDS,HOME_TRAP_IDS,HOME_UNIT_IDS,HOME_SPELL_IDS,HOME_HERO_IDS,labelFor } from "./village-data-ids.js";

const SEC=1000;

export function parseVillageExport(input){
  const raw=typeof input==="string"?JSON.parse(input):structuredClone(input);
  if(!raw||typeof raw!=="object") throw new Error("Village export must be a JSON object.");
  if(!Number.isFinite(raw.timestamp)) throw new Error("Village export is missing a numeric timestamp.");

  const snapshotMs=raw.timestamp*SEC;
  const buildings=normalizeGroup(raw.buildings,HOME_BUILDING_IDS,"building",snapshotMs);
  const traps=normalizeGroup(raw.traps,HOME_TRAP_IDS,"trap",snapshotMs);
  const units=normalizeGroup(raw.units,HOME_UNIT_IDS,"unit",snapshotMs);
  const spells=normalizeGroup(raw.spells,HOME_SPELL_IDS,"spell",snapshotMs);
  const heroes=normalizeGroup(raw.heroes,HOME_HERO_IDS,"hero",snapshotMs);

  const townHall=singleLevel(buildings,"town_hall");
  if(!townHall) throw new Error("Home Village Town Hall was not found in the export.");

  const builderJobs=[...buildings,...traps,...heroes]
    .filter(x=>x.upgrade)
    .map(x=>jobFrom(x,"builder"))
    .sort((a,b)=>a.finishAtMs-b.finishAtMs);
  const researchJobs=[...units,...spells]
    .filter(x=>x.upgrade)
    .map(x=>jobFrom(x,"laboratory"))
    .sort((a,b)=>a.finishAtMs-b.finishAtMs);

  const unknown={
    buildings:unknownIds(raw.buildings,HOME_BUILDING_IDS),
    traps:unknownIds(raw.traps,HOME_TRAP_IDS),
    units:unknownIds(raw.units,HOME_UNIT_IDS),
    spells:unknownIds(raw.spells,HOME_SPELL_IDS),
    heroes:unknownIds(raw.heroes,HOME_HERO_IDS),
    decos:(raw.decos||[]).map(x=>({data:x.data,count:x.cnt||1})),
  };

  return {
    schema:"basecracker-village-state/v1",
    source:"clash-village-export",
    playerTag:typeof raw.tag==="string"?raw.tag:null,
    exportedAtMs:snapshotMs,
    townHall,
    buildings,
    traps,
    units,
    spells,
    heroes,
    builderJobs,
    researchJobs,
    builderBasePresent:Array.isArray(raw.buildings2)||Array.isArray(raw.units2),
    boosts:raw.boosts&&typeof raw.boosts==="object"?raw.boosts:{},
    unknown,
  };
}

function normalizeGroup(rows,idMap,kind,snapshotMs){
  if(!Array.isArray(rows)) return [];
  return rows.map(row=>{
    const id=idMap[row.data]||`unknown_${row.data}`;
    const count=positiveInt(row.cnt)||1;
    const level=positiveInt(row.lvl)||0;
    const timer=Number(row.timer)||0;
    return {
      id,
      label:labelFor(id),
      dataId:row.data,
      kind,
      level,
      count,
      upgrade:timer>0?{
        fromLevel:level,
        toLevel:level+1,
        remainingSeconds:timer,
        finishAtMs:snapshotMs+timer*SEC,
      }:null,
    };
  });
}

function jobFrom(item,lane){
  return {
    lane,
    id:item.id,
    label:item.label,
    dataId:item.dataId,
    fromLevel:item.upgrade.fromLevel,
    toLevel:item.upgrade.toLevel,
    remainingSeconds:item.upgrade.remainingSeconds,
    finishAtMs:item.upgrade.finishAtMs,
  };
}

function unknownIds(rows,idMap){
  if(!Array.isArray(rows)) return [];
  return rows.filter(x=>!idMap[x.data]).map(x=>({data:x.data,level:x.lvl??null,count:x.cnt||1,timer:x.timer||0}));
}

function positiveInt(value){ const n=Number(value); return Number.isInteger(n)&&n>0?n:0; }
function singleLevel(rows,id){ const found=rows.find(x=>x.id===id); return found?.level||0; }

export function groupLevels(rows,id){
  return rows.filter(x=>x.id===id).map(x=>({level:x.level,count:x.count,upgrade:x.upgrade}));
}

export function countAtLevel(rows,id,level){
  return rows.filter(x=>x.id===id&&x.level===level).reduce((sum,x)=>sum+x.count,0);
}

export function currentLevel(rows,id){
  const matches=rows.filter(x=>x.id===id);
  if(!matches.length) return null;
  if(matches.length===1&&matches[0].count===1) return matches[0].level;
  return matches.map(x=>({level:x.level,count:x.count,upgrade:x.upgrade}));
}

export function summarizeOffense(state){
  const buildingIds=["army_camp","barracks","laboratory","spell_factory","dark_barracks","dark_spell_factory","hero_hall","clan_castle","blacksmith"];
  return {
    buildings:Object.fromEntries(buildingIds.map(id=>[id,groupLevels(state.buildings,id)])),
    heroes:Object.fromEntries(state.heroes.map(x=>[x.id,{level:x.level,upgrade:x.upgrade}])),
    units:Object.fromEntries(state.units.map(x=>[x.id,{level:x.level,upgrade:x.upgrade}])),
    spells:Object.fromEntries(state.spells.map(x=>[x.id,{level:x.level,upgrade:x.upgrade}])),
  };
}

export function formatRemaining(seconds){
  let s=Math.max(0,Math.floor(seconds));
  const d=Math.floor(s/86400);s%=86400;
  const h=Math.floor(s/3600);s%=3600;
  const m=Math.floor(s/60);
  return [d?`${d}d`:null,h?`${h}h`:null,`${m}m`].filter(Boolean).join(" ");
}
