import { GRID_SIZE, STRUCTURE_CATALOG } from "./model.js";

export const STRATEGIES = {
  queen_charge_hybrid: {
    label: "Queen Charge Hybrid",
    mode: "mixed",
    power: 1.08,
    precision: 1.12,
    cleanup: 1.06,
    tempo: 0.94,
    preferredWidth: 5.5
  },
  zap_dragons: {
    label: "Zap Dragons",
    mode: "air",
    power: 1.05,
    precision: 0.88,
    cleanup: 0.98,
    tempo: 1.05,
    preferredWidth: 8.5
  },
  ground_smash: {
    label: "Ground Smash",
    mode: "ground",
    power: 1.12,
    precision: 0.92,
    cleanup: 0.96,
    tempo: 0.91,
    preferredWidth: 7.2
  },
  surgical_air: {
    label: "Surgical Air",
    mode: "air",
    power: 0.98,
    precision: 1.18,
    cleanup: 1.02,
    tempo: 1.08,
    preferredWidth: 4.8
  }
};

export function normalizePlan(plan = {}) {
  const strategy = STRATEGIES[plan.strategy] ? plan.strategy : "queen_charge_hybrid";
  return {
    strategy,
    angle: wrap(Number(plan.angle ?? 0), 0, 360),
    offset: clamp(Number(plan.offset ?? 0), -0.42, 0.42),
    corridorWidth: clamp(Number(plan.corridorWidth ?? STRATEGIES[strategy].preferredWidth), 3, 12),
    funnelBias: clamp(Number(plan.funnelBias ?? 0), -1, 1),
    spellDepth: clamp(Number(plan.spellDepth ?? 0.56), 0.2, 0.9),
    reserve: clamp(Number(plan.reserve ?? 0.14), 0.02, 0.35),
    abilityTempo: clamp(Number(plan.abilityTempo ?? 0.58), 0.2, 0.92)
  };
}

export function attackGeometry(plan) {
  const p = normalizePlan(plan);
  const theta = p.angle * Math.PI / 180;
  const dir = { x: Math.cos(theta), y: Math.sin(theta) };
  const perp = { x: -dir.y, y: dir.x };
  const center = { x: GRID_SIZE / 2, y: GRID_SIZE / 2 };
  const radius = GRID_SIZE * 0.72;
  const entry = {
    x: center.x - dir.x * radius + perp.x * p.offset * GRID_SIZE,
    y: center.y - dir.y * radius + perp.y * p.offset * GRID_SIZE
  };
  const target = {
    x: center.x + dir.x * GRID_SIZE * 0.10,
    y: center.y + dir.y * GRID_SIZE * 0.10
  };
  return { entry, target, dir, perp };
}

