import test from "node:test";
import assert from "node:assert/strict";
import { buildEvidencePacket, measurementFromAnnotations, nearestFrameIndex } from "../evidence-lab/static/core.js";

test("Evidence Lab chooses nearest decoded frame by PTS",()=>{
  const frames=[
    {index:0,ptsSeconds:0},
    {index:1,ptsSeconds:0.016},
    {index:2,ptsSeconds:0.041},
    {index:3,ptsSeconds:0.058},
  ];
  assert.equal(nearestFrameIndex(frames,0.039),2);
  assert.equal(nearestFrameIndex(frames,0.052),3);
});

test("measurement duration uses PTS rather than frame index divided by FPS",()=>{
  const start={id:"a",frameIndex:100,ptsMs:1900,frameDurationMs:16};
  const end={id:"b",frameIndex:109,ptsMs:2071,frameDurationMs:20};
  const result=measurementFromAnnotations(start,end);
  assert.equal(result.durationMs,171);
  assert.equal(result.startFrame,100);
  assert.equal(result.endFrame,109);
  assert.equal(result.clock,"decoded-frame-pts");
  assert.equal(result.uncertaintyMs,20);
});

test("measurement refuses annotations without exact timestamps",()=>{
  assert.throws(()=>measurementFromAnnotations(
    {id:"a",frameIndex:1,ptsMs:null},
    {id:"b",frameIndex:2,ptsMs:50}
  ),/exact PTS/);
});

test("evidence packet binds exact media and remains candidate",()=>{
  const packet=buildEvidencePacket({
    media:{
      sha256:"abc123",
      filename:"sample.mp4",
      bytes:1234,
      videoStreamIndex:0,
      codec:"h264",
      width:1920,
      height:1080,
      avgFrameRate:"60000/1001",
      realFrameRate:"60000/1001",
      timeBase:"1/90000",
      durationSeconds:10,
      decodedFrameCount:600,
      ffprobeVersion:"ffprobe test",
      ffmpegVersion:"ffmpeg test",
    },
    source:{url:"https://www.youtube.com/watch?v=example",title:"Example"},
    interaction:{attacker:"wizard:4",target:"cannon:8"},
    patch:{observedPatch:"patch-x",verificationBasis:"visible current-patch UI"},
    annotations:[],
    measurements:[],
  });
  assert.equal(packet.schema,"basecracker-mechanics-evidence/v1");
  assert.equal(packet.status,"candidate");
  assert.equal(packet.grade,"C-unverified");
  assert.equal(packet.media.sha256,"abc123");
  assert.equal(packet.promotion.automatic,false);
  assert.match(packet.media.timestampPolicy,/no index÷fps timing/);
});
