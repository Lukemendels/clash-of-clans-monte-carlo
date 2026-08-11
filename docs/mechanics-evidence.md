# Mechanics Evidence Registry

Basecracker treats gameplay footage as empirical evidence, not as executable mechanics by default.

The governing rule is:

> Evidence may be collected cheaply. Promotion into the deterministic kernel must be conservative.

## Evidence Lab

`evidence-lab/` is the dedicated local software for producing video evidence. It is separate from the Basecracker PWA.

Its v0.1 pipeline is:

`local video bytes → SHA-256 → ffprobe decoded-frame timestamps → exact-frame ffmpeg inspection → human event annotations → deterministic PTS measurement → candidate evidence packet`

Run it from the repository root with:

```bash
npm run evidence-lab
```

and open `http://127.0.0.1:8765`.

Evidence Lab deliberately exports only `candidate / C-unverified` packets. A separate review/promotion action is required before any observation becomes an authoritative mechanic.

### Timing authority

Frame number identifies an image; it is not the authoritative clock.

Evidence Lab measures time using decoded-frame timestamps reported by ffprobe. It does **not** compute timing as `frame count / nominal FPS`. This matters for variable-frame-rate media and for videos whose declared rate does not exactly match presentation timestamps.

The browser video element is a coarse navigation surface only. The exact inspector requests a specific decoded frame from the local server and ffmpeg extracts that decode-order frame from the original media.

Every candidate packet binds observations to the SHA-256 of the exact local video bytes plus codec/stream metadata and ffmpeg/ffprobe versions.

## Why video evidence exists

Published stat tables are sufficient for many nominal values such as hitpoints, damage per attack, attack interval, range, movement speed, and footprint. They are often insufficient for temporal and causal behavior that can change combat outcomes:

- target-acquisition delay;
- attack wind-up and launch frame;
- projectile speed and flight time;
- whether a launched projectile survives the source entity's death;
- whether a projectile tracks a moving target;
- destruction/retarget delay;
- same-timestamp event ordering;
- animation/state transitions that affect the next legal action.

Those mechanics should be derived from gameplay observations when they are not documented authoritatively.

## Evidence grades

### A — current patch

Gameplay video is known to represent the current mechanics baseline, and the specific clip has been frame-audited.

Use Grade A for numeric temporal calibration. A timing record must include source/decoded timing evidence, start/end frames, the derived interval, and measurement uncertainty.

Publication date alone is not sufficient patch proof. The record must explain why the observed gameplay belongs to the claimed patch.

### B — historical invariant

Older gameplay clearly demonstrates a qualitative mechanic or causal rule. Before promotion, the record must include an explicit review that no known intervening patch changed that mechanic, plus a written continuity rationale.

Grade B may establish behavior such as "an already-launched projectile persists after its source dies." It must not be used to infer current numeric timing merely because the old animation looks similar.

### C — unverified

A useful source candidate that has not yet been frame-audited, patch-classified, or continuity-reviewed. Grade C records can never enter authoritative mechanics.

### Static reference

Wiki/reference/official records for nominal values. These are separate from gameplay-video grades and retain their own provenance in the combat ruleset.

## Current patch baseline

The registry baseline for the 2026-08-10 audit is Supercell's July 9, 2026 **July Balance Update**.

A newer Supercell gameplay/balance update invalidates the assumption that Grade A video still represents the current patch until the baseline is advanced and affected evidence is reviewed.

## Evidence Lab packet

Evidence Lab exports `basecracker-mechanics-evidence/v1`. A packet contains:

- source URL/title/channel/date where known;
- SHA-256 of the exact media bytes;
- stream/codec/dimensions/time-base metadata;
- ffmpeg/ffprobe versions;
- attacker, target, and interaction context;
- observed patch and verification rationale;
- exact event annotations as frame index + PTS;
- deterministic PTS measurements;
- notes and continuity-review fields.

A packet is intentionally richer than the eventual promoted registry entry. Promotion should extract the smallest claim supported by the evidence rather than copying an entire video session into the ruleset.

## Promotion rules

`src/evidence/validate.js` is the authority for evidence promotion.

- Candidate or rejected records cannot promote mechanics.
- Numeric temporal parameters require Grade A current-patch gameplay footage plus a frame measurement.
- Grade A must identify the active patch baseline and provide explicit patch-verification basis.
- Historical behavioral evidence requires Grade B plus explicit patch-continuity review and rationale.
- Evidence for an unregistered mechanic cannot be promoted until an evidence requirement is defined.
- Claimed timing precision cannot outrun the decoded video evidence.

## Research loop

1. Identify an unresolved mechanic in `src/rulesets/th7-combat.js`.
2. Search recent gameplay video first.
3. Acquire a local media file through an allowed path and retain the source URL/metadata.
4. Load the media into Evidence Lab; record its SHA-256 and decoded frame index.
5. Select an interaction where the mechanic is visually isolatable.
6. Mark only directly observable causal events in exact frames.
7. Derive timing from PTS, not nominal FPS.
8. Record patch provenance and uncertainty.
9. Export a candidate evidence packet.
10. Review/classify the evidence as A/B/C.
11. Run the evidence validator.
12. Only then promote the resolved value/behavior into the versioned combat ruleset and add a golden regression fixture.

## Current research queue

The first full interaction target remains **Wizard L4 versus Cannon L8 at TH7**, because it can exercise two independent ranged attack state machines and projectile-in-flight/death races.

Highest-priority unresolved mechanics:

1. Wizard attack wind-up / first projectile launch timing.
2. Cannon attack wind-up / first projectile launch timing.
3. Wizard projectile flight behavior and speed.
4. Cannon projectile flight behavior and speed.
5. Projectile persistence after source death.
6. Same-timestamp damage/death resolution.
7. Destruction-to-retarget delay.

Evidence Lab v0.1 handles temporal annotations and durations. Pixel→battlefield spatial calibration is the next prerequisite before projectile speed in tiles/second can be promoted.

No value should be filled merely to make the Wizard ↔ Cannon fixture run.
