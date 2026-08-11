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
- Nominal exact records currently include Wizard L4, Cannon L8, and Builder Hut L1.
- First deterministic golden combat fixture: Wizard level 4 vs Builder Hut level 1.
- Replayable combat event trace with an explicit epistemic boundary: time zero is first impact until first-shot/projectile mechanics are sourced.
- First-class gameplay evidence registry for YouTube/video calibration, patch classification, frame measurements, uncertainty, and promotion gates.
- Legacy proxy Monte Carlo harness retained only as scaffolding; its percentages are not Clash probabilities.
- GitHub Pages deployment and deterministic test CI.

## Exactness policy

Basecracker does not fill missing mechanics with plausible values.

Every combat field is either:

- `verified` — value plus source/provenance;
- `derived-verified` — logically derived from sourced facts, with the derivation recorded; or
- `unresolved` — unavailable for exact simulation until sourced.

If a feature requires an unresolved field, the exact kernel must refuse to claim that feature rather than guess.

## Gameplay evidence policy

Static tables are not enough for timing and projectile causality. Basecracker therefore treats gameplay footage as empirical evidence.

Evidence collection and mechanic promotion are intentionally different operations:

- **Grade A — current patch:** frame-audited current-patch gameplay. Required for numeric temporal calibration.
- **Grade B — historical invariant:** older footage proving a qualitative behavior, promoted only after explicit review that no intervening patch changed the mechanic.
- **Grade C — unverified:** useful source candidate only; cannot enter authoritative mechanics.
- **Static reference:** official/wiki/reference records for nominal values such as HP, damage, range, and advertised attack cadence.

Numeric timing records must retain the source FPS, frame interval, derived duration, and at least one source-frame of measurement uncertainty. `src/evidence/validate.js` enforces promotion gates.

The active patch baseline from the 2026-08-10 evidence audit is Supercell's July 9, 2026 **July Balance Update**. A newer gameplay/balance update requires the baseline and affected evidence to be reviewed.

See `docs/mechanics-evidence.md` for the research protocol.

## First golden fixture

The current exact slice uses verified values for:

- Wizard L4 damage per attack, HP, attack cadence, range, movement speed, and attack type;
- Builder Hut L1 HP and footprint.

It can prove the damage sequence and cadence relative to first impact. It does **not** yet claim exact deployment-to-first-impact timing because first-attack delay and projectile travel are unresolved.

The next full golden interaction is **Wizard L4 ↔ Cannon L8**. Nominal HP/damage/cadence are recorded. Animation wind-up, projectile launch, projectile flight, source-death persistence, and same-timestamp event ordering remain blocked on gameplay evidence.

## Run locally

```bash
npm test
npm run serve
```

Then open `http://localhost:8080`.

## Architecture direction

1. **M1 — authoritative rulesets + evidence corpus**: complete TH7 inventory, field-level mechanics provenance, and gameplay evidence promotion.
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
- `src/evidence/registry.js` — mechanics evidence records and active patch baseline.
- `src/evidence/validate.js` — evidence validation and promotion gates.
- `src/model.js` — authoritative base-state model and full TH7 demo.
- `src/legality.js` — deterministic base validation.
- `docs/mechanics-evidence.md` — gameplay/video evidence protocol.
- `docs/architecture.md` — system boundaries.
- `docs/roadmap.md` — implementation sequence.

## Non-goals / boundaries

Basecracker does not modify the Clash of Clans client, automate live-game taps, intercept network traffic, or ship Supercell proprietary assets. It is an external analysis and simulation workbench.
