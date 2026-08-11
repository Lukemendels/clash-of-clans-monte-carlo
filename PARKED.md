# Basecracker — Parked

**Status:** Parked intentionally  
**Parked:** 2026-08-11  
**Reason:** The proof of concept is complete enough to establish the architecture, while the next fidelity step would require a sustained empirical video-data/vision pipeline that is not currently worth the operator attention it would consume.

## Decision

Basecracker is being frozen here rather than pushed through to a full high-fidelity Clash of Clans combat simulator.

This is not a technical dead end and not a failed project. The remaining problem is tractable in principle, but the current route requires too much human research, smoke testing, media acquisition, annotation, correction, and mechanics adjudication for a hobby/proof-of-concept project.

The governing focus rule is:

> Continue only if the project can be advanced largely autonomously, with the machine grinding through the evidence loop and the human handling only rare high-information exceptions.

Until that condition is true, additional work is deferred.

## What the project proved

The current repository demonstrates that a game-analysis system can be decomposed into explicit authority layers:

- A legal Clash base can be represented as deterministic structured state rather than inferred from a screenshot.
- Town Hall legality can be enforced with versioned inventory, level, footprint, bounds, and overlap rules.
- Combat mechanics can be separated from UI state and stored as provenance-bearing ruleset data.
- Unknown mechanics can remain explicitly unresolved instead of being replaced with plausible guesses.
- A deterministic combat kernel can emit replayable event traces from verified mechanics.
- Monte Carlo search can be architected as variation over policies/worlds while each individual world is resolved deterministically.
- Gameplay footage can be treated as empirical mechanics evidence with patch provenance, frame/PTS measurements, uncertainty, and promotion gates.
- ML/vision belongs in perception and annotation assistance; deterministic software should perform the actual measurements and combat resolution.
- Machine cognition can later sit outside the truth layer as a search driver over exact traces.

That is sufficient to establish the proof-of-concept thesis without recreating the entire Supercell combat engine.

## Current implemented state

### Basecracker PWA

- TH7-first authoritative base builder.
- Deterministic legality validation.
- Full max-inventory TH7 demo.
- Versioned TH7 legality ruleset.
- Partial provenance-bearing TH7 combat ruleset.
- Verified nominal records for Wizard L4, Cannon L8, and Builder Hut L1.
- First deterministic repeated-impact golden fixture: Wizard L4 → Builder Hut L1.
- Legacy proxy Monte Carlo harness retained only as scaffolding; its outputs are explicitly not Clash probabilities.

### Mechanics evidence layer

- Evidence registry with static, Grade A, Grade B, and Grade C classifications.
- Patch-baseline and provenance model.
- Promotion rules for numeric timing and historical behavioral invariants.
- Explicit evidence blockers for unresolved Wizard/Cannon temporal and projectile mechanics.
- Regression tests preventing unsourced timing/physics values from silently entering the exact ruleset.

### Basecracker Evidence Lab

A separate local tool exists for:

- local gameplay-video ingest;
- SHA-256 media binding;
- ffprobe native-frame/PTS indexing;
- exact-frame inspection;
- event annotation;
- deterministic timestamp measurement;
- candidate evidence export.

Evidence Lab intentionally does not promote its own observations into authoritative mechanics.

## Where development stopped

The next full golden interaction was intended to be:

**Wizard L4 ↔ Cannon L8**

Nominal HP, damage, range, and attack cadence are recorded. The full interaction remains blocked on empirical temporal/causal mechanics, including:

- attack wind-up / first-shot timing;
- projectile launch frame;
- projectile flight speed and behavior;
- projectile persistence after source death;
- target-death projectile behavior;
- same-timestamp damage/death resolution;
- destruction-to-retarget timing;
- eventually spatial calibration from pixels to Clash tile/world coordinates.

The technically attractive route was to build an automated data engine:

`video discovery → attack segmentation → foundation-model pseudo-labeling → tracking → deterministic measurement → cross-video evidence synthesis → versioned mechanics`

That route is intentionally not being pursued now because the current generation of tooling would still leave too much operator work in acquisition, validation, correction, and exception handling.

## Why it is parked

Basecracker is a game/hobby project and an AI proof of concept. It is not currently important enough to justify a large empirical data-engineering program.

The highest-risk failure mode is not inability to build the system. It is successfully building an increasingly sophisticated research pipeline that absorbs large amounts of attention while providing relatively little additional value beyond the proof already established.

The project therefore stops before that point.

## Resume conditions

Reopen Basecracker only when at least one of these materially changes the economics of the remaining work:

1. **Passive video understanding becomes reliable.** A frontier vision/video model can ingest gameplay and emit usable object/event tracks with little or no manual correction.
2. **The evidence loop becomes agentically autonomous.** Tooling can discover/acquire permitted video, classify patch provenance, extract attacks, generate tracks, perform measurements, cross-check observations, and surface only exceptional cases for review.
3. **Inference becomes cheap enough for brute-force verification.** Multiple independent vision passes and consistency checks can be run cheaply enough that human review becomes rare.
4. **A sufficiently complete mechanics dataset or simulator appears publicly.** The empirical reconstruction problem becomes mostly an integration task.
5. **A much simpler route to exact Monte Carlo attack search appears.** The project can reach the interesting counterfactual-search layer without first rebuilding most of the game engine by hand.

A useful practical threshold is:

> If the next meaningful milestone still requires routine manual downloading, labeling, frame correction, or repeated smoke testing by the operator, keep the project parked.

## Restart point

If resumed, do not restart from screenshot reconstruction or from the legacy proxy Monte Carlo.

Resume from the existing deterministic architecture:

1. Preserve authoritative TH7 base state and legality.
2. Preserve the provenance/evidence gates.
3. Automate the gameplay-data pipeline first.
4. Promote only evidence-backed temporal/physics mechanics.
5. Complete Wizard L4 ↔ Cannon L8 as the first two-sided projectile race.
6. Expand the event kernel from micro-interactions toward a full TH7 attack.
7. Replace the proxy Monte Carlo only after the deterministic kernel is trustworthy.
8. Add AI later as a driver over exact trace/search loops, not as combat authority.

## Final project state

**Parked by choice. Option preserved.**

The project has already demonstrated the core idea: explicit world state + provenance-bearing mechanics + deterministic simulation + counterfactual search is a viable architecture for turning machine cognition into manufactured gameplay experience.

Further fidelity is waiting for the cost of machine perception and autonomous evidence processing to fall.