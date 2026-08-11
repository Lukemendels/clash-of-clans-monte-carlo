import { OFFENSIVE_STRUCTURES, STORAGES } from "./core-th1-th9.js";
import { TH9_HEROES } from "./heroes-th9.js";
import { MAX_TH9_RESEARCH_LEVELS } from "./research-th9.js";

export const MAX_OFFENSE_TH9_TARGET=Object.freeze({
  id:"max-offense-th9-v1",
  townHall:9,
  structures:Object.freeze(Object.fromEntries(Object.entries(OFFENSIVE_STRUCTURES).map(([id,spec])=>[id,{count:spec.countAtTH9,level:spec.targetLevelAtTH9}]))),
  heroes:Object.freeze(Object.fromEntries(Object.entries(TH9_HEROES).map(([id,spec])=>[id,spec.targetLevelAtTH9]))),
  research:MAX_TH9_RESEARCH_LEVELS,
  storages:STORAGES.policy,
  defensiveUpgradeLevels:"out-of-scope-until-next-bounded-goal",
  heroEquipmentLevels:"not-a-timer-path; separate ore economy, so omitted from builder/laboratory scheduling v1",
  completionRule:"TH9 reached AND all target offensive structures/heroes/research satisfied; storages have no intrinsic target level.",
});
