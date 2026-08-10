import test from "node:test";
import assert from "node:assert/strict";
import { TH7_RULESET } from "../src/rulesets/th7.js";
import { newBase, addStructure, structureFrom } from "../src/model.js";
import { validateBaseLegality } from "../src/legality.js";

test("TH7 ruleset encodes current inventory ceilings",()=>{
  assert.equal(TH7_RULESET.townHall,7);
  assert.equal(TH7_RULESET.entities.wall.maxCount,175);
  assert.equal(TH7_RULESET.entities.cannon.maxCount,5);
  assert.equal(TH7_RULESET.entities.archer_tower.maxCount,4);
  assert.equal(TH7_RULESET.entities.mortar.maxCount,3);
  assert.equal(TH7_RULESET.entities.air_defense.maxCount,3);
  assert.equal(TH7_RULESET.entities.wizard_tower.maxCount,2);
  assert.equal(TH7_RULESET.entities.air_sweeper.maxCount,1);
  assert.equal(TH7_RULESET.entities.hidden_tesla.maxCount,2);
  assert.equal(TH7_RULESET.entities.laboratory.maxLevel,5);
  assert.deepEqual(TH7_RULESET.entities.laboratory.footprint,[3,3]);
  assert.equal(TH7_RULESET.entities.hero_hall.maxCount,1);
  assert.equal(TH7_RULESET.entities.hero_banner.maxCount,1);
});

test("minimal TH7 envelope can be geometrically legal",()=>{
  let base=newBase();
  base=addStructure(base,"town_hall",20,20,{level:7});
  base=addStructure(base,"builder_hut",0,0,{level:1});
  base=addStructure(base,"builder_hut",42,42,{level:1});
  const result=validateBaseLegality(base);
  assert.equal(result.legal,true,JSON.stringify(result.errors));
});

test("TH7 validator rejects levels above the ceiling",()=>{
  const base=newBase();
  base.structures=[
    structureFrom("town_hall",20,20,{level:7,id:"th"}),
    structureFrom("builder_hut",0,0,{level:1,id:"bh1"}),
    structureFrom("builder_hut",42,42,{level:1,id:"bh2"}),
    {...structureFrom("cannon",5,5,{level:8,id:"c"}),level:9},
  ];
  const result=validateBaseLegality(base);
  assert.equal(result.legal,false);
  assert.ok(result.errors.some(e=>e.code==="level"&&e.id==="c"));
});

test("TH7 validator rejects inventory overflow",()=>{
  const base=newBase();
  base.structures=[
    structureFrom("town_hall",20,20,{level:7,id:"th"}),
    structureFrom("builder_hut",0,0,{level:1,id:"bh1"}),
    structureFrom("builder_hut",42,42,{level:1,id:"bh2"}),
    structureFrom("cannon",4,4,{level:8,id:"c1"}),
    structureFrom("cannon",8,4,{level:8,id:"c2"}),
    structureFrom("cannon",12,4,{level:8,id:"c3"}),
    structureFrom("cannon",16,4,{level:8,id:"c4"}),
    structureFrom("cannon",24,4,{level:8,id:"c5"}),
    structureFrom("cannon",28,4,{level:8,id:"c6"}),
  ];
  const result=validateBaseLegality(base);
  assert.equal(result.legal,false);
  assert.ok(result.errors.some(e=>e.code==="inventory-max"&&e.type==="cannon"));
});

test("builder refuses placement that overlaps occupied ground",()=>{
  let base=newBase();
  base=addStructure(base,"town_hall",20,20,{level:7});
  const before=base.structures.length;
  base=addStructure(base,"cannon",21,21,{level:8});
  assert.equal(base.structures.length,before);
});
