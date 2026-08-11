const m=n=>n*60,h=n=>n*3600,d=n=>n*86400;
const c=(resource,amount)=>({resource,amount});
const lvl=(level,minTownHall,cost,durationSeconds,extra={})=>({level,minTownHall,cost,durationSeconds,...extra});

export const PROGRESSION_META=Object.freeze({
  id:"coc-home-th1-th9-progression-2026-08-11",
  checkedAt:"2026-08-11",
  status:"planner-v0.1-current-audited",
  scope:"Home Village TH1 through max-offense TH9; defensive upgrades excluded from the optimization target.",
  sourcePolicy:"Current Clash Wiki tables are primary structured sources. Official Supercell release notes override historical tables when progression rules changed. chiefpansancolt/clash-of-clans-data@62b019d is cross-check only because it predates the May 2026 Hero Hall change.",
  sources:{
    townHall:"https://clashofclans.fandom.com/wiki/Town_Hall?page=1",
    heroHall:"https://clashofclans.fandom.com/wiki/Hero_Hall",
    heroBanner:"https://clashofclans.fandom.com/wiki/Hero_Banner",
    may2026:"https://supercell.com/en/games/clashofclans/blog/release-notes/may-update/",
    armyCamp:"https://clashofclans.fandom.com/wiki/Army_Camp/Home_Village",
    barracks:"https://clashofclans.fandom.com/wiki/Barracks",
    laboratory:"https://clashofclans.fandom.com/wiki/Laboratory",
    spellFactory:"https://clashofclans.fandom.com/wiki/Spell_Factory",
    darkBarracks:"https://clashofclans.fandom.com/wiki/Dark_Barracks",
    darkSpellFactory:"https://clashofclans.fandom.com/wiki/Dark_Spell_Factory",
    clanCastle:"https://clashofclans.fandom.com/wiki/Clan_Castle",
    blacksmith:"https://clashofclans.fandom.com/wiki/Blacksmith",
    goldStorage:"https://clashofclans.fandom.com/wiki/Gold_Storage",
    darkElixirStorage:"https://clashofclans.fandom.com/wiki/Dark_Elixir_Storage",
  }
});

export const TOWN_HALLS=Object.freeze({
  1:{capacity:{gold:1000,elixir:1000,dark_elixir:0},maxBuildings:13,maxTraps:0},
  2:{upgrade:lvl(2,1,c("gold",1000),10),capacity:{gold:2500,elixir:2500,dark_elixir:0},maxBuildings:17,maxTraps:0},
  3:{upgrade:lvl(3,2,c("gold",4000),m(30)),capacity:{gold:10000,elixir:10000,dark_elixir:0},maxBuildings:25,maxTraps:2},
  4:{upgrade:lvl(4,3,c("gold",25000),h(3)),capacity:{gold:50000,elixir:50000,dark_elixir:0},maxBuildings:29,maxTraps:4},
  5:{upgrade:lvl(5,4,c("gold",150000),h(6)),capacity:{gold:100000,elixir:100000,dark_elixir:0},maxBuildings:36,maxTraps:8},
  6:{upgrade:lvl(6,5,c("gold",500000),h(12)),capacity:{gold:300000,elixir:300000,dark_elixir:0},maxBuildings:42,maxTraps:11},
  7:{upgrade:lvl(7,6,c("gold",1000000),h(18)),capacity:{gold:500000,elixir:500000,dark_elixir:2500},maxBuildings:54,maxTraps:15},
  8:{upgrade:lvl(8,7,c("gold",2000000),d(1)),capacity:{gold:750000,elixir:750000,dark_elixir:5000},maxBuildings:64,maxTraps:23},
  9:{upgrade:lvl(9,8,c("gold",2500000),d(2)),capacity:{gold:1000000,elixir:1000000,dark_elixir:10000},maxBuildings:77,maxTraps:26},
});

