import { STRUCTURE_CATALOG, sanitizeBase } from "./model.js";
import { buildReviewPrompt } from "./dossier.js";

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

export async function extractBaseWithGemini({ apiKey, model="gemini-3.6-flash", thinkingLevel="high", annotatedImageDataUrl, townHall=10 }) {
  requireKey(apiKey);
  const { mimeType, data } = splitDataUrl(annotatedImageDataUrl);
  const allowed = Object.keys(STRUCTURE_CATALOG).filter(x => x !== "wall");
  const prompt = `Analyze this Clash of Clans base screenshot. A 44x44 logical tile grid has been drawn over the screenshot. Reconstruct the VISIBLE base state. Coordinates x,y must be integer tile coordinates from 0 to 43 using the overlay: x increases along one diagonal axis and y along the other. Return building anchor coordinates at the approximate top-left logical tile of each footprint.\n\nTown Hall estimate supplied by operator: ${townHall}.\nAllowed structure types: ${allowed.join(", ")}.\nDo not invent hidden Teslas or traps; visible Tesla structures may be reported only if actually visible. Include walls only when you can infer a meaningful wall segment; wall coordinates may be sparse because the human can correct them. Prefer correct major defenses and Town Hall over exhaustive low-value buildings. Confidence is 0..1.`;

  const schema = {
    type:"object",
    properties:{
      townHall:{type:"integer"},
      notes:{type:"string"},
      structures:{type:"array",items:{type:"object",properties:{
        type:{type:"string",enum:[...allowed,"wall"]},
        x:{type:"integer"}, y:{type:"integer"},
        size:{type:"integer"}, confidence:{type:"number"}, notes:{type:"string"}
      },required:["type","x","y","confidence"]}}
    },required:["structures"]
  };

  const payload = {
    contents:[{parts:[{inline_data:{mime_type:mimeType,data}},{text:prompt}]}],
    generationConfig:{
      thinkingConfig:{thinkingLevel},
      responseFormat:{text:{mimeType:"application/json",schema}}
    }
  };
  const response = await callGenerateContent({apiKey,model,payload});
  const parsed = JSON.parse(responseText(response));
  return sanitizeBase({
    meta:{townHall:parsed.townHall || townHall, name:"Screenshot reconstruction", notes:parsed.notes || ""},
    structures:parsed.structures || []
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
      responseFormat:{text:{mimeType:"application/json",schema}}
    }
  };
  const response = await callGenerateContent({apiKey,model,payload});
  return JSON.parse(responseText(response));
}

async function callGenerateContent({apiKey,model,payload}) {
  const res = await fetch(`${API_ROOT}/${encodeURIComponent(model)}:generateContent`, {
    method:"POST",
    headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
    body:JSON.stringify(payload)
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API ${res.status}: ${body.slice(0,600)}`);
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
