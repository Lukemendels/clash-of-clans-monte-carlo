import test from "node:test";
import assert from "node:assert/strict";
import {
  CURRENT_PATCH_BASELINE,
  EVIDENCE_GRADE,
  EVIDENCE_STATUS,
  MECHANICS_EVIDENCE,
} from "../src/evidence/registry.js";
import {
  canPromoteEvidence,
  measurementFromFrames,
  validateEvidenceRegistry,
} from "../src/evidence/validate.js";

test("mechanics evidence registry validates",()=>{
  const result=validateEvidenceRegistry(MECHANICS_EVIDENCE);
  assert.equal(result.valid,true,JSON.stringify(result.errors,null,2));
});

test("frame measurement derives duration and source-frame uncertainty",()=>{
  const m=measurementFromFrames({startFrame:100,endFrame:109,fps:60});
  assert.equal(m.durationMs,150);
  assert.equal(m.minimumUncertaintyMs,16.666667);
});

test("candidate video cannot promote a mechanic",()=>{
  const record={
    id:"candidate",
    status:EVIDENCE_STATUS.CANDIDATE,
    grade:EVIDENCE_GRADE.A_CURRENT_PATCH,
    claimType:"temporal-parameter",
    mechanic:"attack.firstAttackDelayMs",
    source:{kind:"youtube-video",url:"https://www.youtube.com/watch?v=example",publishedAt:"2026-08-01"},
    observedPatch:CURRENT_PATCH_BASELINE.id,
    patchVerification:{basis:"Visible current-patch UI/content in the audited clip."},
    measurement:{startFrame:0,endFrame:9,fps:60,durationMs:150,uncertaintyMs:16.666667},
  };
  assert.equal(canPromoteEvidence(record,"attack.firstAttackDelayMs").promotable,false);
});

test("publication date alone is not current-patch proof",()=>{
  const record={
    id:"date-only",
    status:EVIDENCE_STATUS.ACCEPTED,
    grade:EVIDENCE_GRADE.A_CURRENT_PATCH,
    claimType:"temporal-parameter",
    mechanic:"attack.firstAttackDelayMs",
    source:{kind:"youtube-video",url:"https://www.youtube.com/watch?v=example",publishedAt:"2026-08-01"},
    observedPatch:CURRENT_PATCH_BASELINE.id,
    measurement:{startFrame:0,endFrame:18,fps:60,durationMs:300,uncertaintyMs:16.666667},
  };
  const result=canPromoteEvidence(record,"attack.firstAttackDelayMs");
  assert.equal(result.promotable,false);
  assert.match(result.reasons.join(" "),/patchVerification|patch-verification|publication date/i);
});

test("current-patch numeric timing requires frame measurement",()=>{
  const record={
    id:"no-frames",
    status:EVIDENCE_STATUS.ACCEPTED,
    grade:EVIDENCE_GRADE.A_CURRENT_PATCH,
    claimType:"temporal-parameter",
    mechanic:"attack.firstAttackDelayMs",
    source:{kind:"youtube-video",url:"https://youtu.be/example",publishedAt:"2026-08-01"},
    observedPatch:CURRENT_PATCH_BASELINE.id,
    patchVerification:{basis:"Visible current-patch UI/content in the audited clip."},
    observation:{valueMs:300},
  };
  const result=canPromoteEvidence(record,"attack.firstAttackDelayMs");
  assert.equal(result.promotable,false);
  assert.match(result.reasons.join(" "),/frame measurement/i);
});

test("accepted current-patch frame evidence can promote numeric timing",()=>{
  const record={
    id:"current-frames",
    status:EVIDENCE_STATUS.ACCEPTED,
    grade:EVIDENCE_GRADE.A_CURRENT_PATCH,
    claimType:"temporal-parameter",
    mechanic:"attack.firstAttackDelayMs",
    source:{kind:"youtube-video",url:"https://www.youtube.com/watch?v=example",publishedAt:"2026-08-01"},
    observedPatch:CURRENT_PATCH_BASELINE.id,
    patchVerification:{basis:"Visible current-patch UI/content in the audited clip."},
    measurement:{startFrame:100,endFrame:118,fps:60,durationMs:300,uncertaintyMs:16.666667},
    observation:{valueMs:300},
  };
  assert.equal(canPromoteEvidence(record,"attack.firstAttackDelayMs").promotable,true);
});

test("historical mechanics footage needs written continuity review",()=>{
  const base={
    id:"historical",
    status:EVIDENCE_STATUS.ACCEPTED,
    grade:EVIDENCE_GRADE.B_HISTORICAL_INVARIANT,
    claimType:"behavioral-invariant",
    mechanic:"projectile.persistsAfterSourceDeath",
    source:{kind:"youtube-video",url:"https://www.youtube.com/watch?v=example",publishedAt:"2020-01-01"},
    observedPatch:"historical-2020",
    observation:{value:true},
  };
  assert.equal(canPromoteEvidence(base,"projectile.persistsAfterSourceDeath").promotable,false);
  assert.equal(canPromoteEvidence({...base,patchContinuityReviewed:true},"projectile.persistsAfterSourceDeath").promotable,false);
  assert.equal(canPromoteEvidence({...base,patchContinuityReviewed:true,patchContinuityNote:"Reviewed patch history; no identified change to launched-projectile lifetime semantics."},"projectile.persistsAfterSourceDeath").promotable,true);
});