export const PROGRESSION_GATES=Object.freeze({
  allAvailableBuildingsPlacedBeforeTownHallUpgrade:true,
  clanCastleRequiredForTownHallUpgrade:false,
  builderHutsRequiredForTownHallUpgrade:false,
  heroHallMaxRequiredBeforeLeavingTownHall:{8:2,9:3},
  heroBannersRequiredBeforeLeavingTownHall:{7:1,8:1,9:2},
  kingUnlockTownHall:4,
  kingUpgradeMinTownHall:7,
});

export const REQUIRED_PLACEMENT_COUNTS=Object.freeze({
  cannon:[1,2,2,2,3,3,5,5,5], archer_tower:[0,1,1,2,3,3,4,5,6], wall:[0,25,50,75,100,125,175,225,250],
  mortar:[0,0,1,1,1,2,3,4,4], air_defense:[0,0,0,1,1,2,3,3,4], wizard_tower:[0,0,0,0,1,2,2,3,4],
  air_sweeper:[0,0,0,0,0,1,1,1,2], hidden_tesla:[0,0,0,0,0,0,2,3,4], bomb_tower:[0,0,0,0,0,0,0,1,1], x_bow:[0,0,0,0,0,0,0,0,2],
  gold_mine:[1,2,3,4,5,6,6,6,7], elixir_collector:[1,2,3,4,5,6,6,6,7], dark_elixir_drill:[0,0,0,0,0,0,1,2,3],
  gold_storage:[1,1,2,2,2,2,2,3,4], elixir_storage:[1,1,2,2,2,2,2,3,4], dark_elixir_storage:[0,0,0,0,0,0,1,1,1],
  army_camp:[1,1,2,2,3,3,4,4,4], barracks:[1,1,1,1,1,1,1,1,1], laboratory:[0,0,1,1,1,1,1,1,1], spell_factory:[0,0,0,0,1,1,1,1,1],
  hero_hall:[0,0,0,1,1,1,1,1,1], hero_banner:[0,0,0,0,0,0,1,1,2], dark_barracks:[0,0,0,0,0,0,1,1,1],
  dark_spell_factory:[0,0,0,0,0,0,0,1,1], blacksmith:[0,0,0,0,0,0,0,1,1], helper_hut:[0,0,0,0,0,0,0,0,1],
});

export const LEVEL_ONE_PLACEMENTS=Object.freeze({
  cannon:{minTownHall:1,cost:c("gold",250),durationSeconds:5}, archer_tower:{minTownHall:2,cost:c("gold",1000),durationSeconds:15},
  mortar:{minTownHall:3,cost:c("gold",5000),durationSeconds:m(30)}, air_defense:{minTownHall:4,cost:c("gold",22000),durationSeconds:h(1)},
  wizard_tower:{minTownHall:5,cost:c("gold",100000),durationSeconds:h(1)}, air_sweeper:{minTownHall:6,cost:c("gold",200000),durationSeconds:h(4)},
  hidden_tesla:{minTownHall:7,cost:c("gold",250000),durationSeconds:h(2)}, bomb_tower:{minTownHall:8,cost:c("gold",700000),durationSeconds:h(12)},
  x_bow:{minTownHall:9,cost:c("gold",1000000),durationSeconds:h(12)}, gold_mine:{minTownHall:1,cost:c("elixir",150),durationSeconds:10},
  elixir_collector:{minTownHall:1,cost:c("gold",150),durationSeconds:10}, dark_elixir_drill:{minTownHall:7,cost:c("elixir",180000),durationSeconds:h(4)},
  hero_banner:{minTownHall:7,cost:null,durationSeconds:0,requiresBuilder:false}, helper_hut:{minTownHall:9,cost:c("elixir",1000000),durationSeconds:0,requiresBuilder:false},
  wall:{minTownHall:2,cost:null,durationSeconds:0,requiresBuilder:false},
});

