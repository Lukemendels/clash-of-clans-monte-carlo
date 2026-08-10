# AGENTS.md — repository operating contract

## Mission

Build an external, local-first tactical simulation workbench that turns a visible Clash of Clans base into explicit state, searches counterfactual attacks, and exposes evidence to machine cognition.

## Architectural invariants

1. **Observed state is not simulated truth.** Preserve extraction confidence and human corrections.
2. **LLMs propose; deterministic code evaluates.** A model may reconstruct state or propose an attack patch. It may not silently mark that proposal validated.
3. **A candidate must be re-simulated after mutation.** Never carry old Monte Carlo statistics onto a changed plan.
4. **Randomness must be seedable.** Simulator comparisons need reproducibility.
5. **Rules and mechanics belong outside UI code.** Move increasingly exact game mechanics behind simulator / ruleset interfaces.
6. **No secrets in source control.** API keys are runtime-only.
7. **No live-client automation or modification.** This repository is an external simulator and planning tool.
8. **No proprietary game assets.** Use neutral UI graphics and structured game-state data.

## Code style

- Browser-native ES modules; avoid a build tool until it buys something material.
- Prefer pure functions in `model.js`, `sim.js`, and `optimizer.js`.
- Keep PWA paths relative so GitHub Pages subpath hosting works.
- Add tests for simulator invariants before increasing fidelity.
- Mark approximations as approximations. Do not make accuracy claims unsupported by calibration data.

## Change protocol

For any simulator change:

1. state the mechanic being modeled;
2. add or update a deterministic test;
3. preserve seeded reproducibility;
4. document whether the change is a proxy heuristic or calibrated game mechanic;
5. invalidate / rerun prior results if the scoring semantics changed.

## Future high-fidelity engine

The intended direction is a discrete-event / time-stepped world model with explicit entities, target selection, movement, attack intervals, projectiles, splash, spell effects, pathing, walls, traps, heroes, equipment, pets, siege machines, and cleanup. Do not bury these mechanics in ad hoc UI logic.
