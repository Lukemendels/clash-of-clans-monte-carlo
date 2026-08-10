import { TH7_RULESET } from "./rulesets/th7.js";

export function validateBaseLegality(base, ruleset = TH7_RULESET) {
  const errors = [];
  const warnings = [];
  const counts = {};
  const structures = Array.isArray(base?.structures) ? base.structures : [];

  if (Number(base?.meta?.townHall) !== ruleset.townHall) {
    errors.push({ code:"town-hall", message:`Ruleset requires Town Hall ${ruleset.townHall}.` });
  }
  if (base?.meta?.rulesetId && base.meta.rulesetId !== ruleset.id) {
    warnings.push({ code:"ruleset-id", message:`Base references ${base.meta.rulesetId}; validator is using ${ruleset.id}.` });
  }

  for (const s of structures) {
    const spec = ruleset.entities[s?.type];
    if (!spec) {
      errors.push({ code:"unsupported-type", id:s?.id, message:`${s?.type || "Unknown object"} is not legal in the TH7 ruleset.` });
      continue;
    }

    counts[s.type] = (counts[s.type] || 0) + 1;
    const level = Number(s.level);
    if (!Number.isInteger(level) || level < 1 || level > spec.maxLevel) {
      errors.push({ code:"level", id:s.id, message:`${spec.label} level ${s.level ?? "?"} must be between 1 and ${spec.maxLevel}.` });
    }

    const [fw,fh] = spec.footprint;
    const x = Number(s.x), y = Number(s.y);
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      errors.push({ code:"coordinates", id:s.id, message:`${spec.label} must be anchored to integer tile coordinates.` });
    } else if (x < 0 || y < 0 || x + fw > ruleset.gridSize || y + fh > ruleset.gridSize) {
      errors.push({ code:"bounds", id:s.id, message:`${spec.label} at ${x},${y} falls outside the ${ruleset.gridSize}×${ruleset.gridSize} base grid.` });
    }

    const serializedSize = Number(s.size);
    if (Number.isFinite(serializedSize) && serializedSize !== fw) {
      warnings.push({ code:"footprint-normalized", id:s.id, message:`${spec.label} footprint is authoritative at ${fw}×${fh}; serialized size ${serializedSize} is ignored.` });
    }
  }

  for (const [type,spec] of Object.entries(ruleset.entities)) {
    const count = counts[type] || 0;
    if (count > spec.maxCount) errors.push({ code:"inventory-max", type, message:`${spec.label}: ${count}/${spec.maxCount}; too many for TH7.` });
    if (count < spec.minCount) errors.push({ code:"inventory-min", type, message:`${spec.label}: ${count}/${spec.minCount}; minimum required for this legal configuration.` });
  }

  // Physical occupancy: buildings/walls cannot occupy the same ground tiles. Traps and hero banners
  // may overlap the conceptual footprint of neither; they still occupy legal placement tiles themselves.
  const occupied = new Map();
  for (const s of structures) {
    const spec = ruleset.entities[s?.type];
    if (!spec || !Number.isInteger(Number(s.x)) || !Number.isInteger(Number(s.y))) continue;
    const [fw,fh] = spec.footprint;
    for (let dx=0; dx<fw; dx++) for (let dy=0; dy<fh; dy++) {
      const key = `${Number(s.x)+dx},${Number(s.y)+dy}`;
      const previous = occupied.get(key);
      if (previous && previous !== s.id) {
        errors.push({ code:"overlap", id:s.id, otherId:previous, message:`Ground-tile overlap at ${key}.` });
      } else occupied.set(key,s.id);
    }
  }

  const inventory = Object.entries(ruleset.entities).map(([type,spec])=>({
    type,
    label: spec.label,
    category: spec.category,
    placed: counts[type] || 0,
    maxCount: spec.maxCount,
    maxLevel: spec.maxLevel,
  }));

  const buildings = structures.filter(s=>{
    const spec=ruleset.entities[s.type];
    return spec && spec.category !== "wall" && spec.category !== "trap" && spec.countsAsBuilding !== false;
  }).length;
  const walls = counts.wall || 0;
  const traps = structures.filter(s=>ruleset.entities[s.type]?.category === "trap").length;
  const maxInventoryComplete = inventory.every(i=>i.placed === i.maxCount);

  return {
    rulesetId: ruleset.id,
    legal: errors.length === 0,
    maxInventoryComplete,
    errors,
    warnings,
    counts,
    inventory,
    totals:{ buildings, walls, traps },
    maxima:{ ...ruleset.maxima },
  };
}

export function legalPlacement(base, candidate, ruleset = TH7_RULESET) {
  const next = { ...base, structures:[...(base?.structures || []), candidate] };
  const result = validateBaseLegality(next,ruleset);
  const relevant = result.errors.filter(e=>e.id === candidate.id || e.type === candidate.type || e.code === "overlap");
  return { legal: relevant.length === 0, errors: relevant };
}