export const OFFENSIVE_STRUCTURES=Object.freeze({
  army_camp:{label:"Army Camp",countAtTH9:4,targetLevelAtTH9:7,levels:[
    lvl(1,1,c("elixir",200),m(1),{capacity:20}),lvl(2,2,c("elixir",2000),m(5),{capacity:30}),lvl(3,3,c("elixir",10000),m(30),{capacity:35}),
    lvl(4,4,c("elixir",100000),h(2),{capacity:40}),lvl(5,5,c("elixir",250000),h(6),{capacity:45}),lvl(6,6,c("elixir",500000),h(12),{capacity:50}),lvl(7,9,c("elixir",1500000),d(2),{capacity:55})]},
  barracks:{label:"Barracks",countAtTH9:1,targetLevelAtTH9:11,levels:[
    lvl(1,1,c("elixir",100),10,{unlocks:"Barbarian"}),lvl(2,1,c("elixir",500),15,{unlocks:"Archer"}),lvl(3,1,c("elixir",2500),m(2),{unlocks:"Giant"}),
    lvl(4,2,c("elixir",5000),m(30),{unlocks:"Goblin"}),lvl(5,3,c("elixir",20000),h(2),{unlocks:"Wall Breaker"}),lvl(6,4,c("elixir",120000),h(4),{unlocks:"Balloon"}),
    lvl(7,5,c("elixir",270000),h(6),{unlocks:"Wizard"}),lvl(8,6,c("elixir",600000),h(12),{unlocks:"Healer"}),lvl(9,7,c("elixir",1000000),d(1),{unlocks:"Dragon"}),
    lvl(10,8,c("elixir",1400000),d(1)+h(12),{unlocks:"P.E.K.K.A"}),lvl(11,9,c("elixir",2600000),d(2),{unlocks:"Baby Dragon"})]},
  laboratory:{label:"Laboratory",countAtTH9:1,targetLevelAtTH9:7,canStartResearchWhileBuildingUpgradeRuns:true,levels:[
    lvl(1,3,c("elixir",5000),m(1)),lvl(2,4,c("elixir",25000),m(30)),lvl(3,5,c("elixir",50000),h(2)),lvl(4,6,c("elixir",100000),h(4)),
    lvl(5,7,c("elixir",200000),h(8)),lvl(6,8,c("elixir",400000),h(16)),lvl(7,9,c("elixir",800000),d(1))]},
  spell_factory:{label:"Spell Factory",countAtTH9:1,targetLevelAtTH9:4,levels:[
    lvl(1,5,c("elixir",150000),h(6),{unlocks:["Lightning Spell"],spellCapacity:2}),lvl(2,6,c("elixir",300000),h(12),{unlocks:["Healing Spell"],spellCapacity:4}),
    lvl(3,7,c("elixir",600000),d(1),{unlocks:["Rage Spell"],spellCapacity:6}),lvl(4,9,c("elixir",1200000),d(2),{unlocks:["Jump Spell","Freeze Spell"],spellCapacity:8})]},
  dark_barracks:{label:"Dark Barracks",countAtTH9:1,targetLevelAtTH9:6,levels:[
    lvl(1,7,c("elixir",170000),h(8),{unlocks:"Minion"}),lvl(2,7,c("elixir",600000),d(1),{unlocks:"Hog Rider"}),lvl(3,8,c("elixir",1000000),d(1)+h(12),{unlocks:"Valkyrie"}),
    lvl(4,8,c("elixir",1600000),d(2),{unlocks:"Golem"}),lvl(5,9,c("elixir",2200000),d(2)+h(12),{unlocks:"Witch"}),lvl(6,9,c("elixir",2900000),d(3),{unlocks:"Lava Hound"})]},
  dark_spell_factory:{label:"Dark Spell Factory",countAtTH9:1,targetLevelAtTH9:4,levels:[
    lvl(1,8,c("elixir",130000),h(6),{unlocks:"Poison Spell"}),lvl(2,8,c("elixir",260000),h(12),{unlocks:"Earthquake Spell"}),lvl(3,9,c("elixir",600000),d(2),{unlocks:"Haste Spell"}),lvl(4,9,c("elixir",1200000),d(3),{unlocks:"Skeleton Spell"})]},
  hero_hall:{label:"Hero Hall",countAtTH9:1,targetLevelAtTH9:3,levels:[
    lvl(1,4,c("elixir",30000),h(1),{unlocks:"Barbarian King",heroSlots:1}),lvl(2,8,c("elixir",1600000),d(2),{unlocks:"Archer Queen",heroSlots:1}),lvl(3,9,c("elixir",2300000),d(3),{unlocks:"Minion Prince",heroSlots:2})]},
  clan_castle:{label:"Clan Castle",countAtTH9:1,targetLevelAtTH9:5,requiredForTownHallProgression:false,levels:[
    lvl(1,3,c("elixir",10000),0,{requiresBuilder:false,troopCapacity:10}),lvl(2,4,c("elixir",50000),h(2),{troopCapacity:15}),lvl(3,6,c("elixir",600000),h(12),{troopCapacity:20}),
    lvl(4,8,c("elixir",1200000),d(1),{troopCapacity:25,spellCapacity:1}),lvl(5,9,c("elixir",2000000),d(1)+h(12),{troopCapacity:30,spellCapacity:1})]},
  blacksmith:{label:"Blacksmith",countAtTH9:1,targetLevelAtTH9:2,equipmentLevelsInScope:false,levels:[
    lvl(1,8,c("elixir",600000),h(12),{unlocks:"Earthquake Boots"}),lvl(2,9,c("elixir",1200000),d(1),{unlocks:"Giant Arrow"})]},
});

