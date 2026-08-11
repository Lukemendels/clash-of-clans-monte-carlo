export const TH7_COMBAT_RULESET = {
  id: "coc-home-village-th7-combat-2026-08-10",
  townHall: 7,
  checkedAt: "2026-08-10",
  status: "partial-exact-v0.2-evidence-linked",
  policy: {
    guessedValuesAllowed: false,
    unresolvedFieldsBlockFeaturesThatRequireThem: true,
    temporalAndPhysicsFieldsRequireEvidencePromotion: true,
  },
  sources: {
    wizardWiki: {
      label: "Clash of Clans Wiki — Wizard",
      url: "https://clashofclans.fandom.com/wiki/Wizard",
      class: "secondary-current",
      evidenceId: "wizard-l4-static-2026-08-10",
    },
    cannonWiki: {
      label: "Clash of Clans Wiki — Cannon/Home Village",
      url: "https://clashofclans.fandom.com/wiki/Cannon/Home_Village",
      class: "secondary-current",
      evidenceId: "cannon-l8-static-2026-08-10",
    },
    builderHutWiki: {
      label: "Clash of Clans Wiki — Builder's Hut",
      url: "https://clashofclans.fandom.com/wiki/Builder%27s_Hut",
      class: "secondary-current",
      evidenceId: "builder-hut-l1-static-2026-08-10",
    },
    th7LabCap: {
      label: "Supercell TH14 patch notes — donation Laboratory cap table",
      url: "https://supercell.com/en/games/clashofclans/blog/release-notes/full-patch-notes-th14-update/",
      class: "official",
    },
  },
  troops: {
    wizard: {
      label: "Wizard",
      maxLevelAtTH7: 4,
      maxLevelAtTH7Provenance: {
        status: "derived-verified",
        basis: "The current Wizard table requires Laboratory 5 for Wizard level 4; Supercell identifies TH7 with Laboratory level 5 for donation caps.",
        sources: ["wizardWiki", "th7LabCap"],
      },
      levels: {
        4: {
          hitpoints: field(135, "wizardWiki"),
          damagePerAttack: field(187.5, "wizardWiki"),
          damagePerSecond: field(125, "wizardWiki"),
          attackIntervalMs: field(1500, "wizardWiki"),
          movementSpeed: field(16, "wizardWiki"),
          rangeTiles: field(3, "wizardWiki"),
          housingSpace: field(4, "wizardWiki"),
          attackType: field("area-splash", "wizardWiki"),
          splashRadiusTiles: field(0.3, "wizardWiki"),
          targets: field(["ground", "air"], "wizardWiki"),
          preferredTarget: field(null, "wizardWiki"),

          // These affect deployment-to-impact timing and projectile causality.
          firstAttackDelayMs: unresolved(
            "No promoted current-patch frame measurement yet.",
            "attack.firstAttackDelayMs"
          ),
          projectileSpeedTilesPerSecond: unresolved(
            "No promoted current-patch frame measurement yet.",
            "projectile.speedTilesPerSecond"
          ),
          projectileLaunchOffset: unresolved(
            "No promoted current-patch frame measurement yet.",
            "projectile.launchOffset"
          ),
          projectilePersistsAfterSourceDeath: unresolved(
            "Gameplay evidence is required to determine whether an already-launched Wizard projectile survives Wizard death.",
            "projectile.persistsAfterSourceDeath"
          ),
          projectilePersistsAfterTargetDeath: unresolved(
            "Gameplay evidence is required to determine post-target-death projectile behavior.",
            "projectile.persistsAfterTargetDeath"
          ),
          collisionRadiusTiles: unresolved(
            "No promoted collision/footprint calibration yet.",
            null
          ),
        },
      },
    },
  },
  buildings: {
    cannon: {
      label: "Cannon",
      maxLevelAtTH7: 8,
      levels: {
        8: {
          hitpoints: field(800, "cannonWiki"),
          damagePerAttack: field(38.4, "cannonWiki"),
          damagePerSecond: field(48, "cannonWiki"),
          attackIntervalMs: field(800, "cannonWiki"),
          rangeTiles: field(9, "cannonWiki"),
          footprint: derivedField([3,3], "TH7 legality ruleset and current Cannon Home Village table agree on a 3×3 footprint.", ["cannonWiki"]),
          targets: field(["ground"], "cannonWiki"),
          damageType: field("single-target", "cannonWiki"),

          firstAttackDelayMs: unresolved(
            "No promoted current-patch frame measurement yet.",
            "attack.firstAttackDelayMs"
          ),
          projectileSpeedTilesPerSecond: unresolved(
            "No promoted current-patch frame measurement yet.",
            "projectile.speedTilesPerSecond"
          ),
          projectileLaunchOffset: unresolved(
            "No promoted current-patch frame measurement yet.",
            "projectile.launchOffset"
          ),
          projectilePersistsAfterSourceDeath: unresolved(
            "Gameplay evidence is required to determine whether an already-launched Cannon projectile survives Cannon destruction.",
            "projectile.persistsAfterSourceDeath"
          ),
          projectilePersistsAfterTargetDeath: unresolved(
            "Gameplay evidence is required to determine post-target-death projectile behavior.",
            "projectile.persistsAfterTargetDeath"
          ),
          sameTimestampResolution: unresolved(
            "If Cannon and attacker damage land on the same simulation timestamp, event ordering must be evidence-backed rather than arbitrary.",
            "event.sameTimestampResolution"
          ),
        },
      },
    },
    builder_hut: {
      label: "Builder's Hut",
      levels: {
        1: {
          hitpoints: field(250, "builderHutWiki"),
          footprint: field([2, 2], "builderHutWiki"),
          targetable: field(true, "builderHutWiki"),
          isDefenseAtTH7: derivedField(false, "Builder Huts become weaponized defenses only starting at Town Hall 14.", ["builderHutWiki"]),
          armorOrDamageReduction: unresolved("No separate armor/damage-reduction mechanic has been sourced; kernel must not assume one if a future mechanic depends on it."),
        },
      },
    },
  },
};

export function resolvedValue(record, path) {
  const fieldRecord = path.reduce((value, key) => value?.[key], record);
  if (!fieldRecord || !["verified","derived-verified"].includes(fieldRecord.status)) {
    throw new Error(`Required combat field is unresolved: ${path.join(".")}`);
  }
  return fieldRecord.value;
}

function field(value, source) {
  return { status: "verified", value, source, checkedAt: "2026-08-10" };
}

function derivedField(value, basis, sources) {
  return { status: "derived-verified", value, basis, sources, checkedAt: "2026-08-10" };
}

function unresolved(reason, evidenceRequirement = null) {
  return {
    status: "unresolved",
    value: null,
    reason,
    evidenceRequirement,
    evidenceIds: [],
    checkedAt: "2026-08-10",
  };
}
