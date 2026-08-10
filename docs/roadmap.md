# Roadmap

## M0 — workbench skeleton (v0.1)

- [x] PWA shell and GitHub Pages workflow
- [x] screenshot upload + 44×44 isometric calibration
- [x] manual state reconstruction
- [x] Gemini 3.6 Flash vision adapter
- [x] explicit hidden-state priors
- [x] seeded Monte Carlo proxy engine
- [x] evolutionary attack-policy search
- [x] attack dossier / LLM reviewer contract
- [x] Gemini tactical reviewer
- [x] agent / skill repository instructions

## M1 — mechanics registry and validation corpus

- [ ] define versioned Town Hall rulesets
- [ ] building footprint registry
- [ ] defense / troop / spell / hero / equipment stat schema
- [ ] army legality and housing-space checks
- [ ] fixture bases and known interaction tests
- [ ] replay / observation log format for calibration

Exit condition: mechanics can be updated as data without rewriting the planner UI.

## M2 — discrete combat engine

- [ ] explicit simulation clock
- [ ] entity HP, movement, range, attack interval, target rules
- [ ] walls and pathfinding
- [ ] projectile / splash / chain effects
- [ ] spells and aura effects
- [ ] traps and hidden-state reveal
- [ ] CC deployment
- [ ] heroes, equipment, pets, siege machines
- [ ] deterministic replay for a fixed seed

Exit condition: a trial produces a replayable event trace, not only a score.

## M3 — screenshot reconstruction quality

- [ ] annotated grid calibration presets by device / crop
- [ ] object detection / segmentation benchmark
- [ ] confidence-based human correction queue
- [ ] wall tracing
- [ ] level estimation
- [ ] reconstruction diff after human correction

Exit condition: major-defense state can be extracted with measured accuracy and corrections are fast.

## M4 — attacker search

- [ ] exact army composition search
- [ ] tap-coordinate and timing optimization
- [ ] adaptive policies with branches after CC / traps / Tesla reveal
- [ ] multi-objective robustness: 3-star rate, p10, time, execution difficulty
- [ ] replay visualizer / tutorial mode
- [ ] LLM proposes search neighborhoods from event-trace failures

Exit condition: candidate attacks are concrete enough for a strong human attacker to rehearse.

## M5 — calibration against reality

- [ ] record planned vs actual attack outcomes
- [ ] compare predicted path / timing / destruction to observation
- [ ] estimate model error by mechanic and attack family
- [ ] prevent confidence from outrunning calibration quality

Exit condition: simulator error is quantified rather than assumed away.

## M6 — Phase 2: anti-3-star base generation

Treat base design as the inverse adversarial optimization problem.

- [ ] legal layout genotype + mutation operators
- [ ] attack-population benchmark
- [ ] defender fitness across attack families
- [ ] co-evolution loop: attackers improve against bases; bases improve against attackers
- [ ] diversity / novelty pressure to prevent one-layout convergence
- [ ] LLM explanation layer for why a mutation improved robustness
- [ ] base-builder tutorial / export representation

Exit condition: generated layouts survive a broad attack population, not only one frozen optimizer.
