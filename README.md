# Basecracker — TH7 Deterministic Combat Lab

> **Project status: PARKED intentionally as of 2026-08-11.** The proof of concept established the architecture; further development is deferred until the video/evidence loop can run with very little operator effort. See [`PARKED.md`](./PARKED.md) for the decision, current stopping point, and explicit resume conditions.

Basecracker is a local-first Clash of Clans research system for building authoritative base state, reproducing combat mechanics deterministically, and eventually searching enormous attack-policy spaces with Monte Carlo methods.

The current architecture is deliberately **AI-free at runtime**. The simulator must become trustworthy before a model is allowed to drive search or interpret traces.

## System split

Basecracker now has two deliberately separate applications:

1. **Basecracker PWA** — authoritative TH7 base state, legality, combat rulesets, deterministic kernel, and eventually Monte Carlo search.
2. **Basecracker Evidence Lab** — localhost video-analysis tool that turns gameplay footage into reproducible frame/PTS observations and candidate mechanics evidence.

The PWA has no backend. Evidence Lab is a separate local Python + ffmpeg tool and is not deployed through GitHub Pages.

## Core loop

`legal base state → versioned mechanics → deterministic combat events → replay/validation → Monte Carlo search → human execution`

Evidence/calibration feeds that loop through a separate path:

`gameplay video bytes → SHA-256 → decoded frame PTS → human event annotations → deterministic measurement → reviewed evidence promotion → versioned mechanics`

Later, machine cognition can sit outside the simulation loop:

`simulation traces → model proposes search neighborhoods / hypotheses → deterministic engine tests them`

A model never owns base state, game mechanics, combat resolution, evidence promotion, or validation.

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
- First-class gameplay evidence registry for video calibration, patch classification, frame measurements, uncertainty, and promotion gates.
- Separate Evidence Lab v0.1 for local video ingest, SHA-256 binding, ffprobe native-frame timestamps, exact-frame inspection, event annotation, deterministic PTS measurement, and candidate evidence export.
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

Publication date alone is not patch proof. Grade A footage must record why the observed gameplay belongs to the active patch.

Evidence Lab exports candidate evidence only. It never promotes a number or behavioral rule into the combat ruleset.

See `docs/mechanics-evidence.md` and `evidence-lab/README.md`.

## First golden fixture

The current exact slice uses verified values for Wizard L4 damage/cadence and Builder Hut L1 HP. It can prove the repeated-impact sequence relative to first impact.

The next full golden interaction is **Wizard L4 ↔ Cannon L8**. Nominal HP/damage/cadence are recorded. Animation wind-up, projectile launch, projectile flight, source-death persistence, and same-timestamp event ordering remain blocked on gameplay evidence.

## Run the PWA locally

```bash
npm test
npm run serve
```

Then open `http://localhost:8080`.

## Run Evidence Lab

Requires Python plus `ffmpeg`/`ffprobe` on PATH.

```bash
npm run evidence-lab
```

Then open:

```text
http://127.0.0.1:8765
```

Evidence Lab copies media only into the Git-ignored local `evidence-lab/workspace/` directory.

## Architecture direction

1. **M1 — authoritative rulesets + evidence corpus**: complete TH7 inventory, field-level mechanics provenance, and gameplay evidence promotion.
2. **M2 — deterministic combat kernel**: clock, targeting, movement, range, attack cycles, projectiles, destruction, retargeting, walls, defenses, traps, spells, heroes.
3. **M3 — replay/calibration**: use Evidence Lab to compare event traces with observed interactions and quantify errors.
4. **M4 — exact Monte Carlo attacker**: search concrete armies, coordinates, timings, branches, and execution tolerances by repeatedly invoking the deterministic kernel.
5. **M5 — machine cognition**: use an external model to analyze trace populations and propose mutations/search neighborhoods; deterministic simulation remains judge.
6. **M6 — inverse base design**: mutate legal bases and co-evolve attacker and defender populations.

Screenshot ingestion is an optional later convenience layer. A human can build the authoritative base directly; image reconstruction is not a prerequisite for the simulator.

## Repository contracts

- `PARKED.md` — current project status, stopping point, and objective resume conditions.
- `src/rulesets/th7.js` — authoritative TH7 legality envelope.
- `src/rulesets/th7-combat.js` — provenance-bearing combat mechanics corpus.
- `src/combat/kernel.js` — deterministic combat event resolution.
- `src/evidence/registry.js` — mechanics evidence records and active patch baseline.
- `src/evidence/validate.js` — evidence validation and promotion gates.
- `evidence-lab/` — separate local video evidence workbench.
- `src/model.js` — authoritative base-state model and full TH7 demo.
- `src/legality.js` — deterministic base validation.
- `docs/mechanics-evidence.md` — gameplay/video evidence protocol.
- `docs/architecture.md` — system boundaries.
- `docs/roadmap.md` — implementation sequence.

## Non-goals / boundaries

Basecracker does not modify the Clash of Clans client, automate live-game taps, intercept network traffic, or ship Supercell proprietary assets. It is an external analysis and simulation workbench.
