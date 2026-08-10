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
  const base = newBase();
  base.meta.name = "Full max-inventory TH7 demo";
  base.meta.notes = "Deterministic full TH7 demonstration layout. Every supported TH7 entity is placed at its ruleset maximum count and level. Layout is for engine testing, not base-design quality.";

  // Exactly 175 wall tiles: a 38×38 outer ring (148) plus a 27-tile internal divider.
  const walls = [];
  for (let x=3; x<=40; x++) walls.push([x,3],[x,40]);
  for (let y=4; y<=39; y++) walls.push([3,y],[40,y]);
  for (let x=10; x<=36; x++) walls.push([x,22]);

  walls.forEach(([x,y],index)=>{
    const item = structureFrom("wall",x,y,{level:TH7_RULESET.entities.wall.maxLevel,id:`wall-demo-${index+1}`});
    if (base.structures.some(s=>overlaps(s,item))) throw new Error(`Unable to place demo wall ${index+1} at ${x},${y}.`);
    base.structures.push(item);
  });

  // Place tactically important entities first, then fill every remaining TH7 inventory slot.
  const priority = [
    "town_hall","clan_castle","hero_hall","air_defense","wizard_tower","mortar",
    "hidden_tesla","air_sweeper","cannon","archer_tower",
    "gold_storage","elixir_storage","dark_elixir_storage","dark_elixir_drill",
    "laboratory","spell_factory","dark_barracks","barracks","army_camp",
    "gold_mine","elixir_collector","builder_hut","hero_banner",
    "giant_bomb","bomb","spring_trap","air_bomb","seeking_air_mine",
  ];
  const allNonWall = Object.keys(TH7_RULESET.entities).filter(type=>type!=="wall");
  const placementOrder = [...priority,...allNonWall.filter(type=>!priority.includes(type))];

  const slots = [];
  for (let y=4; y<=39; y++) for (let x=4; x<=39; x++) slots.push([x,y]);
  slots.sort((a,b)=>{
    const da=(a[0]-22)**2+(a[1]-22)**2;
    const db=(b[0]-22)**2+(b[1]-22)**2;
    return da-db || Math.abs(a[1]-22)-Math.abs(b[1]-22) || Math.abs(a[0]-22)-Math.abs(b[0]-22) || a[1]-b[1] || a[0]-b[0];
  });

  for (const type of placementOrder) {
    const spec = TH7_RULESET.entities[type];
    for (let index=0; index<spec.maxCount; index++) {
      let placed = false;
      for (const [x,y] of slots) {
        const item = structureFrom(type,x,y,{level:spec.maxLevel,id:`${type}-demo-${index+1}`});
        if (base.structures.some(s=>overlaps(s,item))) continue;
        base.structures.push(item);
        placed = true;
        break;
      }
      if (!placed) throw new Error(`Unable to place full TH7 demo inventory: ${type} ${index+1}/${spec.maxCount}.`);
    }
  }

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
