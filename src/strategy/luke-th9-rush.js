export const LUKE_TH9_RUSH_STRATEGY=Object.freeze({
  id:"luke-th9-rush-max-offense-v1",
  objective:"Reach max offensive capability at TH9 as quickly as practical, then stop for a new bounded strategy.",
  builderCount:3,
  clock:"browser-local",
  sleepWindow:{start:"21:00",end:"03:30"},
  targetTownHall:9,
  stopAt:"max-offense-th9",

  hardConstraints:{
    allThreeBuildersBusyAtSleepStart:true,
    avoidBuilderCompletionDuringSleep:true,
    keepLaboratoryResearchRunningWhenEligible:true,
    placeEveryMandatoryNewBuildingAndTrap:true,
    neverUpgradeTownHallPast9:true,
    storagePolicy:"upgrade-only-when-capacity-blocks-a-higher-priority-action",
    defensePolicy:"place-required-defenses; do-not-level-defenses-before-max-offense-th9",
    fabricatedResourceIncomeForbidden:true,
  },

  priorityTiers:[
    {tier:1,id:"legal-progression-gates",description:"Mandatory placements, Hero Hall/Banner gates, and prerequisites that block Town Hall or offensive progression."},
    {tier:2,id:"town-hall-to-9",description:"Advance Town Hall toward 9 as soon as legal when doing so does not strand mandatory progression."},
    {tier:3,id:"offensive-structures",description:"Laboratory, Army Camps, Barracks, Dark Barracks, Spell Factory, Dark Spell Factory, Hero Hall, Clan Castle, Blacksmith."},
    {tier:4,id:"heroes",description:"Barbarian King, Archer Queen, Minion Prince toward the TH9 Hero Hall caps."},
    {tier:5,id:"laboratory-research",description:"Separate research lane; all troops/spells reachable at Lab 7 progress toward max TH9 levels."},
    {tier:6,id:"storage-prerequisites",description:"No intrinsic value. Promote only when capacity is insufficient for a higher-tier upgrade."},
    {tier:7,id:"defense",description:"Placement only during this bounded goal. Defensive leveling begins only after the strategy is recoded at max-offense TH9."},
  ],

  schedulingWeights:{
    overnightBuilderIdle:"effectively-infinite-penalty",
    ordinaryBuilderIdle:"very-high-penalty",
    laboratoryIdle:"very-high-penalty",
    criticalPathDelay:"highest-finite-penalty",
    storageUpgradeWithoutCapacityNeed:"forbidden",
    defensiveUpgradeBeforeTarget:"forbidden",
  },

  runtimeInputsRequired:[
    "current village levels/counts",
    "active builder upgrades and finish timestamps",
    "current Laboratory research and finish timestamp",
    "current Gold/Elixir/Dark Elixir balances when resource-feasibility scheduling is requested",
  ],
});

export function localMinutes(hhmm){
  const [hh,mm]=String(hhmm).split(":").map(Number);
  if(!Number.isInteger(hh)||!Number.isInteger(mm)||hh<0||hh>23||mm<0||mm>59) throw new Error(`Invalid local time: ${hhmm}`);
  return hh*60+mm;
}

export function isMinuteInSleepWindow(minuteOfDay,strategy=LUKE_TH9_RUSH_STRATEGY){
  const start=localMinutes(strategy.sleepWindow.start),end=localMinutes(strategy.sleepWindow.end);
  const minute=((minuteOfDay%1440)+1440)%1440;
  return start<end ? minute>=start&&minute<end : minute>=start||minute<end;
}

export function sleepIdleSecondsForCompletion(completionMinuteOfDay,strategy=LUKE_TH9_RUSH_STRATEGY){
  if(!isMinuteInSleepWindow(completionMinuteOfDay,strategy)) return 0;
  const end=localMinutes(strategy.sleepWindow.end);
  const minute=((completionMinuteOfDay%1440)+1440)%1440;
  const minutesUntilWake=minute<end ? end-minute : (1440-minute)+end;
  return minutesUntilWake*60;
}
