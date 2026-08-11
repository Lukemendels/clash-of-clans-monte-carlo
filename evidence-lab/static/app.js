import { buildEvidencePacket, measurementFromAnnotations, nearestFrameIndex } from "./core.js";

const $ = q => document.querySelector(q);
const $$ = q => [...document.querySelectorAll(q)];

let media = null;
let frames = [];
let currentFrame = 0;
let annotations = [];
let measurements = [];
let annotationCounter = 0;
let frameRequestToken = 0;

boot();

async function boot() {
  bind();
  await checkHealth();
  try {
    const state = await getJson("/api/state");
    if (state?.sha256) loadMediaState(state);
  } catch (error) {
    toast(error.message, true);
  }
  renderAll();
}

function bind() {
  $("#video-file").addEventListener("change", uploadVideo);
  $("#jump-player").onclick = () => {
    if (!media) return toast("Load a video first.", true);
    const index = nearestFrameIndex(frames, $("#video").currentTime || 0);
    if (index >= 0) setFrame(index);
  };
  $$("[data-step]").forEach(button => button.onclick = () => setFrame(currentFrame + Number(button.dataset.step)));
  $("#frame-number").addEventListener("change", event => setFrame(Number(event.target.value)));
  $("#frame-slider").addEventListener("input", debounce(event => setFrame(Number(event.target.value)), 50));
  $("#mark-frame").onclick = markCurrentFrame;
  $("#add-measurement").onclick = addMeasurement;
  $("#refresh-packet").onclick = renderPacket;
  $("#copy-packet").onclick = () => {
    const packet = makePacket();
    if (!packet) return;
    copyText(JSON.stringify(packet, null, 2), "Evidence packet copied.");
  };
  $("#download-packet").onclick = () => {
    const packet = makePacket();
    if (!packet) return;
    downloadJson(`basecracker-evidence-${media.sha256.slice(0, 12)}.json`, packet);
  };
  $("#video").addEventListener("loadedmetadata", () => {
    if (media) $("#video").currentTime = Number(frames[currentFrame]?.ptsSeconds || 0);
  });
}

async function checkHealth() {
  const el = $("#health");
  try {
    const health = await getJson("/api/health");
    el.textContent = "ffmpeg + ffprobe ready";
    el.title = `${health.ffmpeg}\n${health.ffprobe}`;
    el.classList.add("ok");
  } catch (error) {
    el.textContent = "ffmpeg/ffprobe unavailable";
    el.title = error.message;
  }
}

