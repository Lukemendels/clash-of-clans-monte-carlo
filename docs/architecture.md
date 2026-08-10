# Architecture

## North-star loop

`screenshot → reconstructed state → uncertainty priors → candidate policy → Monte Carlo worlds → ranked evidence → LLM critique → bounded patch → re-simulation → human execution`

The central idea is to manufacture counterfactual experience without touching the live game client.

## State layers

### 1. Evidence

The screenshot is source evidence. Grid calibration aligns a logical 44×44 coordinate system to the screenshot.

### 2. Reconstructed base state

`coc-base/v1` is the simulator's authoritative input. It can be produced by Gemini vision, manual placement, JSON import, or a future CV pipeline. Extraction confidence is retained because reconstructed state can be wrong.

### 3. Hidden-state prior

Trap / Tesla / CC / pathing uncertainty is represented as a distribution, not invented as fact. Each Monte Carlo trial samples from the distribution.

### 4. Attack policy

The current proxy engine parameterizes attack family, entry geometry, funnel width, spell depth, reserve, and ability tempo. Future high-fidelity versions will add exact army composition and conditional branches.

### 5. Simulation evidence

A seeded simulator produces trial results. Optimizer output records the requested budget, verification budget, seed, result distribution, and failure clusters.

### 6. Machine-cognition proposal

`coc-attack-dossier/v1` packages state + evidence for a text LLM. The LLM can propose changes but cannot confer validation. A changed policy must run through deterministic simulation again.

## Current engine boundary

`src/sim.js` is deliberately labeled a proxy model. It converts spatial defense geometry, strategy characteristics, hidden-state draws, wall friction, and pathing noise into probabilistic destruction. It is useful for testing the product loop and optimizer, but it is not yet a faithful game clone.

The high-fidelity replacement should preserve these public seams:

```text
runTrial(base, plan, seed) -> trial result
summarizeTrials(trials) -> distribution summary
optimizeBase(base, options) -> ranked policies
buildDossier(base, crackResult) -> LLM-readable evidence
```

## Screenshot extraction

The browser renders the uploaded screenshot plus the calibrated logical grid into one annotated image. Gemini receives that image and returns structured visible state. The human inspects and corrects the result before simulation.

## PWA / deployment

The application is static ES modules, a Web Worker, a service worker, and local browser storage. There is no backend. GitHub Pages can host the repository root directly.

## API-key boundary

The Gemini API key is session-only browser state. It is sent directly to Google's API and never written into repository files or persistent `localStorage` by the app.
