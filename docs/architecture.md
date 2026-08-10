# Architecture

## North-star loop

`authoritative legal base → versioned exact mechanics → deterministic combat trace → validation/calibration → Monte Carlo policy search → human execution`

The central idea is to manufacture counterfactual experience without touching the live game client.

Machine cognition is intentionally outside the core loop until the simulator is trustworthy:

`trace population → model proposes hypotheses / search neighborhoods → deterministic engine evaluates → retain or reject`

## Authority boundaries

### 1. Base state

`coc-base/v2` is authoritative simulator input. It is built explicitly on the 44×44 grid or imported from validated JSON. Entity identity, level, footprint, and tile anchor are deterministic state.

Screenshot reconstruction is not part of the current architecture. It may return later as a convenience for proposing initial state, but it cannot become authoritative without deterministic validation / human confirmation.

### 2. Legality ruleset

`src/rulesets/th7.js` defines the currently supported TH7 inventory envelope: entity types, counts, maximum levels, footprints, walls, traps, and markers.

`src/legality.js` validates counts, levels, bounds, integer coordinates, and occupied-tile collisions.

### 3. Combat mechanics ruleset

`src/rulesets/th7-combat.js` stores combat facts separately from base state.

Each mechanics field carries an epistemic status:

- `verified`
- `derived-verified`
- `unresolved`

Guessed combat values are forbidden. A kernel feature that requires an unresolved field must remain unavailable.

### 4. Deterministic combat kernel

`src/combat/kernel.js` is the beginning of the exact engine.

The first slice resolves repeated damage impacts where damage per attack, target HP, and attack cadence are verified. Its clock origin is explicitly the first impact because deployment-to-impact timing still depends on unresolved first-shot/projectile mechanics.

Same authoritative state + same action inputs must produce the same ordered event trace.

### 5. Search

The existing `src/sim.js` / optimizer path is a legacy proxy harness. It remains only to preserve the product/search scaffold while the exact kernel is built.

The replacement Monte Carlo architecture is:

`candidate policy + legal hidden world → deterministic combat kernel → exact outcome`

Monte Carlo supplies variation across policies, hidden states, and execution tolerances; it does not make combat itself fuzzy.

### 6. Future machine cognition

A model may eventually consume large populations of exact event traces and propose:

- attack-policy mutations;
- search neighborhoods;
- failure-mode hypotheses;
- conditional branches;
- base-layout mutations for the inverse problem.

A model cannot own:

- ruleset facts;
- authoritative base state;
- event resolution;
- validation;
- promotion of a candidate attack as successful.

## Deterministic development strategy

Build from micro-interactions upward:

1. exact repeated damage impacts;
2. target acquisition;
3. movement into range;
4. first-shot timing and projectile travel;
5. destruction and retargeting;
6. defensive fire against moving troops;
7. walls/pathfinding;
8. multiple troops;
9. splash / area effects;
10. traps, spells, heroes, CC troops;
11. complete TH7 attack replay.

Every mechanic should have a golden regression fixture before it becomes part of Monte Carlo search.

## PWA / deployment

The application is static ES modules, a Web Worker for the legacy search harness, a service worker, and browser-local state. There is no backend and no runtime AI/API dependency in the current phase.
