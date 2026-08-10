import { STRUCTURE_CATALOG, sanitizeBase } from "./model.js";
import { buildReviewPrompt } from "./dossier.js";
import { projectionFromCanvas, screenToTile } from "./projection.js";

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_CALIBRATION = { centerX:0.5, topY:0.17, gridWidth:0.78, gridHeight:0.62 };

export async function extractBaseWithGemini({ apiKey, model="gemini-3.6-flash", thinkingLevel="high", annotatedImageDataUrl, townHall=10 }) {
  requireKey(apiKey);
  const { mimeType, data } = splitDataUrl(annotatedImageDataUrl);
  const allowed = allowedTypesForTownHall(townHall);

  const prompt = `
# Role
You are performing visual object detection on a Clash of Clans war-base screenshot for a tactical simulator.

# Critical rule
DO NOT infer or output logical Clash tile coordinates. The application will compute tile coordinates deterministically from your image-space detections.

# What is in the image
The actual Clash screenshot may have a thin blue 44x44 isometric workbench grid drawn over it. It may also have semi-transparent colored circular labels from an earlier reconstruction. Those grid lines and labels are NOT game objects. Ignore them completely.
Also ignore game UI such as player-name text, war-map buttons, arrows, banners, timers, and boundary scenery.

# Task
Detect visible buildings and defenses on the playable grass/base area only.
For every detected structure, return:
- type: one of the allowed canonical types below
- box_2d: [ymin, xmin, ymax, xmax], normalized 0..1000 over the ENTIRE input image
- anchor_2d: [y, x], normalized 0..1000, representing the center of the structure's footprint where it meets the ground plane, NOT the visual center of tall artwork
- confidence: 0..1 for the classification
- notes: short only when genuinely useful

# Classification constraints
Operator-supplied Town Hall: ${townHall}.
Allowed canonical types for this Town Hall: ${allowed.join(", ")}.
- Detect each visible structure once.
- Prefer omission over guessing. If you cannot distinguish two defense classes, use generic rather than inventing certainty.
- Do not invent hidden Teslas or traps.
- Do not use the overlaid grid to guess coordinates; only use it as something to ignore visually.
- Do not return walls in this pass. Walls will use a separate reconstruction path.
- Concentrate on tactically important defenses, Town Hall, Clan Castle, then obvious resource/support buildings.
- The anchor point matters more than the exact bounding-box edges.

# Sanity check before answering
The returned anchors should be spatially distributed across the actual visible base wherever buildings are distributed. Do not collapse unrelated structures toward the image center.
`;

  const schema = {
    type:"object",
    properties:{
      observedTownHall:{type:"integer"},
      townHallConfidence:{type:"number"},
      notes:{type:"string"},
      detections:{type:"array",items:{type:"object",properties:{
        type:{type:"string",enum:allowed},
        box_2d:{type:"array",items:{type:"integer"}},
        anchor_2d:{type:"array",items:{type:"integer"}},
        confidence:{type:"number"},
        notes:{type:"string"}
      },required:["type","box_2d","anchor_2d","confidence","notes"]}}
    },required:["observedTownHall","townHallConfidence","notes","detections"]
  };

  const payload = {
    contents:[{parts:[
      {text:prompt},
      {inlineData:{mimeType,data},mediaResolution:{level:"MEDIA_RESOLUTION_HIGH"}}
    ]}],
    generationConfig:{
      // Extraction is a perception task. Keep tactical/reviewer thinking separate.
      thinkingConfig:{thinkingLevel:"minimal"},
      mediaResolution:"MEDIA_RESOLUTION_HIGH",
      temperature:0.15,
      responseMimeType:"application/json",
      responseSchema:schema
    }
  };

  const response = await callGenerateContent({apiKey,model,payload});
  const parsed = JSON.parse(responseText(response));
  const { width, height } = await imageDimensions(annotatedImageDataUrl);
  const calibration = loadCalibration();
  return detectionsToBase(parsed,{width,height,calibration,townHall});
}