export function runTrial(base, rawPlan, seed = 1) {
  const plan = normalizePlan(rawPlan);
  const strategy = STRATEGIES[plan.strategy];
  const rng = mulberry32(seed >>> 0);
  const geometry = attackGeometry(plan);
  const relevant = base.structures.filter(s => s.type !== "wall");
  const defenses = relevant.filter(s => STRUCTURE_CATALOG[s.type]?.kind === "defense" || s.type === "clan_castle");

  let laneThreat = 0;
  let flankThreat = 0;
  let wallFriction = 0;
  const mode = strategy.mode;

  for (const s of defenses) {
    const c = centerOf(s);
    const dist = distancePointToSegment(c, geometry.entry, geometry.target);
    const along = projectionFraction(c, geometry.entry, geometry.target);
    const spec = STRUCTURE_CATALOG[s.type] || STRUCTURE_CATALOG.generic;
    let typeFactor = 1;
    if (mode === "air" && s.type === "air_defense") typeFactor = 1.75;
    if (mode === "air" && ["mortar","cannon","bomb_tower"].includes(s.type)) typeFactor = 0.34;
    if (mode === "ground" && s.type === "air_defense") typeFactor = 0.25;
    if (mode === "ground" && ["cannon","bomb_tower","wizard_tower"].includes(s.type)) typeFactor = 1.22;
    const lane = Math.exp(-Math.pow(dist / (plan.corridorWidth * 1.25), 2));
    const timing = 0.78 + 0.45 * Math.max(0, Math.min(1, along));
    laneThreat += spec.threat * typeFactor * lane * timing;
    flankThreat += spec.threat * typeFactor * (1 - lane) * 0.16;
  }

  if (mode !== "air") {
    for (const w of base.structures.filter(s => s.type === "wall")) {
      const d = distancePointToSegment(centerOf(w), geometry.entry, geometry.target);
      if (d < plan.corridorWidth * 0.75) wallFriction += 0.05;
    }
  }

  const u = base.uncertainty || {};
  const hiddenTesla = poissonLike(rng, Number(u.hiddenTeslaCount ?? 0) * 0.35) * (0.45 + rng() * 0.7);
  const trapLoss = Number(u.trapDensity ?? 0.25) * (0.5 + rng()) * (mode === "air" ? 1.2 : 1);
  const ccLoss = Number(u.ccThreat ?? 0.5) * (0.45 + rng()) * (mode === "mixed" ? 0.85 : 1.05);
  const pathNoise = normalish(rng) * Number(u.pathingNoise ?? 0.12) * 3.2;

  const widthFit = Math.exp(-Math.pow((plan.corridorWidth - strategy.preferredWidth) / 5, 2));
  const funnelQuality = clamp(0.74 + strategy.precision * 0.18 + widthFit * 0.18 - Math.abs(plan.funnelBias) * 0.05 + normalish(rng) * 0.06, 0.35, 1.15);
  const spellQuality = clamp(0.74 + (1 - Math.abs(plan.spellDepth - 0.58)) * 0.22 + normalish(rng) * 0.07, 0.35, 1.1);
  const reserveValue = 0.86 + plan.reserve * strategy.cleanup * 1.1;

  const rawDefenseLoad = laneThreat * 0.075 + flankThreat * 0.03 + wallFriction + hiddenTesla * 0.11 + trapLoss * 0.5 + ccLoss * 0.42 + pathNoise;
  const attackPower = 4.7 * strategy.power * funnelQuality * spellQuality * reserveValue;
  const survival = clamp(logistic((attackPower - rawDefenseLoad) * 0.82), 0.02, 0.995);

  let destroyedWeight = 0;
  let totalWeight = 0;
  let townHallDestroyed = false;
  let keyDefenseMisses = 0;

  for (const s of relevant) {
    const spec = STRUCTURE_CATALOG[s.type] || STRUCTURE_CATALOG.generic;
    const weight = spec.weight || 1;
    totalWeight += weight;
    const c = centerOf(s);
    const dist = distancePointToSegment(c, geometry.entry, geometry.target);
    const along = projectionFraction(c, geometry.entry, geometry.target);
    const lane = Math.exp(-Math.pow(dist / (plan.corridorWidth * 1.55), 2));
    const cleanupReach = strategy.cleanup * plan.reserve * 1.8;
    const pDestroy = clamp(
      0.16 + lane * (0.50 + survival * 0.38) + cleanupReach * (1 - lane) * 0.34 + Math.max(0, along) * 0.04 + normalish(rng) * 0.04,
      0.02,
      0.995
    );
    const destroyed = rng() < pDestroy;
    if (destroyed) destroyedWeight += weight;
    if (s.type === "town_hall") townHallDestroyed = destroyed;
    if (!destroyed && spec.kind === "defense" && spec.threat >= 4) keyDefenseMisses++;
  }

  const destruction = clamp(100 * destroyedWeight / Math.max(totalWeight, 1), 0, 100);
  const oneStar = destruction >= 50 || townHallDestroyed;
  const twoStar = destruction >= 50 && townHallDestroyed;
  const threeStar = destruction >= 96 && townHallDestroyed && survival > 0.31;
  const stars = threeStar ? 3 : twoStar ? 2 : oneStar ? 1 : 0;
  const timeSeconds = clamp(185 - survival * 68 + keyDefenseMisses * 6 + Math.abs(normalish(rng)) * 8, 68, 180);

  let failure = null;
  if (!townHallDestroyed) failure = "town-hall-survives";
  else if (destruction < 90) failure = "core-force-collapse";
  else if (destruction < 96) failure = "cleanup-failure";
  else if (survival <= 0.31) failure = "late-force-collapse";

  return {
    stars,
    destruction: round(destruction, 2),
    townHallDestroyed,
    survival: round(survival, 4),
    timeSeconds: round(timeSeconds, 1),
    failure,
    diagnostics: {
      laneThreat: round(laneThreat, 3),
      wallFriction: round(wallFriction, 3),
      hiddenTesla: round(hiddenTesla, 3),
      trapLoss: round(trapLoss, 3),
      ccLoss: round(ccLoss, 3),
      funnelQuality: round(funnelQuality, 3),
      spellQuality: round(spellQuality, 3)
    }
  };
}