async function uploadVideo(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const status = $("#upload-status");
  status.textContent = `Uploading ${file.name}…`;
  try {
    const response = await fetch("/api/video", {
      method: "POST",
      headers: { "X-Filename": encodeURIComponent(file.name) },
      body: file,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `Upload failed (${response.status}).`);
    annotations = [];
    measurements = [];
    annotationCounter = 0;
    loadMediaState(payload);
    status.textContent = `Loaded ${file.name}.`;
    toast(`Indexed ${payload.decodedFrameCount.toLocaleString()} decoded frames.`);
  } catch (error) {
    status.textContent = error.message;
    toast(error.message, true);
  }
}

function loadMediaState(state) {
  media = state;
  frames = Array.isArray(state.frames) ? state.frames : [];
  currentFrame = 0;
  const video = $("#video");
  video.src = `/api/video?sha=${encodeURIComponent(state.sha256)}`;
  video.load();
  $("#frame-slider").max = Math.max(0, frames.length - 1);
  $("#frame-number").max = Math.max(0, frames.length - 1);
  setFrame(0);
  renderAll();
}

function setFrame(index) {
  if (!media || !frames.length) return;
  currentFrame = Math.max(0, Math.min(frames.length - 1, Math.round(Number(index) || 0)));
  $("#frame-number").value = currentFrame;
  $("#frame-slider").value = currentFrame;
  renderFrame();
}

function renderFrame() {
  if (!media || !frames.length) {
    $("#frame-meta").textContent = "Load a video.";
    return;
  }
  const frame = frames[currentFrame];
  const token = ++frameRequestToken;
  const image = $("#frame-image");
  image.style.opacity = ".45";
  image.onload = () => { if (token === frameRequestToken) image.style.opacity = "1"; };
  image.onerror = () => { if (token === frameRequestToken) toast(`Could not decode frame ${currentFrame}.`, true); };
  image.src = `/api/frame?index=${currentFrame}`;
  const pts = Number.isFinite(Number(frame.ptsSeconds)) ? `${(Number(frame.ptsSeconds) * 1000).toFixed(3)} ms` : "PTS unavailable";
  const duration = frameDurationMs(currentFrame);
  $("#frame-meta").textContent = `frame ${currentFrame} · ${pts} · duration ${duration == null ? "unknown" : `${duration.toFixed(3)} ms`} · ${frame.pictType || "?"}${frame.keyFrame ? " · keyframe" : ""}`;
}

function renderAll() {
  renderMediaSummary();
  renderAnnotations();
  renderMeasurements();
  renderPacket();
}

function renderMediaSummary() {
  const el = $("#media-summary");
  if (!media) { el.innerHTML = ""; return; }
  el.innerHTML = [
    `${media.width}×${media.height}`,
    `${media.decodedFrameCount.toLocaleString()} decoded frames`,
    `avg fps ${esc(media.avgFrameRate || "?")}`,
    `time base ${esc(media.timeBase || "?")}`,
    `${media.exactPtsCoverage ? "100% frame PTS" : `${media.framesWithMissingPts} frames missing PTS`}`,
    `SHA-256 ${media.sha256.slice(0, 16)}…`,
  ].map(value => `<span>${value}</span>`).join("");
}

function markCurrentFrame() {
  if (!media) return toast("Load a video first.", true);
  const frame = frames[currentFrame];
  const pts = Number(frame?.ptsSeconds);
  if (!Number.isFinite(pts)) return toast("This frame has no exact PTS and cannot be authoritative evidence.", true);
  const event = $("#event-type").value;
  annotationCounter += 1;
  annotations.push({
    id: `ann-${currentFrame}-${event}-${annotationCounter}`,
    event,
    label: $("#event-label").value.trim(),
    note: $("#event-note").value.trim(),
    frameIndex: currentFrame,
    ptsMs: round(pts * 1000),
    frameDurationMs: frameDurationMs(currentFrame),
  });
  annotations.sort((a, b) => a.ptsMs - b.ptsMs || a.frameIndex - b.frameIndex);
  renderAnnotations();
  renderMeasurements();
  renderPacket();
  toast(`Marked ${event} at frame ${currentFrame}.`);
}

function renderAnnotations() {
  const body = $("#annotation-table");
  if (!annotations.length) {
    body.innerHTML = `<tr><td colspan="4" class="muted">No events marked.</td></tr>`;
  } else {
    body.innerHTML = annotations.map(a => `<tr><td><button class="tiny secondary" data-jump-ann="${a.id}">${a.frameIndex}</button></td><td>${a.ptsMs.toFixed(3)} ms</td><td>${esc(a.label || a.event)}</td><td><button class="tiny secondary" data-delete-ann="${a.id}">×</button></td></tr>`).join("");
  }
  $$('[data-jump-ann]').forEach(button => button.onclick = () => {
    const ann = annotations.find(a => a.id === button.dataset.jumpAnn);
    if (ann) setFrame(ann.frameIndex);
  });
  $$('[data-delete-ann]').forEach(button => button.onclick = () => {
    const id = button.dataset.deleteAnn;
    annotations = annotations.filter(a => a.id !== id);
    measurements = measurements.filter(m => m.startAnnotationId !== id && m.endAnnotationId !== id);
    renderAnnotations(); renderMeasurements(); renderPacket();
  });
  const options = annotations.map(a => `<option value="${a.id}">${a.frameIndex} · ${esc(a.label || a.event)}</option>`).join("");
  $("#measurement-start").innerHTML = options;
  $("#measurement-end").innerHTML = options;
  if (annotations.length > 1) $("#measurement-end").value = annotations.at(-1).id;
}

function addMeasurement() {
  if (annotations.length < 2) return toast("Mark at least two events first.", true);
  const start = annotations.find(a => a.id === $("#measurement-start").value);
  const end = annotations.find(a => a.id === $("#measurement-end").value);
  try {
    const derived = measurementFromAnnotations(start, end);
    measurements.push({
      id: `measure-${measurements.length + 1}`,
      mechanic: $("#measurement-key").value.trim() || "custom.durationMs",
      ...derived,
    });
    renderMeasurements(); renderPacket();
    toast(`Measured ${derived.durationMs.toFixed(3)} ms from decoded PTS.`);
  } catch (error) {
    toast(error.message, true);
  }
}

function renderMeasurements() {
  const el = $("#measurement-list");
  if (!measurements.length) { el.innerHTML = `<p class="muted">No measurements yet.</p>`; return; }
  el.innerHTML = measurements.map(m => `<div class="measure"><strong>${esc(m.mechanic)} · ${m.durationMs.toFixed(3)} ms</strong><small>frames ${m.startFrame} → ${m.endFrame} · uncertainty ${m.uncertaintyMs == null ? "unresolved" : `≥ ${m.uncertaintyMs.toFixed(3)} ms`} · PTS clock</small><button class="tiny secondary" data-delete-measure="${m.id}">remove</button></div>`).join("");
  $$('[data-delete-measure]').forEach(button => button.onclick = () => {
    measurements = measurements.filter(m => m.id !== button.dataset.deleteMeasure);
    renderMeasurements(); renderPacket();
  });
}

function makePacket() {
  if (!media) { toast("Load a video first.", true); return null; }
  try {
    return buildEvidencePacket({
      media,
      source: {
        url: $("#source-url").value,
        title: $("#source-title").value,
        channel: $("#source-channel").value,
        publishedAt: $("#source-published").value,
      },
      interaction: {
        attacker: $("#attacker").value,
        target: $("#target").value,
        context: $("#interaction-context").value,
      },
      patch: {
        observedPatch: $("#observed-patch").value,
        verificationBasis: $("#patch-basis").value,
        continuityReviewed: $("#continuity-reviewed").checked,
        continuityNote: $("#continuity-note").value,
      },
      annotations,
      measurements,
      notes: $("#research-notes").value,
    });
  } catch (error) {
    toast(error.message, true);
    return null;
  }
}

function renderPacket() {
  const pre = $("#packet-preview");
  if (!media) { pre.textContent = "Load a video to begin."; return; }
  const packet = makePacket();
  if (packet) pre.textContent = JSON.stringify(packet, null, 2);
}

function frameDurationMs(index) {
  const frame = frames[index];
  const direct = Number(frame?.durationSeconds);
  if (Number.isFinite(direct) && direct > 0) return round(direct * 1000);
  const here = Number(frame?.ptsSeconds);
  const next = Number(frames[index + 1]?.ptsSeconds);
  if (Number.isFinite(here) && Number.isFinite(next) && next > here) return round((next - here) * 1000);
  const prev = Number(frames[index - 1]?.ptsSeconds);
  if (Number.isFinite(prev) && Number.isFinite(here) && here > prev) return round((here - prev) * 1000);
  return null;
}

async function getJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload;
}

async function copyText(text, message) {
  try { await navigator.clipboard.writeText(text); toast(message); }
  catch { toast("Clipboard unavailable.", true); }
}
function downloadJson(name, object) {
  const blob = new Blob([JSON.stringify(object, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 500);
}
function toast(message, error = false) {
  const el = $("#toast"); el.textContent = message; el.classList.toggle("error", error); el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 3600);
}
function debounce(fn, ms) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }; }
function esc(value) { return String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c])); }
function round(value) { return Number(Number(value).toFixed(6)); }