export function detectionsToBase(parsed,{width,height,calibration=DEFAULT_CALIBRATION,townHall=10}) {
  const projection = projectionFromCanvas({width,height},calibration);
  const structures = [];
  const allowed = new Set(allowedTypesForTownHall(townHall));

  for (const d of Array.isArray(parsed?.detections) ? parsed.detections : []) {
    if (!allowed.has(d?.type)) continue;
    const anchor = validPair(d.anchor_2d) ? d.anchor_2d : fallbackAnchor(d.box_2d);
    if (!anchor) continue;

    const sy = clamp(Number(anchor[0]),0,1000) / 1000 * height;
    const sx = clamp(Number(anchor[1]),0,1000) / 1000 * width;
    const tileCenter = screenToTile(sx,sy,projection);
    const spec = STRUCTURE_CATALOG[d.type] || STRUCTURE_CATALOG.generic;
    const x = tileCenter.x - spec.size/2;
    const y = tileCenter.y - spec.size/2;

    // Reject detections whose ground anchor lies materially outside the calibrated base plane.
    if (tileCenter.x < -2 || tileCenter.y < -2 || tileCenter.x > 46 || tileCenter.y > 46) continue;

    structures.push({
      type:d.type,
      x,
      y,
      size:spec.size,
      confidence:clamp(Number(d.confidence)||0,0,1),
      notes:[
        d.notes || "",
        `vision anchor=${Math.round(anchor[1])},${Math.round(anchor[0])}`,
        validBox(d.box_2d) ? `box=${d.box_2d.map(v=>Math.round(Number(v))).join(",")}` : ""
      ].filter(Boolean).join(" · ")
    });
  }

  const observed = Number(parsed?.observedTownHall);
  const observedNote = Number.isFinite(observed)
    ? `Gemini visual TH estimate: ${observed} (${Math.round(clamp(Number(parsed?.townHallConfidence)||0,0,1)*100)}% confidence). Operator TH ${townHall} remains authoritative.`
    : `Operator TH ${townHall} remains authoritative.`;

  return sanitizeBase({
    meta:{
      townHall,
      name:"Screenshot reconstruction",
      notes:[parsed?.notes || "", observedNote, "Vision used image-space detection; tile coordinates were assigned deterministically from the calibrated isometric projection."].filter(Boolean).join(" ")
    },
    structures
  });
}

export async function reviewDossierWithGemini({ apiKey, model="gemini-3.6-flash", thinkingLevel="high", dossier }) {
  requireKey(apiKey);
  const schema = {
    type:"object",
    properties:{
      verdict:{type:"string"},
      confidence:{type:"string",enum:["low","medium","high"]},
      failureModes:{type:"array",items:{type:"string"}},
      patch:{type:"object",properties:{
        strategy:{type:["string","null"]}, angle:{type:["number","null"]}, offset:{type:["number","null"]},
        corridorWidth:{type:["number","null"]}, funnelBias:{type:["number","null"]}, spellDepth:{type:["number","null"]},
        reserve:{type:["number","null"]}, abilityTempo:{type:["number","null"]}
      }},
      contingencies:{type:"array",items:{type:"string"}},
      rationale:{type:"string"}
    },required:["verdict","confidence","failureModes","patch","contingencies","rationale"]
  };
  const payload = {
    contents:[{parts:[{text:buildReviewPrompt(dossier)}]}],
    generationConfig:{
      thinkingConfig:{thinkingLevel},
      responseMimeType:"application/json",
      responseSchema:schema
    }
  };
  const response = await callGenerateContent({apiKey,model,payload});
  return JSON.parse(responseText(response));
}

function allowedTypesForTownHall(townHall) {
  const th = Number(townHall) || 10;
  const types = [
    "town_hall","cannon","archer_tower","wizard_tower","air_defense","mortar","xbow","inferno","bomb_tower",
    "clan_castle","builder_hut","storage","collector","barracks","generic"
  ];
  if (th >= 11) types.push("eagle");
  if (th >= 13) types.push("scattershot");
  if (th >= 15) types.push("monolith","spell_tower");
  return types;
}

function loadCalibration(){
  try {
    const saved = JSON.parse(localStorage.getItem("cocmc-calibration") || "null");
    return saved && typeof saved === "object" ? {...DEFAULT_CALIBRATION,...saved} : DEFAULT_CALIBRATION;
  } catch { return DEFAULT_CALIBRATION; }
}

function imageDimensions(url){
  return new Promise((resolve,reject)=>{
    const image = new Image();
    image.onload=()=>resolve({width:image.naturalWidth||image.width,height:image.naturalHeight||image.height});
    image.onerror=()=>reject(new Error("Could not read reconstruction image dimensions."));
    image.src=url;
  });
}

function fallbackAnchor(box){
  if(!validBox(box)) return null;
  const [ymin,xmin,ymax,xmax]=box.map(Number);
  return [ymin+(ymax-ymin)*0.72,(xmin+xmax)/2];
}
function validPair(v){return Array.isArray(v)&&v.length>=2&&v.slice(0,2).every(x=>Number.isFinite(Number(x)));}
function validBox(v){return Array.isArray(v)&&v.length>=4&&v.slice(0,4).every(x=>Number.isFinite(Number(x)));}

async function callGenerateContent({apiKey,model,payload}) {
  const res = await fetch(`${API_ROOT}/${encodeURIComponent(model)}:generateContent`, {
    method:"POST",
    headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
    body:JSON.stringify(payload)
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API ${res.status}: ${body.slice(0,900)}`);
  }
  return res.json();
}

function responseText(response) {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  const text = parts.filter(p=>!p.thought && typeof p.text === "string").map(p=>p.text).join("");
  if (!text) throw new Error("Gemini returned no text result.");
  return text;
}
function splitDataUrl(url){ const m=/^data:([^;]+);base64,(.+)$/.exec(url||""); if(!m)throw new Error("Expected a base64 image data URL."); return {mimeType:m[1],data:m[2]}; }
function requireKey(key){ if(!key || key.trim().length<10) throw new Error("Enter a Gemini API key in Settings first."); }
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
