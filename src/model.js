export const GRID_SIZE = 44;

export const STRUCTURE_CATALOG = {
  town_hall:     { label: "Town Hall",     size: 4, kind: "objective", threat: 5.0, weight: 8, glyph: "TH" },
  cannon:        { label: "Cannon",        size: 3, kind: "defense",   threat: 2.0, weight: 3, glyph: "C" },
  archer_tower:  { label: "Archer Tower",  size: 3, kind: "defense",   threat: 2.1, weight: 3, glyph: "AT" },
  wizard_tower:  { label: "Wizard Tower",  size: 3, kind: "defense",   threat: 2.6, weight: 3, glyph: "WT" },
  air_defense:   { label: "Air Defense",   size: 3, kind: "defense",   threat: 3.5, weight: 4, glyph: "AD" },
  mortar:        { label: "Mortar",        size: 3, kind: "defense",   threat: 1.7, weight: 3, glyph: "M" },
  xbow:          { label: "X-Bow",         size: 3, kind: "defense",   threat: 4.0, weight: 5, glyph: "XB" },
  inferno:       { label: "Inferno Tower", size: 2, kind: "defense",   threat: 5.2, weight: 6, glyph: "IT" },
  bomb_tower:    { label: "Bomb Tower",    size: 3, kind: "defense",   threat: 2.2, weight: 3, glyph: "BT" },
  eagle:         { label: "Eagle Artillery",size:4, kind: "defense",   threat: 6.3, weight: 7, glyph: "EA" },
  scattershot:   { label: "Scattershot",   size: 3, kind: "defense",   threat: 5.8, weight: 6, glyph: "SS" },
  monolith:      { label: "Monolith",      size: 3, kind: "defense",   threat: 6.8, weight: 7, glyph: "MO" },
  spell_tower:   { label: "Spell Tower",   size: 2, kind: "defense",   threat: 4.4, weight: 5, glyph: "ST" },
  builder_hut:   { label: "Builder Hut",   size: 2, kind: "defense",   threat: 1.2, weight: 2, glyph: "BH" },
  clan_castle:   { label: "Clan Castle",   size: 3, kind: "support",   threat: 3.0, weight: 4, glyph: "CC" },
  storage:       { label: "Storage",       size: 3, kind: "building",  threat: 0.2, weight: 3, glyph: "$" },
  collector:     { label: "Collector",     size: 3, kind: "building",  threat: 0.1, weight: 2, glyph: "+" },
  barracks:      { label: "Barracks",      size: 3, kind: "building",  threat: 0.1, weight: 2, glyph: "B" },
  generic:       { label: "Building",      size: 3, kind: "building",  threat: 0.1, weight: 2, glyph: "•" },
  wall:          { label: "Wall",          size: 1, kind: "wall",      threat: 0.45,weight: 0.25,glyph: "" }
};

export function newBase() {
  return {
    schema: "coc-base/v1",
    meta: {
      name: "Untitled base",
      townHall: 10,
      gridSize: GRID_SIZE,
      notes: ""
    },
    structures: [],
    uncertainty: {
      hiddenTeslaCount: 4,
      trapDensity: 0.28,
      ccThreat: 0.55,
      pathingNoise: 0.12
    }
  };
}

export function structureFrom(type, x, y, overrides = {}) {
  const spec = STRUCTURE_CATALOG[type] || STRUCTURE_CATALOG.generic;
  return {
    id: overrides.id || `${type}-${cryptoRandomId()}`,
    type,
    x: clamp(Math.round(x), 0, GRID_SIZE - 1),
    y: clamp(Math.round(y), 0, GRID_SIZE - 1),
    size: overrides.size ?? spec.size,
    level: overrides.level ?? null,
    confidence: overrides.confidence ?? 1,
    notes: overrides.notes ?? ""
  };
}

export function addStructure(base, type, x, y, overrides = {}) {
  const next = structuredCloneSafe(base);
  const item = structureFrom(type, x, y, overrides);
  if (type !== "wall") {
    next.structures = next.structures.filter(s => !overlaps(s, item));
  }
  next.structures.push(item);
  return next;
}

export function removeAt(base, x, y, radius = 1.5) {
  const next = structuredCloneSafe(base);
  let best = null;
  let bestDistance = Infinity;
  for (const s of next.structures) {
    const d = Math.hypot((s.x + s.size / 2) - x, (s.y + s.size / 2) - y);
    if (d < bestDistance && d <= Math.max(radius, s.size * 0.8)) {
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
  base.meta = { ...base.meta, ...(input.meta || {}) };
  base.meta.gridSize = GRID_SIZE;
  base.uncertainty = { ...base.uncertainty, ...(input.uncertainty || {}) };
  base.structures = Array.isArray(input.structures)
    ? input.structures
        .filter(s => s && typeof s.type === "string" && Number.isFinite(Number(s.x)) && Number.isFinite(Number(s.y)))
        .map(s => structureFrom(STRUCTURE_CATALOG[s.type] ? s.type : "generic", Number(s.x), Number(s.y), s))
    : [];
  return base;
}

export function makeDemoBase() {
  let base = newBase();
  base.meta = { ...base.meta, name: "Legacy TH10-style demo", townHall: 10 };
  const placements = [
    ["town_hall",20,20],["clan_castle",21,15],
    ["inferno",15,19],["inferno",27,19],
    ["xbow",18,12],["xbow",24,12],["xbow",21,27],
    ["air_defense",12,14],["air_defense",30,14],["air_defense",14,28],["air_defense",28,28],
    ["wizard_tower",9,20],["wizard_tower",33,20],["wizard_tower",20,33],["wizard_tower",20,7],
    ["cannon",7,12],["cannon",35,12],["cannon",8,31],["cannon",34,31],
    ["archer_tower",6,22],["archer_tower",36,22],["archer_tower",13,36],["archer_tower",29,36],
    ["mortar",10,8],["mortar",32,8],["mortar",11,34],["mortar",31,34],
    ["storage",15,15],["storage",27,15],["storage",15,25],["storage",27,25],
    ["generic",4,18],["generic",38,18],["generic",4,27],["generic",38,27]
  ];
  for (const [type,x,y] of placements) base = addStructure(base,type,x,y);
  for (let i = 8; i <= 35; i++) {
    base = addStructure(base,"wall",i,10);
    base = addStructure(base,"wall",i,34);
    if (i < 34) {
      base = addStructure(base,"wall",10,i);
      base = addStructure(base,"wall",34,i);
    }
  }
  return base;
}

export function baseSummary(base) {
  const counts = {};
  for (const s of base.structures) counts[s.type] = (counts[s.type] || 0) + 1;
  return {
    townHall: base.meta.townHall,
    structureCount: base.structures.length,
    counts,
    uncertainty: { ...base.uncertainty }
  };
}

function overlaps(a,b) {
  return !(a.x + a.size <= b.x || b.x + b.size <= a.x || a.y + a.size <= b.y || b.y + b.size <= a.y);
}

function cryptoRandomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().slice(0, 8);
  return Math.random().toString(36).slice(2, 10);
}

function structuredCloneSafe(value) {
  return globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
