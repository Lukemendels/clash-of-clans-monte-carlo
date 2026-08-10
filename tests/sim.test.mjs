import test from "node:test";
import assert from "node:assert/strict";
import { makeDemoBase, newBase, addStructure, sanitizeBase } from "../src/model.js";
import { runTrial, normalizePlan, makeTapSequence } from "../src/sim.js";
import { optimizeBase } from "../src/optimizer.js";
import { buildDossier } from "../src/dossier.js";

test("seeded trial is reproducible",()=>{
  const base=makeDemoBase();
  const plan=normalizePlan({strategy:"queen_charge_hybrid",angle:42,offset:.08});
  assert.deepEqual(runTrial(base,plan,12345),runTrial(base,plan,12345));
});

test("plan normalization bounds parameters",()=>{
  const p=normalizePlan({angle:725,offset:9,corridorWidth:-4,reserve:3});
  assert.equal(p.angle,5);
  assert.equal(p.offset,.42);
  assert.equal(p.corridorWidth,3);
  assert.equal(p.reserve,.35);
});

test("tap sequence returns executable logical coordinates",()=>{
  const seq=makeTapSequence({strategy:"zap_dragons",angle:180});
  assert.ok(seq.length>=6);
  for(const step of seq){
    assert.ok(step.at.x>=0&&step.at.x<=44);
    assert.ok(step.at.y>=0&&step.at.y<=44);
  }
});

test("optimizer returns ranked verified candidates",()=>{
  const result=optimizeBase(makeDemoBase(),{budget:300,generations:2,seed:17,strategy:"ground_smash"});
  assert.equal(result.schema,"coc-crack-result/v1");
  assert.ok(result.results.length>0);
  assert.equal(result.results[0].rank,1);
  assert.ok(result.results[0].summary.trials>=80);
});

test("base sanitization drops objects outside the authoritative TH7 ruleset",()=>{
  const base=sanitizeBase({structures:[{type:"made_up",x:5,y:5,size:99}]});
  assert.equal(base.meta.townHall,7);
  assert.equal(base.structures.length,0);
});

test("dossier preserves legacy proxy epistemic status",()=>{
  let base=newBase();base=addStructure(base,"town_hall",20,20);
  const dossier=buildDossier(base,null,{extractionStatus:"human-built"});
  assert.equal(dossier.schema,"coc-attack-dossier/v1");
  assert.match(dossier.epistemicStatus.simulator,/proxy/);
});
