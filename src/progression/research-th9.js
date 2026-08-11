const h=n=>n*3600,d=n=>n*86400,m=n=>n*60;
const makeLine=(id,label,resource,unlock,rows)=>({id,label,resource,unlock,upgrades:rows.map(([level,laboratoryLevelRequired,amount,durationSeconds])=>({level,laboratoryLevelRequired,cost:{resource,amount},durationSeconds}))});

export const TH9_RESEARCH=Object.freeze([
  makeLine("barbarian","Barbarian","elixir",{barracksLevel:1,startsAtLevel:1},[[2,1,10000,m(30)],[3,3,50000,h(1)],[4,5,130000,h(2)],[5,6,300000,h(4)],[6,7,800000,h(8)]]),
  makeLine("archer","Archer","elixir",{barracksLevel:2,startsAtLevel:1},[[2,1,20000,h(1)],[3,3,80000,h(2)],[4,5,200000,h(3)],[5,6,500000,h(8)],[6,7,1000000,h(12)]]),
  makeLine("giant","Giant","elixir",{barracksLevel:3,startsAtLevel:1},[[2,2,40000,h(2)],[3,4,150000,h(4)],[4,5,400000,h(6)],[5,6,800000,h(12)],[6,7,1500000,d(1)]]),
  makeLine("goblin","Goblin","elixir",{barracksLevel:4,startsAtLevel:1},[[2,1,45000,h(2)],[3,3,100000,h(3)],[4,5,500000,h(6)],[5,6,700000,h(12)],[6,7,1600000,d(1)]]),
  makeLine("wall_breaker","Wall Breaker","elixir",{barracksLevel:5,startsAtLevel:1},[[2,2,80000,h(3)],[3,4,200000,h(4)],[4,5,450000,h(12)],[5,6,1000000,h(16)]]),
  makeLine("balloon","Balloon","elixir",{barracksLevel:6,startsAtLevel:1},[[2,2,100000,h(4)],[3,4,400000,h(6)],[4,5,720000,h(18)],[5,6,1300000,d(1)],[6,7,2750000,d(3)]]),
  makeLine("wizard","Wizard","elixir",{barracksLevel:7,startsAtLevel:1},[[2,3,120000,h(4)],[3,4,300000,h(5)],[4,5,600000,h(12)],[5,6,1200000,h(18)],[6,7,2000000,d(1)+h(12)]]),
  makeLine("healer","Healer","elixir",{barracksLevel:8,startsAtLevel:1},[[2,5,450000,h(12)],[3,6,900000,d(1)],[4,7,2500000,d(2)]]),
  makeLine("dragon","Dragon","elixir",{barracksLevel:9,startsAtLevel:1},[[2,5,1000000,h(18)],[3,6,2000000,d(1)+h(12)],[4,7,3000000,d(2)]]),
  makeLine("pekka","P.E.K.K.A","elixir",{barracksLevel:10,startsAtLevel:1},[[2,6,600000,h(12)],[3,6,1300000,h(18)],[4,7,2000000,d(1)]]),
  makeLine("baby_dragon","Baby Dragon","elixir",{barracksLevel:11,startsAtLevel:1},[[2,7,1500000,d(1)]]),

  makeLine("lightning_spell","Lightning Spell","elixir",{spellFactoryLevel:1,startsAtLevel:1},[[2,1,50000,h(2)],[3,2,100000,h(4)],[4,3,200000,h(6)],[5,6,600000,d(1)],[6,7,1500000,d(1)+h(12)]]),
  makeLine("healing_spell","Healing Spell","elixir",{spellFactoryLevel:2,startsAtLevel:1},[[2,2,75000,h(3)],[3,4,150000,h(6)],[4,5,300000,h(12)],[5,6,900000,d(1)],[6,7,1800000,d(1)+h(12)]]),
  makeLine("rage_spell","Rage Spell","elixir",{spellFactoryLevel:3,startsAtLevel:1},[[2,3,400000,h(6)],[3,4,800000,h(12)],[4,5,1000000,d(1)],[5,6,2000000,d(2)]]),
  makeLine("jump_spell","Jump Spell","elixir",{spellFactoryLevel:4,startsAtLevel:1},[[2,5,1000000,d(1)]]),
  makeLine("freeze_spell","Freeze Spell","elixir",{spellFactoryLevel:4,startsAtLevel:1},[[2,7,1200000,d(1)]]),

  makeLine("minion","Minion","dark_elixir",{darkBarracksLevel:1,startsAtLevel:1},[[2,5,1000,h(6)],[3,6,2500,h(8)],[4,6,5000,h(12)],[5,7,10000,d(1)]]),
  makeLine("hog_rider","Hog Rider","dark_elixir",{darkBarracksLevel:2,startsAtLevel:1},[[2,5,2000,h(10)],[3,6,3500,h(18)],[4,6,5000,d(1)],[5,7,10000,d(2)]]),
  makeLine("valkyrie","Valkyrie","dark_elixir",{darkBarracksLevel:3,startsAtLevel:1},[[2,6,3000,h(8)],[3,7,5000,d(1)],[4,7,10000,d(1)+h(12)]]),
  makeLine("golem","Golem","dark_elixir",{darkBarracksLevel:4,startsAtLevel:1},[[2,6,4000,h(16)],[3,7,6000,d(1)+h(12)],[4,7,10000,d(2)]]),
  makeLine("witch","Witch","dark_elixir",{darkBarracksLevel:5,startsAtLevel:1},[[2,7,20000,d(2)]]),
  makeLine("lava_hound","Lava Hound","dark_elixir",{darkBarracksLevel:6,startsAtLevel:1},[[2,7,14000,d(2)]]),

  makeLine("poison_spell","Poison Spell","dark_elixir",{darkSpellFactoryLevel:1,startsAtLevel:1},[[2,6,5000,h(6)],[3,7,10000,h(18)]]),
  makeLine("earthquake_spell","Earthquake Spell","dark_elixir",{darkSpellFactoryLevel:2,startsAtLevel:1},[[2,6,6000,h(12)],[3,7,12000,d(1)]]),
  makeLine("haste_spell","Haste Spell","dark_elixir",{darkSpellFactoryLevel:3,startsAtLevel:1},[[2,7,8000,d(1)]]),
  makeLine("skeleton_spell","Skeleton Spell","dark_elixir",{darkSpellFactoryLevel:4,startsAtLevel:1},[]),
]);

