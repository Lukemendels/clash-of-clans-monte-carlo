# Basecracker — Clash of Clans Monte Carlo Workbench

Basecracker is a local-first PWA for reconstructing a Clash of Clans base from a screenshot, expressing uncertainty explicitly, running Monte Carlo attack-policy search, and handing the resulting evidence to a text LLM for tactical review.

The project is deliberately split into three layers:

1. **Observed / reconstructed state** — screenshot plus a 44×44 logical base model.
2. **Deterministic simulation and search** — stochastic hidden-state sampling plus a repeatable optimization engine.
3. **Machine cognition** — an LLM can extract visible state or critique a candidate, but it proposes; the simulator validates.

## Current v0.1 capability

- Installable static PWA; no build step and no runtime dependencies.
- Screenshot upload with an adjustable isometric 44×44 grid.
- Manual building / defense / wall placement and correction.
- Optional Gemini vision reconstruction using a user-supplied API key held only in `sessionStorage`.
- Explicit priors for hidden Teslas, traps, Clan Castle threat, and pathing noise.
- Worker-thread Monte Carlo search across attack strategy, entry angle, offset, funnel width, spell depth, reserve, and ability timing.
- Verification rollouts on finalists and failure-mode aggregation.
- Click/tap-sequence output in logical tile coordinates.
- `coc-attack-dossier/v1` export for text-model review.
- Optional Gemini reviewer with proposal-only plan patches.
- GitHub Pages deployment workflow on `main`.

## Epistemic status

The current simulator is a **proxy combat model**, not a byte-for-byte recreation of Supercell's combat engine. A reported `3★` percentage is a score inside this model, not a guaranteed result in the live game.

That is an intentional architecture decision: base reconstruction, ruleset calibration, combat resolution, search, and LLM review have separate interfaces. We can replace the proxy engine with increasingly exact mechanics without rebuilding the PWA or the dossier contract.

## Run locally

```bash
npm test
npm run serve
```

Then open `http://localhost:8080`.

## GitHub Pages

The included `.github/workflows/pages.yml` deploys the repository root as a static Pages artifact on pushes to `main`. In the repository Pages settings, select **GitHub Actions** as the publishing source if it is not already enabled.

## Gemini adapter

Settings default to `gemini-3.6-flash` and thinking level `high`.

The PWA sends requests directly from the browser to Google's Gemini API. The API key is never part of source control and is stored only in `sessionStorage`. Closing the browser session clears it.

Two model jobs are currently defined:

- **Vision extraction**: annotated screenshot → `coc-base/v1` candidate state.
- **Tactical review**: `coc-attack-dossier/v1` → bounded candidate-plan patch + contingencies.

Human correction remains authoritative after vision extraction, and a reviewer patch must be re-simulated before it is treated as validated.

## Phase 1 — make the crack real

The architecture is ready for the work that determines whether this becomes genuinely strong rather than merely interesting:

- calibrate exact building footprints and combat statistics by Town Hall / level;
- model troop composition, housing space, targeting rules, projectile timing, retargeting, walls, spells, hero equipment, pets, siege machines, CC troops, traps, and time;
- implement discrete-event troop / defense simulation;
- build image-recognition validation sets and correction UX;
- infer legal hidden-trap distributions from visible base geometry;
- add adaptive attack branches after hidden state is revealed;
- compare simulator predictions against real attacks and retain calibration error.

## Phase 2 — inverse problem: base design

The same engine can optimize defense instead of attack:

1. generate or mutate legal base layouts;
2. attack each candidate with the strongest known attack population;
3. score anti-3-star robustness across many attack families and hidden-state realizations;
4. evolve the base;
5. expose why the base survives to an LLM / human designer;
6. retain diversity so optimization does not converge on one brittle layout family.

This is a minimax / adversarial co-evolution problem: improve the attacker and defender against each other rather than optimizing either against a static opponent.

## Repository contracts

- `AGENTS.md` — code-agent operating rules.
- `agent.md` — runtime LLM reviewer contract.
- `skill.md` — portable tactical-review skill.
- `docs/architecture.md` — system boundaries and state transitions.
- `docs/roadmap.md` — implementation sequence toward high-fidelity simulation and inverse base design.

## Non-goals / boundaries

Basecracker does not modify the Clash of Clans client, automate taps in the live client, intercept network traffic, or ship Supercell proprietary assets. It is an external analysis and simulation workbench.
