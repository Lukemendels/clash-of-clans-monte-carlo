# Mechanics Evidence Registry

Basecracker treats gameplay footage as empirical evidence, not as executable mechanics by default.

The governing rule is:

> Evidence may be collected cheaply. Promotion into the deterministic kernel must be conservative.

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

Use Grade A for numeric temporal calibration. A timing record must include source FPS, start/end frames, the derived interval, and at least one source-frame of measurement uncertainty.

### B — historical invariant

Older gameplay clearly demonstrates a qualitative mechanic or causal rule. Before promotion, the record must include an explicit review that no known intervening patch changed that mechanic.

Grade B may establish behavior such as "an already-launched projectile persists after its source dies." It must not be used to infer current numeric timing merely because the old animation looks similar.

### C — unverified

A useful source candidate that has not yet been frame-audited, patch-classified, or continuity-reviewed. Grade C records can never enter authoritative mechanics.

### Static reference

Wiki/reference/official records for nominal values. These are separate from gameplay-video grades and retain their own provenance in the combat ruleset.

## Current patch baseline

The registry baseline for the 2026-08-10 audit is Supercell's July 9, 2026 **July Balance Update**.

A newer Supercell gameplay/balance update invalidates the assumption that Grade A video still represents the current patch until the baseline is advanced and affected evidence is reviewed.

## Video record shape

A future accepted observation should look approximately like:

```js
{
  id: "wizard-l4-first-shot-2026-08-xx-video-id",
  status: "accepted",
  grade: "A-current-patch",
  claimType: "temporal-parameter",
  mechanic: "attack.firstAttackDelayMs",
  source: {
    kind: "youtube-video",
    url: "https://www.youtube.com/watch?v=...",
    title: "...",
    channel: "...",
    publishedAt: "2026-08-01"
  },
  observedPatch: "patch-2026-07-09-july-balance-update",
  clip: {
    startSeconds: 123.4,
    endSeconds: 124.1,
    note: "Wizard enters firing state and first projectile impacts isolated target."
  },
  measurement: {
    fps: 60,
    startFrame: 7404,
    endFrame: 7422,
    durationMs: 300,
    uncertaintyMs: 16.666667
  },
  observation: { valueMs: 300 }
}
```

The numbers above are schema examples only. They are not Clash mechanics.

## Promotion rules

`src/evidence/validate.js` is the authority for evidence promotion.

- Candidate or rejected records cannot promote mechanics.
- Numeric temporal parameters require Grade A current-patch gameplay footage plus a frame measurement.
- Grade A must identify the active patch baseline.
- Historical behavioral evidence requires Grade B plus explicit patch-continuity review.
- Evidence for an unregistered mechanic cannot be promoted until an evidence requirement is defined.
- The validator rejects claimed timing precision finer than the source video's frame duration.

## Research loop

1. Identify an unresolved mechanic in `src/rulesets/th7-combat.js`.
2. Search recent gameplay video first.
3. Add useful sources as Grade C candidates.
4. Select a clip where the relevant interaction is visually isolated enough to measure.
5. Determine patch provenance and source frame rate.
6. Record frames/timestamps and the observation without interpreting beyond what the pixels establish.
7. Classify A or B.
8. Run the evidence validator.
9. Only then copy/promote the resolved value or behavior into the versioned combat ruleset and add a golden regression fixture.

## Current research queue

The first full interaction target remains **Wizard L4 versus Cannon at TH7**, because it can exercise two independent ranged attack state machines and projectile-in-flight/death races.

Highest-priority unresolved mechanics:

1. Wizard attack wind-up / first projectile launch timing.
2. Cannon attack wind-up / first projectile launch timing.
3. Wizard projectile flight behavior and speed.
4. Cannon projectile flight behavior and speed.
5. Projectile persistence after source death.
6. Same-timestamp damage/death resolution.
7. Destruction-to-retarget delay.

No value should be filled merely to make that fixture run.
