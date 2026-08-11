export function nearestFrameIndex(frames, seconds) {
  if (!Array.isArray(frames) || frames.length === 0) return -1;
  const target = Number(seconds);
  let lo = 0, hi = frames.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const t = Number(frames[mid].ptsSeconds);
    if (!Number.isFinite(t) || t < target) lo = mid + 1;
    else hi = mid;
  }
  const a = frames[lo];
  const b = frames[Math.max(0, lo - 1)];
  if (!b || !Number.isFinite(Number(b.ptsSeconds))) return lo;
  return Math.abs(Number(a.ptsSeconds) - target) < Math.abs(Number(b.ptsSeconds) - target) ? lo : lo - 1;
}

export function measurementFromAnnotations(start, end) {
  if (!start || !end) throw new Error("Both annotations are required.");
  const startMs = Number(start.ptsMs);
  const endMs = Number(end.ptsMs);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) throw new Error("Annotations require exact PTS values.");
  if (endMs < startMs) throw new Error("End annotation precedes start annotation.");

  const startUncertainty = positiveOrNull(start.frameDurationMs);
  const endUncertainty = positiveOrNull(end.frameDurationMs);
  const uncertaintyMs = Math.max(startUncertainty || 0, endUncertainty || 0) || null;

  return {
    startAnnotationId: start.id,
    endAnnotationId: end.id,
    startFrame: start.frameIndex,
    endFrame: end.frameIndex,
    startPtsMs: round(startMs),
    endPtsMs: round(endMs),
    durationMs: round(endMs - startMs),
    uncertaintyMs: uncertaintyMs == null ? null : round(uncertaintyMs),
    clock: "decoded-frame-pts",
  };
}

export function buildEvidencePacket({ media, source, interaction, patch, annotations, measurements, notes = "" }) {
  if (!media?.sha256) throw new Error("Loaded media SHA-256 is required.");
  if (!Array.isArray(annotations)) throw new Error("annotations must be an array.");
  if (!Array.isArray(measurements)) throw new Error("measurements must be an array.");

  return {
    schema: "basecracker-mechanics-evidence/v1",
    status: "candidate",
    grade: "C-unverified",
    createdAt: new Date().toISOString(),
    source: {
      kind: source?.url ? "youtube-video" : "local-video",
      url: clean(source?.url) || null,
      title: clean(source?.title) || null,
      channel: clean(source?.channel) || null,
      publishedAt: clean(source?.publishedAt) || null,
    },
    media: {
      sha256: media.sha256,
      filename: media.filename,
      bytes: media.bytes,
      videoStreamIndex: media.videoStreamIndex,
      codec: media.codec,
      width: media.width,
      height: media.height,
      avgFrameRate: media.avgFrameRate,
      realFrameRate: media.realFrameRate,
      timeBase: media.timeBase,
      durationSeconds: media.durationSeconds,
      decodedFrameCount: media.decodedFrameCount,
      ffprobeVersion: media.ffprobeVersion,
      ffmpegVersion: media.ffmpegVersion,
      timestampPolicy: "ffprobe decoded-frame best_effort_timestamp_time/pts_time; no index÷fps timing",
    },
    interaction: {
      attacker: clean(interaction?.attacker) || null,
      target: clean(interaction?.target) || null,
      context: clean(interaction?.context) || null,
    },
    patch: {
      observedPatch: clean(patch?.observedPatch) || null,
      verificationBasis: clean(patch?.verificationBasis) || null,
      continuityReviewed: Boolean(patch?.continuityReviewed),
      continuityNote: clean(patch?.continuityNote) || null,
    },
    annotations: annotations.map(a => ({
      id: a.id,
      event: a.event,
      label: a.label || null,
      frameIndex: a.frameIndex,
      ptsMs: a.ptsMs,
      frameDurationMs: a.frameDurationMs ?? null,
      note: a.note || null,
    })),
    measurements: measurements.map(m => ({ ...m })),
    notes: clean(notes) || null,
    promotion: {
      automatic: false,
      note: "Evidence Lab exports candidates only. Promotion into the combat ruleset remains a separate reviewed action.",
    },
  };
}

function positiveOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function clean(value) { return typeof value === "string" ? value.trim() : ""; }
function round(value) { return Number(Number(value).toFixed(6)); }
