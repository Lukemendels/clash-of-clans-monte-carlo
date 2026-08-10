import test from "node:test";
import assert from "node:assert/strict";
import { runWizardBuilderHutFixture, simulateRepeatedImpacts } from "../src/combat/kernel.js";
import { TH7_COMBAT_RULESET } from "../src/rulesets/th7-combat.js";

test("TH7 Wizard level 4 destroys level 1 Builder Hut in two verified impacts",()=>{
  const trace=runWizardBuilderHutFixture();
  assert.equal(trace.deterministic,true);
  assert.equal(trace.temporalOrigin.deploymentToFirstImpactModeled,false);
  assert.equal(trace.mechanicsUsed.damagePerAttack,187.5);
  assert.equal(trace.mechanicsUsed.attackIntervalMs,1500);
  assert.equal(trace.mechanicsUsed.targetHitpoints,250);
  assert.equal(trace.impactsToDestroy,2);
  assert.equal(trace.destroyedAtMsRelativeToFirstImpact,1500);
  assert.deepEqual(trace.events.map(e=>[e.atMs,e.hitpointsBefore,e.hitpointsAfter,e.destroyed]),[
    [0,250,62.5,false],
    [1500,62.5,0,true],
  ]);
});

test("combat trace is replay deterministic",()=>{
  assert.deepEqual(runWizardBuilderHutFixture(),runWizardBuilderHutFixture());
});

test("kernel refuses unresolved required mechanics instead of guessing",()=>{
  const ruleset=structuredClone(TH7_COMBAT_RULESET);
  ruleset.troops.wizard.levels[4].attackIntervalMs={status:"unresolved",value:null,reason:"fixture"};
  assert.throws(()=>simulateRepeatedImpacts({
    attackerType:"wizard",attackerLevel:4,targetType:"builder_hut",targetLevel:1,ruleset,
  }),/unresolved/);
});
