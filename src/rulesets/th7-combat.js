export const TH7_COMBAT_RULESET = {
  id: "coc-home-village-th7-combat-2026-08-10",
  townHall: 7,
  checkedAt: "2026-08-10",
  status: "partial-exact-v0.1",
  policy: {
    guessedValuesAllowed: false,
    unresolvedFieldsBlockFeaturesThatRequireThem: true,
  },
  sources: {
    wizardWiki: {
      label: "Clash of Clans Wiki — Wizard",
      url: "https://clashofclans.fandom.com/wiki/Wizard",
      class: "secondary-current",
    },
    builderHutWiki: {
      label: "Clash of Clans Wiki — Builder's Hut",
      url: "https://clashofclans.fandom.com/wiki/Builder%27s_Hut",
      class: "secondary-current",
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

          // These affect deployment-to-impact timing and must not be inferred from DPS/attack speed.
          firstAttackDelayMs: unresolved("No sufficiently authoritative/current value recorded yet."),
          projectileSpeedTilesPerSecond: unresolved("No sufficiently authoritative/current value recorded yet."),
          projectileLaunchOffset: unresolved("No sufficiently authoritative/current value recorded yet."),
          collisionRadiusTiles: unresolved("No sufficiently authoritative/current value recorded yet."),
        },
      },
    },
  },
  buildings: {
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

function unresolved(reason) {
  return { status: "unresolved", value: null, reason, checkedAt: "2026-08-10" };
}
