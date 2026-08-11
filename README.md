# Clash Upgrade Planner

> **Active direction as of 2026-08-11:** repurpose the existing Basecracker PWA into a personal deterministic upgrade scheduler for a three-builder strategic rush to max offensive progression at Town Hall 9.
>
> The earlier exact-combat simulation experiment remains intentionally parked. See [`PARKED.md`](./PARKED.md) for that proof of concept and its resume conditions.

## Current bounded goal

Plan the fastest practical path from the current Home Village state to **max offense at TH9**, using a hard-coded personal strategy:

- 3 builders;
- sleep 21:00–03:30 local time;
- keep all 3 builders occupied through the sleep window whenever feasible;
- keep Laboratory research running whenever eligible/resources allow;
- strategically rush through TH7/TH8 to TH9;
- place all mandatory newly unlocked structures/traps;
- prioritize offensive infrastructure and heroes;
- do not level defenses before the TH9 offense target;
- upgrade storage only when aggregate capacity blocks a higher-priority action;
- never fabricate a farming/resource-income rate.

At max-offense TH9, stop and recode the strategy for the next bounded goal: defensive max TH9 before TH10.

See [`docs/upgrade-planner.md`](./docs/upgrade-planner.md) for the implementation plan and exact target definition.

## Phase 1 — progression ruleset

The first current-data pass is implemented as deterministic ES modules:

- `src/progression/core-th1-th9.js` — Town Hall progression, mandatory building placement, offensive structures, and storage capacity/cost/time tables;
- `src/progression/mandatory-traps-th1-th9.js` — mandatory trap counts and initial placement costs;
- `src/progression/heroes-th9.js` — King / Queen / Minion Prince progression to TH9 caps;
- `src/progression/research-th9.js` — TH9-reachable troop/spell research costs and times;
- `src/progression/target-th9.js` — bounded max-offense TH9 target;
- `src/strategy/luke-th9-rush.js` — hard-coded strategy and 21:00–03:30 sleep-window semantics;
- `tests/upgrade-progression.test.mjs` — regression tests for current-version facts and planner invariants.

The ruleset is pinned to an audit date. Current Clash Wiki tables are used as working structured sources; official Supercell release notes take precedence where progression rules changed. Older structured datasets are cross-checks only.

## Next phase — actual village state

The preferred input is the in-game **Village Data Export**, not an authenticated backend.

Next step:

1. paste/import one raw Village Data Export;
2. inspect its schema;
3. deterministically map it to the planner state;
4. determine whether active builder/Laboratory finish timestamps are included;
5. request only whatever state the export does not contain.

No Supercell developer API key, `.env`, GitHub Secret, IP allowlist, or user-account system should be added unless the Village Data Export proves insufficient.

## Solver direction

The solver should plan the complete remaining path rather than greedily choose one upgrade at a time.

Conceptual scheduling lanes:

- Builder 1
- Builder 2
- Builder 3
- Laboratory

The objective should heavily penalize critical-path delay, builder idle time, Laboratory idle time, and avoidable upgrade completions during the 21:00–03:30 sleep window.

Storage upgrades have no intrinsic priority. They enter the dependency graph only when current capacity is insufficient for a higher-priority upgrade.

## PWA direction

The eventual personal PWA should stay small:

- **Now** — current builder/Laboratory work;
- **Next** — what to start when a lane frees;
- **Tonight** — what must be running before 21:00;
- **Path** — progress toward max-offense TH9;
- **Sync village** — paste/import current Village Data Export.

No generalized strategy editor, accounts, or multi-user product surface is required.

## Legacy combat proof of concept

The repository still contains the earlier Basecracker deterministic-combat work:

- authoritative TH7 base builder and legality ruleset;
- partial provenance-bearing combat ruleset;
- deterministic Wizard L4 → Builder Hut L1 damage fixture;
- gameplay mechanics evidence registry;
- local Evidence Lab video workbench;
- legacy proxy Monte Carlo scaffold.

That branch of the idea is parked because reaching exact combat fidelity would require a much larger empirical video/vision pipeline and too much operator attention for a hobby proof of concept. It should not be resumed unless machine perception/evidence processing becomes substantially more autonomous.

## Development

```bash
npm test
npm run serve
```

The existing static PWA is served at `http://localhost:8080`. Its current UI still reflects the parked combat prototype; repurposing the UI occurs only after the progression ruleset, village-state import, and schedule are trustworthy.
