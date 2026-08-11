import test from "node:test";
import assert from "node:assert/strict";
import { PROGRESSION_META,TOWN_HALLS,PROGRESSION_GATES,OFFENSIVE_STRUCTURES,STORAGES,aggregateStorageCapacity } from "../src/progression/core-th1-th9.js";
import { REQUIRED_TRAP_COUNTS,INITIAL_TRAP_PLACEMENTS,totalRequiredTraps } from "../src/progression/mandatory-traps-th1-th9.js";
import { TH9_HEROES } from "../src/progression/heroes-th9.js";
import { TH9_RESEARCH,MAX_TH9_RESEARCH_LEVELS,maxResearchLevelAtTH9 } from "../src/progression/research-th9.js";
import { MAX_OFFENSE_TH9_TARGET } from "../src/progression/target-th9.js";
import { LUKE_TH9_RUSH_STRATEGY,isMinuteInSleepWindow,sleepIdleSecondsForCompletion } from "../src/strategy/luke-th9-rush.js";

test("ruleset is pinned to current August 2026 audit",()=>{
  assert.equal(PROGRESSION_META.checkedAt,"2026-08-11");
  assert.equal(TOWN_HALLS[9].upgrade.cost.amount,2_500_000);
  assert.equal(TOWN_HALLS[9].upgrade.durationSeconds,2*86400);
});

test("2026 Hero Hall progression gates cannot regress to old TH7 unlock",()=>{
  const hall=OFFENSIVE_STRUCTURES.hero_hall;
  assert.equal(hall.levels[0].minTownHall,4);
  assert.equal(hall.levels[0].cost.amount,30_000);
  assert.equal(hall.levels[0].durationSeconds,3600);
  assert.equal(PROGRESSION_GATES.kingUnlockTownHall,4);
  assert.equal(PROGRESSION_GATES.kingUpgradeMinTownHall,7);
  assert.deepEqual(PROGRESSION_GATES.heroHallMaxRequiredBeforeLeavingTownHall,{8:2,9:3});
});

test("current Dark Barracks and Laboratory semantics are explicit",()=>{
  const darkBarracks=OFFENSIVE_STRUCTURES.dark_barracks;
  assert.equal(darkBarracks.levels[0].cost.amount,200_000);
  assert.equal(darkBarracks.levels[0].durationSeconds,8*3600);
  const lab=OFFENSIVE_STRUCTURES.laboratory;
  assert.equal(lab.ongoingResearchContinuesDuringBuildingUpgrade,true);
  assert.equal(lab.canStartNewResearchDuringBuildingUpgrade,false);
});

test("bounded target is max offensive TH9, not defensive max",()=>{
  assert.equal(MAX_OFFENSE_TH9_TARGET.townHall,9);
  assert.deepEqual(MAX_OFFENSE_TH9_TARGET.structures.army_camp,{count:4,level:7});
  assert.deepEqual(MAX_OFFENSE_TH9_TARGET.structures.barracks,{count:1,level:11});
  assert.deepEqual(MAX_OFFENSE_TH9_TARGET.structures.laboratory,{count:1,level:7});
  assert.deepEqual(MAX_OFFENSE_TH9_TARGET.heroes,{barbarian_king:30,archer_queen:30,minion_prince:10});
  assert.match(MAX_OFFENSE_TH9_TARGET.defensiveUpgradeLevels,/out-of-scope/);
});

test("every TH9 research target is represented by deterministic cost/time rows",()=>{
  for(const [id,targetLevel] of Object.entries(MAX_TH9_RESEARCH_LEVELS)){
    assert.equal(maxResearchLevelAtTH9(id),targetLevel,id);
    const line=TH9_RESEARCH.find(x=>x.id===id);
    assert.ok(line,id);
    for(const upgrade of line.upgrades){
      assert.ok(upgrade.laboratoryLevelRequired<=7,`${id} lab cap`);
      assert.ok(upgrade.cost.amount>0,`${id} cost`);
      assert.ok(upgrade.durationSeconds>0,`${id} duration`);
    }
  }
});

test("mandatory trap placements reproduce Town Hall trap totals",()=>{
  const expected=[0,0,2,4,8,11,15,23,26];
  for(let th=1;th<=9;th++) assert.equal(totalRequiredTraps(th),expected[th-1],`TH${th}`);
  assert.equal(REQUIRED_TRAP_COUNTS.seeking_air_mine[8],4);
  assert.equal(INITIAL_TRAP_PLACEMENTS.spring_trap.cost.amount,2_000);
  for(const placement of Object.values(INITIAL_TRAP_PLACEMENTS)){
    assert.equal(placement.durationSeconds,0);
    assert.equal(placement.requiresBuilder,false);
  }
});

test("storages are requirement-only and aggregate capacity includes Town Hall",()=>{
  assert.equal(STORAGES.policy,"requirement-only");
  assert.equal(aggregateStorageCapacity("elixir",9,[11,11,11,11]),8_000_000);
  assert.equal(aggregateStorageCapacity("dark_elixir",9,[6]),190_000);
});

test("personal schedule treats 21:00 through 03:29 as protected sleep",()=>{
  assert.equal(LUKE_TH9_RUSH_STRATEGY.builderCount,3);
  assert.deepEqual(LUKE_TH9_RUSH_STRATEGY.sleepWindow,{start:"21:00",end:"03:30"});
  assert.equal(isMinuteInSleepWindow(20*60+59),false);
  assert.equal(isMinuteInSleepWindow(21*60),true);
  assert.equal(isMinuteInSleepWindow(23*60),true);
  assert.equal(isMinuteInSleepWindow(3*60+29),true);
  assert.equal(isMinuteInSleepWindow(3*60+30),false);
  assert.equal(sleepIdleSecondsForCompletion(23*60),4.5*3600);
});

test("strategy forbids premature defense/storage work",()=>{
  assert.equal(LUKE_TH9_RUSH_STRATEGY.hardConstraints.storagePolicy,"upgrade-only-when-capacity-blocks-a-higher-priority-action");
  assert.match(LUKE_TH9_RUSH_STRATEGY.hardConstraints.defensePolicy,/do-not-level-defenses/);
  assert.equal(LUKE_TH9_RUSH_STRATEGY.hardConstraints.neverUpgradeTownHallPast9,true);
  assert.equal(LUKE_TH9_RUSH_STRATEGY.hardConstraints.fabricatedResourceIncomeForbidden,true);
});
