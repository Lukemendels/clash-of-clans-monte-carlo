import test from "node:test";
import assert from "node:assert/strict";
import { makeDemoBase } from "../src/model.js";
import { validateBaseLegality } from "../src/legality.js";

test("full TH7 demo is legal and max-inventory complete",()=>{
  const base = makeDemoBase();
  const result = validateBaseLegality(base);

  assert.equal(result.legal,true,JSON.stringify(result.errors,null,2));
  assert.equal(result.maxInventoryComplete,true);
  assert.deepEqual(result.totals,{buildings:54,walls:175,traps:15});
  assert.equal(base.structures.length,245); // 54 buildings + 175 walls + 15 traps + 1 Hero Banner.

  for (const item of result.inventory) {
    assert.equal(item.placed,item.maxCount,`${item.type} should be fully populated`);
  }
});

test("full TH7 demo is coordinate-deterministic",()=>{
  const a = makeDemoBase().structures.map(({id,...rest})=>rest);
  const b = makeDemoBase().structures.map(({id,...rest})=>rest);
  assert.deepEqual(a,b);
});
