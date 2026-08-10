import { TH7_COMBAT_RULESET, resolvedValue } from "../rulesets/th7-combat.js";

/**
 * Deterministic damage-cadence slice.
 *
 * Time zero is the FIRST IMPACT, not troop deployment. Movement, target acquisition,
 * first-attack delay, and projectile travel are intentionally outside this slice until
 * their mechanics are sourced. No guessed timing enters the event trace.
 */
export function simulateRepeatedImpacts({
  attackerType,
  attackerLevel,
  targetType,
  targetLevel,
  firstImpactAtMs = 0,
  maxImpacts = 1000,
  ruleset = TH7_COMBAT_RULESET,
}) {
  const attacker = ruleset.troops?.[attackerType]?.levels?.[attackerLevel];
  const target = ruleset.buildings?.[targetType]?.levels?.[targetLevel];
  if (!attacker) throw new Error(`Unsupported attacker: ${attackerType} level ${attackerLevel}`);
  if (!target) throw new Error(`Unsupported target: ${targetType} level ${targetLevel}`);

  const damagePerAttack = resolvedValue(attacker, ["damagePerAttack"]);
  const attackIntervalMs = resolvedValue(attacker, ["attackIntervalMs"]);
  const startingHitpoints = resolvedValue(target, ["hitpoints"]);

  if (!(damagePerAttack > 0)) throw new Error("damagePerAttack must be positive.");
  if (!(attackIntervalMs > 0)) throw new Error("attackIntervalMs must be positive.");
  if (!(startingHitpoints > 0)) throw new Error("target hitpoints must be positive.");

  let hitpoints = startingHitpoints;
  const events = [];

  for (let impact = 1; impact <= maxImpacts && hitpoints > 0; impact++) {
    const before = hitpoints;
    hitpoints = Math.max(0, numeric(before - damagePerAttack));
    const atMs = firstImpactAtMs + (impact - 1) * attackIntervalMs;

    events.push({
      sequence: impact,
      atMs,
      type: "damage-impact",
      attacker: { type: attackerType, level: attackerLevel },
      target: { type: targetType, level: targetLevel },
      damage: damagePerAttack,
      hitpointsBefore: before,
      hitpointsAfter: hitpoints,
      destroyed: hitpoints === 0,
    });
  }

  if (hitpoints > 0) throw new Error(`Target survived maxImpacts=${maxImpacts}; fixture is incomplete.`);

  const destructionEvent = events.at(-1);
  return {
    schema: "basecracker-combat-trace/v1",
    kernel: "first-impact-damage-cadence-v0.1",
    deterministic: true,
    temporalOrigin: {
      zero: "first-impact",
      deploymentToFirstImpactModeled: false,
      reason: "First-attack delay and projectile travel remain unresolved and are not guessed.",
    },
    rulesetId: ruleset.id,
    initialState: {
      attacker: { type: attackerType, level: attackerLevel },
      target: { type: targetType, level: targetLevel, hitpoints: startingHitpoints },
    },
    mechanicsUsed: {
      damagePerAttack,
      attackIntervalMs,
      targetHitpoints: startingHitpoints,
    },
    impactsToDestroy: events.length,
    destroyedAtMsRelativeToFirstImpact: destructionEvent.atMs - firstImpactAtMs,
    events,
  };
}

export function runWizardBuilderHutFixture() {
  return simulateRepeatedImpacts({
    attackerType: "wizard",
    attackerLevel: 4,
    targetType: "builder_hut",
    targetLevel: 1,
    firstImpactAtMs: 0,
  });
}

function numeric(value) {
  return Number(Number(value).toFixed(9));
}
