import test from "node:test";
import assert from "node:assert/strict";
import { detectionsToBase } from "../src/gemini.js";
import { projectionFromCanvas, tileToScreen } from "../src/projection.js";

const calibration={centerX:0.5,topY:0.17,gridWidth:0.78,gridHeight:0.62};
const width=1000,height=1000;
const projection=projectionFromCanvas({width,height},calibration);

function anchorForTileCenter(x,y){
  const p=tileToScreen(x,y,projection);
  return [Math.round(p.y/height*1000),Math.round(p.x/width*1000)];
}

test("Gemini image-space anchors map deterministically to structure tile anchors",()=>{
  const parsed={
    observedTownHall:10,
    townHallConfidence:0.9,
    notes:"fixture",
    detections:[
      {type:"town_hall",anchor_2d:anchorForTileCenter(22,22),box_2d:[430,460,530,540],confidence:0.98,notes:""},
      {type:"archer_tower",anchor_2d:anchorForTileCenter(10,30),box_2d:[400,250,470,320],confidence:0.91,notes:""}
    ]
  };
  const base=detectionsToBase(parsed,{width,height,calibration,townHall:10});
  const th=base.structures.find(s=>s.type==="town_hall");
  const at=base.structures.find(s=>s.type==="archer_tower");
  assert.ok(th);
  assert.ok(at);
  assert.ok(Math.abs(th.x-20)<=1 && Math.abs(th.y-20)<=1);
  assert.ok(Math.abs(at.x-8.5)<=1 && Math.abs(at.y-28.5)<=1);
  assert.equal(base.meta.townHall,10);
});

test("higher-town-hall-only detections are rejected under a TH10 operator ruleset",()=>{
  const parsed={observedTownHall:15,townHallConfidence:0.7,notes:"",detections:[
    {type:"monolith",anchor_2d:anchorForTileCenter(22,22),box_2d:[450,450,550,550],confidence:0.7,notes:""}
  ]};
  const base=detectionsToBase(parsed,{width,height,calibration,townHall:10});
  assert.equal(base.structures.length,0);
  assert.equal(base.meta.townHall,10);
});