export function summarizeTrials(trials) {
  if (!trials.length) return null;
  const ds = trials.map(t => t.destruction).sort((a,b)=>a-b);
  const failures = {};
  for (const t of trials) if (t.failure) failures[t.failure] = (failures[t.failure] || 0) + 1;
  const three = trials.filter(t => t.stars === 3).length / trials.length;
  const twoPlus = trials.filter(t => t.stars >= 2).length / trials.length;
  return {
    trials: trials.length,
    threeStarRate: round(three, 4),
    twoPlusRate: round(twoPlus, 4),
    meanDestruction: round(avg(ds), 2),
    p10Destruction: round(percentile(ds, 0.10), 2),
    p50Destruction: round(percentile(ds, 0.50), 2),
    p90Destruction: round(percentile(ds, 0.90), 2),
    meanTimeSeconds: round(avg(trials.map(t=>t.timeSeconds)), 1),
    failures
  };
}

export function scoreSummary(s) {
  if (!s) return -Infinity;
  return s.threeStarRate * 1000 + s.twoPlusRate * 120 + s.p10Destruction * 3.5 + s.meanDestruction;
}

export function makeTapSequence(plan) {
  const p = normalizePlan(plan);
  const g = attackGeometry(p);
  const strategy = STRATEGIES[p.strategy];
  const inside = (pt) => ({ x: round(clamp(pt.x,0,GRID_SIZE),1), y: round(clamp(pt.y,0,GRID_SIZE),1) });
  const anchor = inside({ x:g.entry.x + g.dir.x*5, y:g.entry.y + g.dir.y*5 });
  const left = inside({ x:anchor.x + g.perp.x*(p.corridorWidth*0.85), y:anchor.y + g.perp.y*(p.corridorWidth*0.85) });
  const right = inside({ x:anchor.x - g.perp.x*(p.corridorWidth*0.85), y:anchor.y - g.perp.y*(p.corridorWidth*0.85) });
  const main = inside({ x:g.entry.x + g.dir.x*3, y:g.entry.y + g.dir.y*3 });
  const spell = inside({ x:g.entry.x + (g.target.x-g.entry.x)*p.spellDepth, y:g.entry.y + (g.target.y-g.entry.y)*p.spellDepth });
  const deepSpell = inside({ x:g.entry.x + (g.target.x-g.entry.x)*Math.min(0.88,p.spellDepth+0.2), y:g.entry.y + (g.target.y-g.entry.y)*Math.min(0.88,p.spellDepth+0.2) });
  return [
    { t:0, phase:"funnel", action:"deploy funnel package", at:left, note:"Establish first edge of funnel." },
    { t:2.5, phase:"funnel", action:"deploy opposite funnel package", at:right, note:"Close the funnel before committing the main force." },
    { t:7.5, phase:"commit", action:`deploy ${strategy.label} main force`, at:main, note:"Primary commitment along optimized axis." },
    { t:10, phase:"commit", action:"deploy heroes / support", at:anchor, note:"Follow main force; preserve adaptation window." },
    { t:20, phase:"spell", action:"first major spell", at:spell, note:"Timing is conditional on force reaching this depth." },
    { t:34, phase:"spell", action:"second major spell / control", at:deepSpell, note:"Use only if the modeled core branch is occurring." },
    { t:55, phase:"ability", action:"hero ability checkpoint", at:deepSpell, note:`Target ability tempo ${Math.round(p.abilityTempo*100)}%; react to actual HP/state.` },
    { t:85, phase:"cleanup", action:"release reserve", at:right, note:`Reserve target ${Math.round(p.reserve*100)}% of army value; redirect based on surviving perimeter.` }
  ];
}

function centerOf(s){ return {x:s.x+s.size/2, y:s.y+s.size/2}; }
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function wrap(v,min,max){ const n=max-min; return ((v-min)%n+n)%n+min; }
function logistic(x){ return 1/(1+Math.exp(-x)); }
function avg(xs){ return xs.reduce((a,b)=>a+b,0)/Math.max(xs.length,1); }
function round(v,n=3){ const m=10**n; return Math.round(v*m)/m; }
function percentile(xs,p){ if(!xs.length)return 0; const i=(xs.length-1)*p; const lo=Math.floor(i),hi=Math.ceil(i); return xs[lo]+(xs[hi]-xs[lo])*(i-lo); }
function normalish(rng){ return (rng()+rng()+rng()+rng()+rng()+rng()-3)/1.225; }
function poissonLike(rng,lambda){ let L=Math.exp(-lambda),k=0,p=1; do{k++;p*=rng();}while(p>L&&k<20); return k-1; }
function mulberry32(a){ return function(){ let t=a+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function distancePointToSegment(p,a,b){ const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y; const c1=vx*wx+vy*wy; const c2=vx*vx+vy*vy || 1; const t=clamp(c1/c2,0,1); return Math.hypot(p.x-(a.x+t*vx),p.y-(a.y+t*vy)); }
function projectionFraction(p,a,b){ const vx=b.x-a.x,vy=b.y-a.y,den=vx*vx+vy*vy||1; return ((p.x-a.x)*vx+(p.y-a.y)*vy)/den; }