export const MAX_TH9_RESEARCH_LEVELS=Object.freeze({
  barbarian:6,archer:6,giant:6,goblin:6,wall_breaker:5,balloon:6,wizard:6,healer:4,dragon:4,pekka:4,baby_dragon:2,
  lightning_spell:6,healing_spell:6,rage_spell:5,jump_spell:2,freeze_spell:2,
  minion:5,hog_rider:5,valkyrie:4,golem:4,witch:2,lava_hound:2,
  poison_spell:3,earthquake_spell:3,haste_spell:2,skeleton_spell:1,
});

export const RESEARCH_PROVENANCE=Object.freeze({
  checkedAt:"2026-08-11",
  sourceClass:"current Clash Wiki tables, cross-checked against the structured data snapshot where applicable",
  note:"Only levels reachable with Home Village Laboratory level 7 / TH9 are included. Initial troop/spell unlocks occur through production buildings and have no Laboratory timer.",
  urls:{
    wizard:"https://clashofclans.fandom.com/wiki/Wizard",
    laboratory:"https://clashofclans.fandom.com/wiki/Laboratory",
    troops:"https://clashofclans.fandom.com/wiki/Troops",
    spells:"https://clashofclans.fandom.com/wiki/Spells",
  }
});

export function researchLineById(id){return TH9_RESEARCH.find(x=>x.id===id)||null;}
export function maxResearchLevelAtTH9(id){const line=researchLineById(id);if(!line)throw new Error(`Unknown research line: ${id}`);return Math.max(line.unlock.startsAtLevel||1,...line.upgrades.map(x=>x.level));}
