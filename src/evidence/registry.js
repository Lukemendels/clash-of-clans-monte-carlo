export const EVIDENCE_GRADE = Object.freeze({
  A_CURRENT_PATCH: "A-current-patch",
  B_HISTORICAL_INVARIANT: "B-historical-invariant",
  C_UNVERIFIED: "C-unverified",
  STATIC_REFERENCE: "static-reference",
});

export const EVIDENCE_STATUS = Object.freeze({
  ACCEPTED: "accepted",
  CANDIDATE: "candidate",
  REJECTED: "rejected",
});

export const CURRENT_PATCH_BASELINE = Object.freeze({
  id: "patch-2026-07-09-july-balance-update",
  effectiveDate: "2026-07-09",
  label: "July Balance Update",
  source: {
    kind: "official-patch",
    publisher: "Supercell",
    url: "https://supercell.com/en/games/clashofclans/blog/news/july-balance-update/",
  },
  scopeNote: "Latest published Clash of Clans balance update found during the 2026-08-10 evidence audit. Its announced changes focus on TH18-era content; lower-TH mechanic continuity must still be checked before historical footage is promoted.",
});

/**
 * Mechanics evidence is deliberately separate from the combat ruleset.
 * Evidence may be collected freely; only records that pass promotion rules may
 * become authoritative mechanics.
 */
export const MECHANICS_EVIDENCE = Object.freeze([
  {
    id: CURRENT_PATCH_BASELINE.id,
    status: EVIDENCE_STATUS.ACCEPTED,
    grade: EVIDENCE_GRADE.STATIC_REFERENCE,
    claimType: "patch-baseline",
    mechanic: "game.patchBaseline",
    source: CURRENT_PATCH_BASELINE.source,
    observedPatch: CURRENT_PATCH_BASELINE.id,
    observation: {
      value: CURRENT_PATCH_BASELINE.effectiveDate,
      note: CURRENT_PATCH_BASELINE.scopeNote,
    },
  },
  {
    id: "wizard-l4-static-2026-08-10",
    status: EVIDENCE_STATUS.ACCEPTED,
    grade: EVIDENCE_GRADE.STATIC_REFERENCE,
    claimType: "static-parameter",
    mechanic: "troop.wizard.level4.nominalStats",
    source: {
      kind: "reference-table",
      publisher: "Clash of Clans Wiki",
      url: "https://clashofclans.fandom.com/wiki/Wizard",
      checkedAt: "2026-08-10",
    },
    observation: {
      values: {
        hitpoints: 135,
        damagePerAttack: 187.5,
        damagePerSecond: 125,
        attackIntervalMs: 1500,
        movementSpeed: 16,
        rangeTiles: 3,
      },
    },
  },
  {
    id: "builder-hut-l1-static-2026-08-10",
    status: EVIDENCE_STATUS.ACCEPTED,
    grade: EVIDENCE_GRADE.STATIC_REFERENCE,
    claimType: "static-parameter",
    mechanic: "building.builderHut.level1.nominalStats",
    source: {
      kind: "reference-table",
      publisher: "Clash of Clans Wiki",
      url: "https://clashofclans.fandom.com/wiki/Builder%27s_Hut",
      checkedAt: "2026-08-10",
    },
    observation: {
      values: { hitpoints: 250, footprint: [2, 2] },
    },
  },
  {
    id: "th7-gameplay-video-candidate-2026-04-12-darkbarbarian",
    status: EVIDENCE_STATUS.CANDIDATE,
    grade: EVIDENCE_GRADE.C_UNVERIFIED,
    claimType: "video-source-candidate",
    mechanic: "th7.generalGameplay",
    source: {
      kind: "video-discovery-page",
      publisher: "Dark BarBarian",
      url: "https://darkbarbarian.com/new-ultimate-th7-hybrid-trophy-defense-base-2026-townhall-7-hybrid-base-design-clash-of-clans/",
      publishedAt: "2026-04-12",
      note: "Page describes a 2026 TH7 base and references YouTube gameplay. The specific video/timestamps have not yet been frame-audited, so this record cannot promote any mechanic.",
    },
    observedPatch: null,
    observation: null,
  },
]);

export const EVIDENCE_REQUIREMENTS = Object.freeze({
  "attack.firstAttackDelayMs": {
    claimType: "temporal-parameter",
    requiredGrade: EVIDENCE_GRADE.A_CURRENT_PATCH,
    requiresFrameMeasurement: true,
  },
  "projectile.speedTilesPerSecond": {
    claimType: "temporal-parameter",
    requiredGrade: EVIDENCE_GRADE.A_CURRENT_PATCH,
    requiresFrameMeasurement: true,
  },
  "projectile.launchOffset": {
    claimType: "temporal-parameter",
    requiredGrade: EVIDENCE_GRADE.A_CURRENT_PATCH,
    requiresFrameMeasurement: true,
  },
  "projectile.persistsAfterSourceDeath": {
    claimType: "behavioral-invariant",
    allowedGrades: [EVIDENCE_GRADE.A_CURRENT_PATCH, EVIDENCE_GRADE.B_HISTORICAL_INVARIANT],
    historicalRequiresPatchContinuityReview: true,
  },
  "projectile.persistsAfterTargetDeath": {
    claimType: "behavioral-invariant",
    allowedGrades: [EVIDENCE_GRADE.A_CURRENT_PATCH, EVIDENCE_GRADE.B_HISTORICAL_INVARIANT],
    historicalRequiresPatchContinuityReview: true,
  },
  "event.sameTimestampResolution": {
    claimType: "behavioral-invariant",
    allowedGrades: [EVIDENCE_GRADE.A_CURRENT_PATCH, EVIDENCE_GRADE.B_HISTORICAL_INVARIANT],
    historicalRequiresPatchContinuityReview: true,
  },
});

export function evidenceById(id) {
  return MECHANICS_EVIDENCE.find(record => record.id === id) || null;
}

export function summarizeEvidenceRegistry(records = MECHANICS_EVIDENCE) {
  const counts = { accepted: 0, candidate: 0, rejected: 0, video: 0, promotableVideo: 0 };
  for (const record of records) {
    if (record.status in counts) counts[record.status]++;
    if (["gameplay-video", "youtube-video"].includes(record.source?.kind)) counts.video++;
    if ([EVIDENCE_GRADE.A_CURRENT_PATCH, EVIDENCE_GRADE.B_HISTORICAL_INVARIANT].includes(record.grade) && record.status === EVIDENCE_STATUS.ACCEPTED) counts.promotableVideo++;
  }
  return counts;
}
