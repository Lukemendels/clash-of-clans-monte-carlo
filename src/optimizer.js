import { STRATEGIES, normalizePlan, runTrial, summarizeTrials, scoreSummary, makeTapSequence } from "./sim.js";

export function optimizeBase(base, options = {}, progress = () => {}) {
  const budget = clampInt(options.budget ?? 1600, 200, 20000);
  const generations = clampInt(options.generations ?? 4, 2, 10);
  const seed = Number(options.seed ?? 1337) >>> 0;
  const strategyNames = options.strategy && STRATEGIES[options.strategy]
    ? [options.strategy]
    : Object.keys(STRATEGIES);
  const populationSize = Math.max(18, Math.min(64, Math.floor(Math.sqrt(budget) * 1.2)));
  const rolloutsPerCandidate = Math.max(6, Math.floor(budget / (generations * populationSize)));
  const rng = mulberry32(seed || 1);
  let population = [];

  for (let i = 0; i < populationSize; i++) population.push(randomPlan(rng, strategyNames));
  let evaluated = [];
  let calls = 0;

  for (let gen = 0; gen < generations; gen++) {
    evaluated = population.map((plan, idx) => {
      const trials = [];
      for (let r = 0; r < rolloutsPerCandidate; r++) {
        const trialSeed = hash32(seed, gen, idx, r, Math.floor(plan.angle*100));
        trials.push(runTrial(base, plan, trialSeed));
        calls++;
      }
      const summary = summarizeTrials(trials);
      return { plan, summary, score: scoreSummary(summary) };
    }).sort((a,b)=>b.score-a.score);

    progress({ generation:gen+1, generations, calls, best:evaluated[0] });
    const elite = evaluated.slice(0, Math.max(5, Math.floor(populationSize * 0.22)));
    population = elite.map(x=>x.plan);
    while (population.length < populationSize) {
      const parent = elite[Math.floor(rng()*elite.length)].plan;
      population.push(mutatePlan(parent, rng, gen));
    }
  }

  const finalists = evaluated.slice(0, Math.min(8, evaluated.length)).map((entry, idx) => {
    const verificationTrials = [];
    const verifyCount = Math.max(80, Math.floor(budget * 0.20 / Math.max(1, Math.min(5,evaluated.length))));
    for (let r=0;r<verifyCount;r++) verificationTrials.push(runTrial(base, entry.plan, hash32(seed, 999, idx, r)));
    const summary = summarizeTrials(verificationTrials);
    return {
      rank: idx + 1,
      plan: entry.plan,
      summary,
      score: scoreSummary(summary),
      tapSequence: makeTapSequence(entry.plan)
    };
  }).sort((a,b)=>b.score-a.score).map((x,i)=>({...x,rank:i+1}));

  return {
    schema: "coc-crack-result/v1",
    engine: "proxy-monte-carlo-v0.1",
    budgetRequested: budget,
    searchCalls: calls,
    verificationCalls: finalists.reduce((n,x)=>n+(x.summary?.trials||0),0),
    seed,
    generatedAt: new Date().toISOString(),
    results: finalists.slice(0,5)
  };
}

function randomPlan(rng, strategies) {
  const strategy = strategies[Math.floor(rng()*strategies.length)];
  return normalizePlan({
    strategy,
    angle:rng()*360,
    offset:rng()*0.72-0.36,
    corridorWidth:3+rng()*8,
    funnelBias:rng()*1.6-0.8,
    spellDepth:0.28+rng()*0.5,
    reserve:0.05+rng()*0.24,
    abilityTempo:0.3+rng()*0.5
  });
}

function mutatePlan(plan,rng,gen) {
  const scale = 1 / (1 + gen * 0.45);
  return normalizePlan({
    ...plan,
    strategy: rng()<0.08 ? Object.keys(STRATEGIES)[Math.floor(rng()*Object.keys(STRATEGIES).length)] : plan.strategy,
    angle: plan.angle + normalish(rng)*36*scale,
    offset: plan.offset + normalish(rng)*0.12*scale,
    corridorWidth: plan.corridorWidth + normalish(rng)*1.7*scale,
    funnelBias: plan.funnelBias + normalish(rng)*0.28*scale,
    spellDepth: plan.spellDepth + normalish(rng)*0.11*scale,
    reserve: plan.reserve + normalish(rng)*0.06*scale,
    abilityTempo: plan.abilityTempo + normalish(rng)*0.1*scale
  });
}

function clampInt(v,min,max){ return Math.max(min,Math.min(max,Math.round(Number(v)||min))); }
function normalish(rng){ return (rng()+rng()+rng()+rng()+rng()+rng()-3)/1.225; }
function mulberry32(a){ return function(){ let t=a+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function hash32(...nums){ let h=2166136261>>>0; for(const n of nums){ const s=String(n); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } } return h>>>0; }
