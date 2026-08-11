const instant=(minTownHall,amount)=>({minTownHall,cost:{resource:"gold",amount},durationSeconds:0,requiresBuilder:false});

export const REQUIRED_TRAP_COUNTS=Object.freeze({
  bomb:[0,0,2,2,4,4,6,6,6],
  spring_trap:[0,0,0,2,2,4,4,6,6],
  air_bomb:[0,0,0,0,2,2,2,4,4],
  giant_bomb:[0,0,0,0,0,1,2,3,4],
  seeking_air_mine:[0,0,0,0,0,0,1,2,4],
  skeleton_trap:[0,0,0,0,0,0,0,2,2],
});

export const INITIAL_TRAP_PLACEMENTS=Object.freeze({
  bomb:instant(3,400),
  spring_trap:instant(4,2_000),
  air_bomb:instant(5,4_000),
  giant_bomb:instant(6,12_500),
  seeking_air_mine:instant(7,12_000),
  skeleton_trap:instant(8,6_000),
});

export const TRAP_PROVENANCE=Object.freeze({
  checkedAt:"2026-08-11",
  note:"Only initial placement cost/count is in the rush ruleset. Trap leveling is defensive work and remains outside the max-offense-TH9 target.",
  urls:{
    bomb:"https://clashofclans.fandom.com/wiki/Bomb",
    springTrap:"https://clashofclans.fandom.com/wiki/Spring_Trap",
    airBomb:"https://clashofclans.fandom.com/wiki/Air_Bomb",
    giantBomb:"https://clashofclans.fandom.com/wiki/Giant_Bomb",
    seekingAirMine:"https://clashofclans.fandom.com/wiki/Seeking_Air_Mine",
    skeletonTrap:"https://clashofclans.fandom.com/wiki/Skeleton_Trap",
  }
});

export function totalRequiredTraps(townHall){
  if(!Number.isInteger(townHall)||townHall<1||townHall>9) throw new Error(`Unsupported Town Hall: ${townHall}`);
  return Object.values(REQUIRED_TRAP_COUNTS).reduce((sum,counts)=>sum+(counts[townHall-1]||0),0);
}
