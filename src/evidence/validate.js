import { CURRENT_PATCH_BASELINE, EVIDENCE_GRADE, EVIDENCE_STATUS, EVIDENCE_REQUIREMENTS } from "./registry.js";

export function validateEvidenceRecord(record) {
  const errors = [];
  if (!record || typeof record !== "object") return { valid:false, errors:["Evidence record must be an object."] };
  if (!nonEmpty(record.id)) errors.push("id is required.");
  if (!Object.values(EVIDENCE_STATUS).includes(record.status)) errors.push(`Unsupported status: ${record.status}`);
  if (!Object.values(EVIDENCE_GRADE).includes(record.grade)) errors.push(`Unsupported grade: ${record.grade}`);
  if (!nonEmpty(record.claimType)) errors.push("claimType is required.");
  if (!nonEmpty(record.mechanic)) errors.push("mechanic is required.");
  if (!record.source || !nonEmpty(record.source.kind) || !nonEmpty(record.source.url)) errors.push("source.kind and source.url are required.");

  const isGameplayVideo=["gameplay-video","youtube-video"].includes(record.source?.kind);
  if (isGameplayVideo) {
    if (!isYouTubeUrl(record.source.url)) errors.push("Gameplay video source must be a YouTube URL.");
    if (!nonEmpty(record.source.publishedAt)) errors.push("Gameplay video requires source.publishedAt.");
    if (record.grade === EVIDENCE_GRADE.A_CURRENT_PATCH) {
      if (!record.patchVerification || !nonEmpty(record.patchVerification.basis)) errors.push("Grade A gameplay video requires patchVerification.basis; publication date alone is not patch proof.");
    }
    if (record.grade === EVIDENCE_GRADE.B_HISTORICAL_INVARIANT && record.patchContinuityReviewed === true && !nonEmpty(record.patchContinuityNote)) {
      errors.push("Grade B continuity review requires patchContinuityNote.");
    }
  }

  if (record.measurement) {
    const m = record.measurement;
    if (!(Number(m.fps) > 0)) errors.push("measurement.fps must be positive.");
    if (!Number.isInteger(m.startFrame) || !Number.isInteger(m.endFrame) || m.endFrame < m.startFrame) errors.push("measurement frame range is invalid.");
    if (Number.isFinite(m.fps) && Number.isInteger(m.startFrame) && Number.isInteger(m.endFrame) && m.endFrame >= m.startFrame) {
      const derived = measurementFromFrames(m);
      if (m.durationMs != null && Math.abs(Number(m.durationMs) - derived.durationMs) > 0.001) errors.push("measurement.durationMs does not match frame range/fps.");
      if (m.uncertaintyMs != null && Number(m.uncertaintyMs) + 1e-9 < derived.minimumUncertaintyMs) errors.push("measurement.uncertaintyMs is smaller than one source frame.");
    }
  }

  return { valid:errors.length===0, errors };
}

export function validateEvidenceRegistry(records) {
  const errors = [];
  const ids = new Set();
  for (const record of records || []) {
    const result = validateEvidenceRecord(record);
    if (!result.valid) errors.push(...result.errors.map(error=>`${record?.id || "<unknown>"}: ${error}`));
    if (ids.has(record?.id)) errors.push(`Duplicate evidence id: ${record.id}`);
    if (record?.id) ids.add(record.id);
  }
  return { valid:errors.length===0, errors };
}

/**
 * Decide whether an evidence record may supply an authoritative mechanic.
 * This function is deliberately conservative: collection != promotion.
 */
export function canPromoteEvidence(record, mechanicKey) {
  const validation = validateEvidenceRecord(record);
  if (!validation.valid) return { promotable:false, reasons:validation.errors };
  if (record.status !== EVIDENCE_STATUS.ACCEPTED) return { promotable:false, reasons:["Evidence is not accepted."] };

  const requirement = EVIDENCE_REQUIREMENTS[mechanicKey];
  if (!requirement) return { promotable:false, reasons:[`No evidence requirement is registered for ${mechanicKey}.`] };
  if (record.claimType !== requirement.claimType) return { promotable:false, reasons:[`Claim type ${record.claimType} does not satisfy ${requirement.claimType}.`] };

  if (requirement.requiredGrade && record.grade !== requirement.requiredGrade) {
    return { promotable:false, reasons:[`Mechanic requires ${requirement.requiredGrade}.`] };
  }
  if (requirement.allowedGrades && !requirement.allowedGrades.includes(record.grade)) {
    return { promotable:false, reasons:[`Evidence grade ${record.grade} is not allowed for this mechanic.`] };
  }
  if (requirement.requiresFrameMeasurement && !record.measurement) {
    return { promotable:false, reasons:["Current-patch frame measurement is required."] };
  }
  if (record.grade === EVIDENCE_GRADE.A_CURRENT_PATCH) {
    if (record.observedPatch !== CURRENT_PATCH_BASELINE.id) return { promotable:false, reasons:[`Grade A evidence must identify current patch ${CURRENT_PATCH_BASELINE.id}.`] };
    if (!record.patchVerification || !nonEmpty(record.patchVerification.basis)) return { promotable:false, reasons:["Grade A evidence requires explicit patch-verification basis."] };
  }
  if (record.grade === EVIDENCE_GRADE.B_HISTORICAL_INVARIANT && requirement.historicalRequiresPatchContinuityReview) {
    if (record.patchContinuityReviewed !== true) return { promotable:false, reasons:["Historical invariant requires explicit patch-continuity review."] };
    if (!nonEmpty(record.patchContinuityNote)) return { promotable:false, reasons:["Historical invariant requires a written patch-continuity rationale."] };
  }

  return { promotable:true, reasons:[] };
}

export function measurementFromFrames({ startFrame, endFrame, fps }) {
  const frameMs = 1000 / Number(fps);
  return {
    startFrame,
    endFrame,
    fps:Number(fps),
    frameDurationMs:round(frameMs),
    durationMs:round((endFrame-startFrame)*frameMs),
    minimumUncertaintyMs:round(frameMs),
  };
}

export function makeVideoEvidenceTemplate(overrides = {}) {
  return {
    id: overrides.id || "replace-with-stable-id",
    status: overrides.status || EVIDENCE_STATUS.CANDIDATE,
    grade: overrides.grade || EVIDENCE_GRADE.C_UNVERIFIED,
    claimType: overrides.claimType || "temporal-parameter",
    mechanic: overrides.mechanic || "attack.firstAttackDelayMs",
    source: {
      kind: "youtube-video",
      url: overrides.url || "https://www.youtube.com/watch?v=REPLACE_ME",
      title: overrides.title || "",
      channel: overrides.channel || "",
      publishedAt: overrides.publishedAt || "",
    },
    observedPatch: overrides.observedPatch ?? null,
    patchVerification: overrides.patchVerification ?? null,
    patchContinuityReviewed: overrides.patchContinuityReviewed ?? false,
    patchContinuityNote: overrides.patchContinuityNote || "",
    clip: {
      startSeconds: overrides.startSeconds ?? null,
      endSeconds: overrides.endSeconds ?? null,
      note: overrides.note || "",
    },
    measurement: overrides.measurement ?? null,
    observation: overrides.observation ?? null,
  };
}

function isYouTubeUrl(value) {
  try {
    const host = new URL(value).hostname.replace(/^www\./,"");
    return host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com");
  } catch { return false; }
}
function nonEmpty(value){ return typeof value === "string" && value.trim().length>0; }
function round(value){ return Number(Number(value).toFixed(6)); }
