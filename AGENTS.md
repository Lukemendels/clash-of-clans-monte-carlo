# AGENTS.md — repository operating contract

## Project status

**PARKED.** Read `PARKED.md` before proposing or implementing new work.

Do not resume Basecracker merely because an implementation path is available. Resume only when one of the objective conditions in `PARKED.md` materially changes the economics of the remaining evidence/perception work, or when the operator explicitly overrides the parked decision.

The August 11, 2026 upgrade-planner detour is not an active product direction. It is preserved on branch `archive/upgrade-planner-spike-2026-08-11` and was superseded after an existing tool satisfied the use case.

## Mission

Build an external, local-first Clash of Clans simulation laboratory that represents a legal base explicitly, reproduces combat deterministically, and searches counterfactual attacks only after the kernel is trustworthy.

## Architectural invariants

1. **Authoritative state is explicit.** Base identity, level, tile anchor, footprint, walls, traps, and markers come from validated state—not model inference.
2. **No guessed combat mechanics.** Every value required by exact simulation must be verified, derived with recorded provenance, or remain unresolved.
3. **Unresolved mechanics block dependent features.** Do not substitute plausible timing, HP, damage, targeting, pathing, projectile, or movement values.
4. **Combat resolution is deterministic.** Same state + same actions + same explicit random seed, where randomness is legitimately modeled, must produce the same ordered event trace.
5. **Monte Carlo varies worlds and policies, not combat truth.** Each sampled world is resolved by the deterministic kernel.
6. **Rules and mechanics live outside UI code.** Versioned rulesets and the combat kernel are the truth layer.
7. **Evidence collection is not evidence promotion.** Evidence Lab may produce candidate observations; only the evidence validator/review process may promote mechanics.
8. **Video timing uses decoded timestamps.** Never infer authoritative timing from frame index divided by nominal FPS. Preserve media hash, PTS/time base, tool versions, and measurement uncertainty.
9. **The PWA and Evidence Lab remain separate applications.** The PWA is the simulator. `evidence-lab/` is localhost media/evidence infrastructure and is not a Pages dependency.
10. **ML may assist perception, never truth.** Future ML can propose object tracks, projectile locations, or likely event frames. Human acceptance and deterministic measurement are required before evidence enters review.
11. **Legacy proxy results are never presented as Clash probabilities.** The proxy harness is scaffolding until replaced.
12. **No runtime AI dependency in the current simulation phase.** A model may return later as an outer search/analysis driver over exact traces, never as ruleset or combat authority.
13. **No live-client automation or modification.** This repository is an external simulator and planning tool.
14. **No proprietary game assets.** Use neutral UI graphics and structured game-state data.

## Code style

- Browser-native ES modules for the PWA; avoid a build tool until it buys something material.
- Evidence Lab may use the Python standard library plus external `ffmpeg`/`ffprobe`; avoid adding Python package dependencies without a demonstrated need.
- Prefer pure functions for rules, legality, combat resolution, evidence measurement, and search.
- Keep PWA paths relative so GitHub Pages subpath hosting works.
- Keep Evidence Lab bound to localhost and local media under its Git-ignored workspace.
- Add deterministic golden fixtures before expanding a mechanic into larger simulations.
- Keep field-level provenance with combat data.
- Make epistemic boundaries visible in code and UI.

## Mechanics change protocol

For any mechanics change:

1. identify the exact game mechanic;
2. record its source/provenance;
3. classify each required field as verified, derived-verified, or unresolved;
4. if video-derived, retain the exact media SHA-256 plus frame/PTS evidence and pass promotion gates;
5. add/update a deterministic golden test;
6. preserve replay determinism;
7. document the temporal/spatial reference frame;
8. invalidate prior search results if mechanics semantics changed.

## Evidence Lab change protocol

For video/evidence tooling:

1. preserve original media bytes and bind observations to SHA-256;
2. use ffprobe decoded-frame timestamps as the clock;
3. treat browser playback as coarse navigation only;
4. make exact-frame extraction reproducible from original media;
5. export candidate evidence rather than silently updating rulesets;
6. keep ML/optical-flow assistance downstream of raw media and upstream of human acceptance;
7. keep final measurements deterministic from accepted frames/tracks.

## Build order

Expand from micro-interactions upward:

1. damage impacts;
2. acquisition;
3. movement/range;
4. first-shot and projectile timing;
5. destruction/retargeting;
6. defensive fire;
7. walls/pathfinding;
8. concurrency and area effects;
9. traps/spells/heroes/CC;
10. full TH7 attack replay;
11. exact Monte Carlo search;
12. optional machine-cognition driver over trace populations.