const storageLevels=[
  [1,1,1500,300,10],[2,2,3000,750,m(2)],[3,2,6000,1500,m(5)],[4,3,12000,3000,m(15)],[5,3,25000,6000,m(30)],
  [6,3,45000,12000,h(1)],[7,4,100000,25000,h(2)],[8,4,225000,50000,h(3)],[9,5,450000,100000,h(4)],[10,6,850000,250000,h(5)],[11,7,1750000,500000,h(6)]
];
const makeStorage=(resource,countByTownHall)=>({countByTownHall,levels:storageLevels.map(([level,minTownHall,capacity,amount,durationSeconds])=>({level,minTownHall,capacity,cost:c(resource,amount),durationSeconds}))});
export const STORAGES=Object.freeze({
  policy:"requirement-only",
  gold_storage:makeStorage("elixir",[1,1,2,2,2,2,2,3,4]),
  elixir_storage:makeStorage("gold",[1,1,2,2,2,2,2,3,4]),
  dark_elixir_storage:{countByTownHall:[0,0,0,0,0,0,1,1,1],levels:[
    [1,7,10000,250000,h(8)],[2,7,17500,500000,h(16)],[3,8,40000,1000000,d(1)],[4,8,75000,1500000,d(1)+h(12)],[5,9,140000,2000000,d(1)+h(16)],[6,9,180000,2400000,d(2)]
  ].map(([level,minTownHall,capacity,amount,durationSeconds])=>({level,minTownHall,capacity,cost:c("elixir",amount),durationSeconds}))}
});

export function aggregateStorageCapacity(resource,townHall,storageLevels=[]){
  const th=TOWN_HALLS[townHall]; if(!th) throw new Error(`Unsupported Town Hall: ${townHall}`);
  const key=resource==="gold"?"gold_storage":resource==="elixir"?"elixir_storage":resource==="dark_elixir"?"dark_elixir_storage":null;
  if(!key) throw new Error(`Unsupported resource: ${resource}`);
  return storageLevels.reduce((sum,currentLevel)=>{const rec=STORAGES[key].levels.find(x=>x.level===currentLevel);if(!rec)throw new Error(`Unknown ${key} level ${currentLevel}`);return sum+rec.capacity;},th.capacity[resource]);
}
