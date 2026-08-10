import { TH7_RULESET } from "./rulesets/th7.js";

export const GRID_SIZE = TH7_RULESET.gridSize;

const proxyThreat = {
  cannon:2.0, archer_tower:2.1, mortar:1.7, air_defense:3.5,
  wizard_tower:2.6, air_sweeper:1.4, hidden_tesla:2.5,
  clan_castle:3.0,
};

const proxyWeight = {
  town_hall:8, cannon:3, archer_tower:3, mortar:3, air_defense:4,
  wizard_tower:3, air_sweeper:2, hidden_tesla:3, clan_castle:4,
};

export const STRUCTURE_CATALOG = Object.fromEntries(
  Object.entries(TH7_RULESET.entities).map(([type,spec])=>[type,{
    label:spec.label,
    size:spec.footprint[0],
    footprint:[...spec.footprint],
    category:spec.category,
    kind:spec.category === "defense" ? "defense" : spec.category === "wall" ? "wall" : spec.category === "trap" ? "trap" : "building",
    threat:proxyThreat[type] ?? 0.1,
    weight:proxyWeight[type] ?? (spec.category === "wall" || spec.category === "trap" ? 0.25 : 2),
    glyph:spec.glyph,
    minCount:spec.minCount,
    maxCount:spec.maxCount,
    maxLevel:spec.maxLevel,
  }])
);
STRUCTURE_CATALOG.generic = { label:"Unsupported object", size:3, footprint:[3,3], category:"unsupported", kind:"building", threat:0.1, weight:2, glyph:"?", minCount:0, maxCount:0, maxLevel:0 };

export function newBase() {
  return {
    schema: "coc-base/v2",
    meta: {
      name: "TH7 base",
      townHall: 7,
      gridSize: GRID_SIZE,
      rulesetId: TH7_RULESET.id,
      notes: "",
    },
    structures: [],
    uncertainty: {
      hiddenTeslaCount: 0,
      trapDensity: 0,
      ccThreat: 0,
      pathingNoise: 0,
    }
  };
}

export function structureFrom(type, x, y, overrides = {}) {
  const spec = STRUCTURE_CATALOG[type];
  if (!spec || type === "generic") throw new Error(`Unsupported TH7 entity type: ${type}`);
  const maxX = GRID_SIZE - spec.footprint[0];
  const maxY = GRID_SIZE - spec.footprint[1];
  return {
    id: overrides.id || `${type}-${cryptoRandomId()}`,
    type,
    x: clamp(Math.round(x), 0, maxX),
    y: clamp(Math.round(y), 0, maxY),
    size: spec.size,
    level: clamp(Math.round(Number(overrides.level ?? spec.maxLevel)), 1, spec.maxLevel),
    confidence: overrides.confidence ?? 1,
    notes: overrides.notes ?? ""
  };
}

export function addStructure(base, type, x, y, overrides = {}) {
  const next = structuredCloneSafe(base);
  const item = structureFrom(type, x, y, overrides);
  const spec = STRUCTURE_CATALOG[type];
  const currentCount = next.structures.filter(s=>s.type===type).length;
  if (currentCount >= spec.maxCount) return next;
  if (next.structures.some(s=>overlaps(s,item))) return next;
  next.structures.push(item);
  return next;
}

export function updateStructure(base, id, patch = {}) {
  const next = structuredCloneSafe(base);
  const index = next.structures.findIndex(s=>s.id===id);
  if (index < 0) return next;
  const current = next.structures[index];
  const spec = STRUCTURE_CATALOG[current.type];
  if (!spec) return next;
  const updated = structureFrom(current.type, patch.x ?? current.x, patch.y ?? current.y, {
    ...current,
    ...patch,
    id:current.id,
    level:clamp(Math.round(Number(patch.level ?? current.level)),1,spec.maxLevel),
  });
  const others = next.structures.filter((_,i)=>i!==index);
  if (others.some(s=>overlaps(s,updated))) return next;
  next.structures[index]=updated;
  return next;
}

export function removeAt(base, x, y, radius = 1.5) {
  const next = structuredCloneSafe(base);
  let best = null;
  let bestDistance = Infinity;
  for (const s of next.structures) {
    const spec=STRUCTURE_CATALOG[s.type];
    if(!spec) continue;
    const [fw,fh]=spec.footprint;
    const d = Math.hypot((s.x + fw / 2) - x, (s.y + fh / 2) - y);
    if (d < bestDistance && d <= Math.max(radius, Math.max(fw,fh) * 0.8)) {
      best = s;
      bestDistance = d;
    }
  }
  if (best) next.structures = next.structures.filter(s => s.id !== best.id);
  return next;
}

export function sanitizeBase(input) {
  const base = newBase();
  if (!input || typeof input !== "object") return base;
  base.meta = { ...base.meta, ...(input.meta || {}), townHall:7, gridSize:GRID_SIZE, rulesetId:TH7_RULESET.id };
  base.uncertainty = { ...base.uncertainty, ...(input.uncertainty || {}) };
  base.structures = [];
  for(const raw of Array.isArray(input.structures)?input.structures:[]){
    if(!STRUCTURE_CATALOG[raw?.type] || raw.type==="generic") continue;
    try{
      const item=structureFrom(raw.type,Number(raw.x),Number(raw.y),raw);
      if(base.structures.filter(s=>s.type===item.type).length>=STRUCTURE_CATALOG[item.type].maxCount) continue;
      if(base.structures.some(s=>overlaps(s,item))) continue;
      base.structures.push(item);
    }catch{}
  }
  return base;
}

export function makeDemoBase() {
  let base = newBase();
  base.meta.name = "TH7 builder demo";
  const placements = [
    ["town_hall",20,20,7],["clan_castle",20,15,3],["hero_hall",15,20,1],
    ["air_defense",12,14,5],["air_defense",29,14,5],["air_defense",20,29,5],
    ["wizard_tower",12,25,4],["wizard_tower",29,25,4],
    ["mortar",10,20,5],["mortar",31,20,5],["mortar",20,10,5],
    ["hidden_tesla",17,17,3],["hidden_tesla",25,17,3],
    ["air_sweeper",21,25,3],
  ];
  for(const [type,x,y,level] of placements) base=addStructure(base,type,x,y,{level});
  return base;
}

export function baseSummary(base) {
  const counts = {};
  for (const s of base.structures) counts[s.type] = (counts[s.type] || 0) + 1;
  return { townHall:7, rulesetId:TH7_RULESET.id, structureCount:base.structures.length, counts };
}

function rectFor(s){
  const spec=STRUCTURE_CATALOG[s.type]||STRUCTURE_CATALOG.generic;
  return {x:s.x,y:s.y,w:spec.footprint[0],h:spec.footprint[1]};
}
function overlaps(a,b) {
  const A=rectFor(a),B=rectFor(b);
  return !(A.x+A.w<=B.x || B.x+B.w<=A.x || A.y+A.h<=B.y || B.y+B.h<=A.y);
}
function cryptoRandomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().slice(0, 8);
  return Math.random().toString(36).slice(2, 10);
}
function structuredCloneSafe(value) { return globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
