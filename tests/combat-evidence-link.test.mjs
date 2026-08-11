import test from "node:test";
import assert from "node:assert/strict";
import { TH7_COMBAT_RULESET, resolvedValue } from "../src/rulesets/th7-combat.js";

test("TH7 Cannon L8 nominal combat record is explicit",()=>{
  const cannon=TH7_COMBAT_RULESET.buildings.cannon.levels[8];
  assert.equal(resolvedValue(cannon,["hitpoints"]),800);
  assert.equal(resolvedValue(cannon,["damagePerAttack"]),38.4);
  assert.equal(resolvedValue(cannon,["attackIntervalMs"]),800);
  assert.equal(resolvedValue(cannon,["rangeTiles"]),9);
});

test("Wizard and Cannon temporal physics remain evidence-blocked",()=>{
  const wizard=TH7_COMBAT_RULESET.troops.wizard.levels[4];
  const cannon=TH7_COMBAT_RULESET.buildings.cannon.levels[8];
  const fields=[
    ["firstAttackDelayMs","attack.firstAttackDelayMs"],
    ["projectileSpeedTilesPerSecond","projectile.speedTilesPerSecond"],
    ["projectileLaunchOffset","projectile.launchOffset"],
    ["projectilePersistsAfterSourceDeath","projectile.persistsAfterSourceDeath"],
  ];

  for(const entity of [wizard,cannon]){
    for(const [field,requirement] of fields){
      assert.equal(entity[field].status,"unresolved",field);
      assert.equal(entity[field].value,null,field);
      assert.equal(entity[field].evidenceRequirement,requirement,field);
      assert.deepEqual(entity[field].evidenceIds,[],field);
      assert.throws(()=>resolvedValue(entity,[field]),/unresolved/);
    }
  }
});

test("same-timestamp Cannon resolution cannot be invented",()=>{
  const cannon=TH7_COMBAT_RULESET.buildings.cannon.levels[8];
  assert.equal(cannon.sameTimestampResolution.status,"unresolved");
  assert.equal(cannon.sameTimestampResolution.evidenceRequirement,"event.sameTimestampResolution");
  assert.throws(()=>resolvedValue(cannon,["sameTimestampResolution"]),/unresolved/);
});
