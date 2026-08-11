const h=n=>n*3600,d=n=>n*86400;
const schedule=[
[2,5000,h(2)],[3,5500,h(4)],[4,6000,h(8)],[5,6500,h(10)],[6,7000,h(12)],[7,7500,h(14)],[8,8000,h(16)],[9,8500,h(18)],[10,10000,h(20)],
[11,10500,h(22)],[12,11000,d(1)],[13,11500,d(1)],[14,12000,d(1)],[15,12500,d(1)],[16,13000,d(1)],[17,13500,d(1)],[18,14000,d(1)],[19,14500,d(1)],[20,15000,d(1)],
[21,17000,d(1)],[22,19000,d(1)],[23,21000,d(1)],[24,23000,d(1)],[25,25000,d(1)],[26,27000,d(2)],[27,29000,d(2)],[28,31000,d(2)],[29,33000,d(2)],[30,35000,d(2)]
].map(([level,amount,durationSeconds])=>({level,cost:{resource:"dark_elixir",amount},durationSeconds}));

export const TH9_HEROES=Object.freeze({
  barbarian_king:{label:"Barbarian King",unlockTownHall:4,unlockHeroHallLevel:1,startsAtLevel:1,upgradeMinTownHall:7,targetLevelAtTH9:30,capsByHeroHall:{1:10,2:20,3:30},upgrades:schedule},
  archer_queen:{label:"Archer Queen",unlockTownHall:8,unlockHeroHallLevel:2,startsAtLevel:1,upgradeMinTownHall:8,targetLevelAtTH9:30,capsByHeroHall:{2:10,3:30},upgrades:schedule},
  minion_prince:{label:"Minion Prince",unlockTownHall:9,unlockHeroHallLevel:3,startsAtLevel:1,upgradeMinTownHall:9,targetLevelAtTH9:10,capsByHeroHall:{3:10},upgrades:schedule.filter(x=>x.level<=10)},
});

export const HERO_PROVENANCE=Object.freeze({
  checkedAt:"2026-08-11",
  urls:{
    heroHall:"https://clashofclans.fandom.com/wiki/Hero_Hall",
    barbarianKing:"https://clashofclans.fandom.com/wiki/Barbarian_King",
    archerQueen:"https://clashofclans.fandom.com/wiki/Archer_Queen",
    minionPrince:"https://clashofclans.fandom.com/wiki/Minion_Prince",
    may2026:"https://supercell.com/en/games/clashofclans/blog/release-notes/may-update/"
  },
  notes:[
    "May 26, 2026 moved Barbarian King and Hero Hall unlock from TH7 to TH4.",
    "King level 1 is usable at TH4-TH6 but level upgrades begin at TH7 when Dark Elixir becomes available.",
    "Hero Hall level 2 unlocks Archer Queen at TH8; level 3 unlocks Minion Prince at TH9.",
    "Max-offense TH9 target uses Hero Hall 3 caps: King 30, Queen 30, Minion Prince 10."
  ]
});
