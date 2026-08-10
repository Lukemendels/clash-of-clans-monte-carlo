# AGENTS.md — repository operating contract

## Mission

Build an external, local-first Clash of Clans simulation laboratory that represents a legal base explicitly, reproduces combat deterministically, and searches counterfactual attacks only after the kernel is trustworthy.

## Architectural invariants

1. **Authoritative state is explicit.** Base identity, level, tile anchor, footprint, walls, traps, and markers come from validated state—not model inference.
2. **No guessed combat mechanics.** Every value required by exact simulation must be verified, derived with recorded provenance, or remain unresolved.
3. **Unresolved mechanics block dependent features.** Do not substitute plausible timing, HP, damage, targeting, pathing, projectile, or movement values.
4. **Combat resolution is deterministic.** Same state + same actions + same explicit random seed, where randomness is legitimately modeled, must produce the same ordered event trace.
5. **Monte Carlo varies worlds and policies, not combat truth.** Each sampled world is resolved by the deterministic kernel.
6. **Rules and mechanics live outside UI code.** Versioned rulesets and the combat kernel are the truth layer.
7. **Legacy proxy results are never presented as Clash probabilities.** The proxy harness is scaffolding until replaced.
8. **No runtime AI dependency in the current phase.** A model may return later as an outer search/analysis driver over exact traces, never as ruleset or combat authority.
9. **No live-client automation or modification.** This repository is an external simulator and planning tool.
10. **No proprietary game assets.** Use neutral UI graphics and structured game-state data.

## Code style

- Browser-native ES modules; avoid a build tool until it buys something material.
- Prefer pure functions for rules, legality, combat resolution, and search.
- Keep PWA paths relative so GitHub Pages subpath hosting works.
- Add deterministic golden fixtures before expanding a mechanic into larger simulations.
- Keep field-level provenance with combat data.
- Make epistemic boundaries visible in code and UI.

## Change protocol

For any mechanics change:

1. identify the exact game mechanic;
2. record its source/provenance;
3. classify each required field as verified, derived-verified, or unresolved;
4. add/update a deterministic golden test;
5. preserve replay determinism;
6. document the temporal/spatial reference frame;
7. invalidate prior search results if mechanics semantics changed.

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
