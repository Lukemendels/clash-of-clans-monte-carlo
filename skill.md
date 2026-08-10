---
name: basecracker-tactical-review
description: Review a Basecracker attack dossier, identify failure modes, and propose bounded attack-policy adjustments for deterministic re-simulation.
version: 0.1.0
---

# Basecracker Tactical Review Skill

## Trigger

Use when given a `coc-attack-dossier/v1` payload or a Basecracker Monte Carlo result.

## Method

1. Read the epistemic-status block first.
2. Identify the best candidate by robust metrics, not only mean destruction.
3. Inspect p10 destruction and failure clusters to locate brittle branches.
4. Relate those branches to visible base geometry, uncertainty priors, and the tap sequence.
5. Propose the smallest parameter change that should test the hypothesis.
6. Distinguish unconditional instructions from branches that depend on revealed traps / CC / pathing.
7. Ask deterministic search to validate the proposal.

## Output contract

Return:

```json
{
  "verdict": "short recommendation",
  "confidence": "low | medium | high",
  "failureModes": ["..."],
  "patch": {
    "strategy": null,
    "angle": null,
    "offset": null,
    "corridorWidth": null,
    "funnelBias": null,
    "spellDepth": null,
    "reserve": null,
    "abilityTempo": null
  },
  "contingencies": ["if hidden state X appears, do Y"],
  "rationale": "why this patch should improve robustness"
}
```

Only include non-null changes when justified by evidence. A patch is a proposal, not a validated result.
