# Roadmap

## M0 — research workbench skeleton

- [x] static PWA + GitHub Pages
- [x] 44×44 base-state surface
- [x] seeded proxy Monte Carlo harness
- [x] evolutionary policy-search scaffold
- [x] prove browser-hosted experimentation loop

The early screenshot / runtime-model experiments were intentionally discarded from the core architecture once the precision requirement became clear.

## M1 — authoritative TH7 state + mechanics registry

- [x] TH7-first versioned legality ruleset
- [x] deterministic base builder
- [x] inventory / level / footprint / overlap validation
- [x] full max-inventory TH7 demo
- [x] field-level mechanics provenance schema
- [x] verified nominal records for Wizard L4, Cannon L8, and Builder Hut L1
- [x] mechanics-evidence registry + patch/grade promotion gates
- [ ] complete TH7 building HP / defensive mechanics
- [ ] complete TH7 troop statistics and level availability
- [ ] complete TH7 wall / trap / spell / hero mechanics
- [ ] provenance audit against official balance notes where available

Exit condition: every fact required by a TH7 attack is machine-readable, sourced, and never guessed.

## M2 — deterministic combat kernel

- [x] repeated-impact damage cadence
- [x] replayable ordered event trace
- [x] unresolved mechanics block exact features
- [ ] explicit simulation clock from deployment
- [ ] target acquisition and target-selection rules
- [ ] movement and collision geometry
- [ ] attack-range entry
- [ ] first-attack timing
- [ ] projectile launch / travel / impact
- [ ] building destruction and retargeting
- [ ] defensive attacks against moving troops
- [ ] walls and ground pathfinding
- [ ] splash / chain / area effects
- [ ] multiple troops and concurrent events
- [ ] traps and reveal behavior
- [ ] spells and aura effects
- [ ] Clan Castle troops
- [ ] Barbarian King / Hero Hall behavior relevant to TH7

Exit condition: a complete fixed TH7 attack produces the same replayable event trace every run.

## M3 — validation against observed Clash behavior

- [x] define gameplay-evidence grades and conservative promotion protocol
- [x] Evidence Lab v0.1 as a separate local application
- [x] local-video SHA-256 binding
- [x] ffprobe decoded-frame PTS index
- [x] exact-frame ffmpeg inspector
- [x] human causal-event annotation
- [x] deterministic PTS duration measurement
- [x] candidate evidence-packet export
- [ ] spatial pixel→battlefield calibration
- [ ] current-patch Wizard L4 ↔ Cannon L8 evidence set
- [ ] compare predicted hit counts and timestamps with observed attacks
- [ ] quantify movement / targeting / projectile error
- [ ] regression fixtures for every resolved discrepancy
- [ ] prevent features from being labeled exact before calibration

Exit condition: kernel error is measured mechanic-by-mechanic rather than assumed away.

## M3.1 — evidence assistance, only where useful

Evidence production may become partially automated without moving authority into ML:

- [ ] deterministic frame differencing / optical flow
- [ ] assisted troop/building tracking
- [ ] ML-assisted projectile localization from adjacent frames
- [ ] automatic candidate-event suggestions
- [ ] human acceptance/correction before evidence export
- [ ] deterministic measurement remains downstream of accepted tracks/events

Exit condition: automation reduces annotation labor without changing the evidence authority boundary.

## M4 — exact Monte Carlo attacker

- [ ] concrete TH7 army representation + housing legality
- [ ] deterministic deployment action schema
- [ ] candidate tap coordinates and timing
- [ ] exact attack execution through the combat kernel
- [ ] hidden-state worlds for traps / Teslas / CC state where legitimately unknown
- [ ] human execution noise (coordinate and timing tolerance)
- [ ] multi-objective ranking: 3-star rate, p10, time, robustness, execution difficulty
- [ ] replay visualizer / tutorial mode

Exit condition: Basecracker ranks concrete attacks by repeated exact simulations instead of proxy scores.

## M5 — machine cognition over simulation

Only after M2–M4 are trustworthy:

- [ ] export populations of success / failure traces
- [ ] external model identifies failure clusters
- [ ] model proposes policy mutations and search neighborhoods
- [ ] deterministic engine accepts or rejects proposals
- [ ] no model write authority over rulesets or combat outcomes

Exit condition: machine cognition improves search efficiency without becoming part of the truth layer.

## M6 — inverse problem: anti-3-star base generation

- [ ] legal layout genotype + mutation operators
- [ ] attack-population benchmark
- [ ] defender fitness across strong attacker populations
- [ ] co-evolution loop: attackers improve against bases; bases improve against attackers
- [ ] diversity / novelty pressure
- [ ] deterministic proof that every mutation remains legal
- [ ] model explanation / hypothesis generation as an optional outer layer

Exit condition: generated TH7 layouts survive a broad evolving attack population rather than one frozen optimizer.

## Later convenience layers

Screenshot ingestion can return after the simulator is valuable. Its role is only to accelerate creation of an authoritative base state; human/deterministic validation remains the gate.
