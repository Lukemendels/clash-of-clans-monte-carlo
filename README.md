# Basecracker — TH7 Deterministic Combat Lab

Basecracker is a local-first PWA for building an authoritative Clash of Clans base state, reproducing combat mechanics deterministically, and eventually searching enormous attack-policy spaces with Monte Carlo methods.

The current architecture is deliberately **AI-free at runtime**. The simulator must become trustworthy before a model is allowed to drive search or interpret traces.

## Core loop

`legal base state → versioned mechanics → deterministic combat events → replay/validation → Monte Carlo search → human execution`

Later, machine cognition can sit outside that loop:

`simulation traces → model proposes search neighborhoods / hypotheses → deterministic engine tests them`

A model never owns base state, game mechanics, combat resolution, or validation.

## Current capability

- Static installable PWA; no backend and no runtime dependencies.
- Authoritative TH7 base builder on a 44×44 logical grid.
- Current TH7 inventory, level ceilings, footprints, traps, walls, Hero Hall / Hero Banner, and Builder Huts.
- Deterministic legality validation for counts, levels, bounds, footprints, and occupied-tile collisions.
- Complete max-inventory TH7 demo: 54 buildings, 175 walls, 15 traps, and one Hero Banner.
- Provenance-bearing partial TH7 combat ruleset.
- First deterministic golden combat fixture: Wizard level 4 vs Builder Hut level 1.
- Replayable combat event trace with an explicit epistemic boundary: time zero is first impact until first-shot/projectile mechanics are sourced.
- Legacy proxy Monte Carlo harness retained only as scaffolding; its percentages are not Clash probabilities.
- GitHub Pages deployment and deterministic test CI.

## Exactness policy

Basecracker does not fill missing mechanics with plausible values.

Every combat field is either:

- `verified` — value plus source/provenance;
- `derived-verified` — logically derived from sourced facts, with the derivation recorded; or
- `unresolved` — unavailable for exact simulation until sourced.

If a feature requires an unresolved field, the exact kernel must refuse to claim that feature rather than guess.

## First golden fixture

The current exact slice uses verified values for:

- Wizard L4 damage per attack, HP, attack cadence, range, movement speed, and attack type;
- Builder Hut L1 HP and footprint.

It can prove the damage sequence and cadence relative to first impact. It does **not** yet claim exact deployment-to-first-impact timing because first-attack delay and projectile travel are unresolved.

## Run locally

```bash
npm test
npm run serve
```

Then open `http://localhost:8080`.

## Architecture direction

1. **M1 — authoritative rulesets**: complete TH7 inventory and field-level mechanics provenance.
2. **M2 — deterministic combat kernel**: clock, targeting, movement, range, attack cycles, projectiles, destruction, retargeting, walls, defenses, traps, spells, heroes.
3. **M3 — replay/calibration**: compare event traces with observed in-game interactions and quantify errors.
4. **M4 — exact Monte Carlo attacker**: search concrete armies, coordinates, timings, branches, and execution tolerances by repeatedly invoking the deterministic kernel.
5. **M5 — machine cognition**: use an external model to analyze trace populations and propose mutations/search neighborhoods; deterministic simulation remains judge.
6. **M6 — inverse base design**: mutate legal bases and co-evolve attacker and defender populations.

Screenshot ingestion is an optional later convenience layer. A human can build the authoritative base directly; image reconstruction is not a prerequisite for the simulator.

## Repository contracts

- `src/rulesets/th7.js` — authoritative TH7 legality envelope.
- `src/rulesets/th7-combat.js` — provenance-bearing combat mechanics corpus.
- `src/combat/kernel.js` — deterministic combat event resolution.
- `src/model.js` — authoritative base-state model and full TH7 demo.
- `src/legality.js` — deterministic base validation.
- `docs/architecture.md` — system boundaries.
- `docs/roadmap.md` — implementation sequence.

## Non-goals / boundaries

Basecracker does not modify the Clash of Clans client, automate live-game taps, intercept network traffic, or ship Supercell proprietary assets. It is an external analysis and simulation workbench.
