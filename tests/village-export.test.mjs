import test from "node:test";
import assert from "node:assert/strict";
import { parseVillageExport,groupLevels,countAtLevel } from "../src/import/village-export.js";

test("Village Data Export normalizes Home Village and excludes Builder Base timers",()=>{
  const timestamp=1_700_000_000;
  const state=parseVillageExport({
    tag:"#EXAMPLE",
    timestamp,
    buildings:[
      {data:1000001,lvl:7},
      {data:1000006,lvl:7,timer:7200},
      {data:1000007,lvl:4,timer:3600},
      {data:1000000,lvl:5,timer:5400},
      {data:1000000,lvl:6,cnt:3},
      {data:1000020,lvl:3},
      {data:1000026,lvl:2},
      {data:1000014,lvl:3},
      {data:1000071,lvl:1},
    ],
    units:[{data:4000006,lvl:3}],
    spells:[{data:26000000,lvl:4}],
    heroes:[{data:28000000,lvl:1}],
    traps:[],
    buildings2:[{data:1000043,lvl:1,timer:9999}],
    units2:[{data:4000034,lvl:4,timer:8888}],
    boosts:{},
  });

  assert.equal(state.schema,"basecracker-village-state/v1");
  assert.equal(state.townHall,7);
  assert.equal(state.builderJobs.length,3);
  assert.deepEqual(state.builderJobs.map(x=>x.id).sort(),["army_camp","barracks","laboratory"]);
  assert.equal(state.builderJobs.find(x=>x.id==="barracks").fromLevel,7);
  assert.equal(state.builderJobs.find(x=>x.id==="barracks").toLevel,8);
  assert.equal(state.builderJobs.find(x=>x.id==="barracks").finishAtMs,(timestamp+7200)*1000);
  assert.equal(state.builderBasePresent,true);
  assert.equal(state.researchJobs.length,0);
  assert.equal(countAtLevel(state.buildings,"army_camp",6),3);
  assert.deepEqual(groupLevels(state.buildings,"army_camp").map(x=>[x.level,x.count,Boolean(x.upgrade)]),[[5,1,true],[6,3,false]]);
});

test("unit/spell timer is a Laboratory job and lvl is completed level",()=>{
  const state=parseVillageExport({
    timestamp:1_700_000_000,
    buildings:[{data:1000001,lvl:9}],
    traps:[],
    units:[{data:4000008,lvl:3,timer:1234}],
    spells:[],heroes:[],boosts:{},
  });
  assert.equal(state.researchJobs.length,1);
  assert.equal(state.researchJobs[0].id,"dragon");
  assert.equal(state.researchJobs[0].fromLevel,3);
  assert.equal(state.researchJobs[0].toLevel,4);
  assert.equal(state.researchJobs[0].remainingSeconds,1234);
});

test("unknown records are retained without entering authoritative mapped state",()=>{
  const state=parseVillageExport({timestamp:1_700_000_000,buildings:[{data:1000001,lvl:7},{data:1999999,lvl:2}],traps:[],units:[],spells:[],heroes:[],decos:[{data:18000000,cnt:1}]});
  assert.deepEqual(state.unknown.buildings,[{data:1999999,level:2,count:1,timer:0}]);
  assert.deepEqual(state.unknown.decos,[{data:18000000,count:1}]);
});
