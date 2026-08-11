# Clash Upgrade Planner

> **Active direction as of 2026-08-11:** personal deterministic upgrade scheduler for a three-builder strategic rush to max offensive progression at Town Hall 9.
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

## Phase 1 — progression ruleset ✅

Implemented deterministic ES modules:

- `src/progression/core-th1-th9.js` — Town Hall progression, mandatory building placement, offensive structures, and storage capacity/cost/time tables;
- `src/progression/mandatory-traps-th1-th9.js` — mandatory trap counts and initial placement costs;
- `src/progression/heroes-th9.js` — King / Queen / Minion Prince progression to TH9 caps;
- `src/progression/research-th9.js` — TH9-reachable troop/spell research costs and times;
- `src/progression/target-th9.js` — bounded max-offense TH9 target;
- `src/strategy/luke-th9-rush.js` — hard-coded strategy and 21:00–03:30 sleep-window semantics;
- `tests/upgrade-progression.test.mjs` — regression tests for current-version facts and planner invariants.

The ruleset is pinned to an audit date. Current Clash Wiki tables are working structured sources; official Supercell release notes take precedence where progression rules changed.

## Phase 2 — Village Data Export sync ✅

The live Pages PWA now imports the in-game **Village Data Export** directly in the browser.

Implemented:

- `src/import/village-data-ids.js` — Home Village export data-ID mapping;
- `src/import/village-export.js` — deterministic normalization of buildings, traps, heroes, troops, spells, active builder jobs, and active Laboratory research;
- `src/planner-store.js` — IndexedDB persistence of canonical village state;
- `src/planner-app.js` — Phase 2 sync dashboard;
- `tests/village-export.test.mjs` — timer/level semantics, Home-vs-Builder-Base separation, and unknown-record handling.

Import semantics:

- `lvl` is the completed level;
- when `timer` is present, the object is upgrading from `lvl` to `lvl + 1`;
- `buildings2`, `units2`, etc. are Builder Base and excluded from the Home Village plan;
- timer finish timestamps are derived from the export's Unix `timestamp` plus remaining seconds;
- the raw export is not committed or sent to a backend;
- canonical state is stored only in browser IndexedDB.

Known export boundaries:

- current Gold/Elixir/Dark Elixir balances are not included;
- helper levels/cooldowns/assignments are not included;
- active boosts can make raw timer interpretation require later resync/correction;
- some auxiliary/decorative records are intentionally retained as unmapped rather than guessed.

No Supercell developer API key, `.env`, GitHub Secret, IP allowlist, or account system is currently required.

## Phase 3 — deterministic whole-path schedule

Next task: compute the complete path from imported current state to `max-offense-th9-v1`.

Conceptual scheduling lanes:

- Builder 1
- Builder 2
- Builder 3
- Laboratory

The solver should plan the complete remaining path rather than greedily choose only one next upgrade. It should heavily penalize:

1. delay to the structural critical path;
2. builder idle time;
3. Laboratory idle time;
4. avoidable builder completions during 21:00–03:30.

Storage upgrades have no intrinsic priority. They enter the dependency graph only when current aggregate capacity is insufficient for a higher-priority action.

Resource income remains exogenous. Structural scheduling can be computed without inventing farming rates; live recommendations can then replan from actual balances when needed.

## Live PWA

The current Pages surface is intentionally small:

- paste/import Village Data Export;
- local IndexedDB persistence;
- Home Village / Builder Base separation;
- current Town Hall and active-lane summary;
- active builder finish times;
- Laboratory/research state;
- current offensive buildings, heroes, troop levels, and spell levels.

Phase 3 will add **Next**, **Tonight**, and the complete path to the max-offense TH9 target.

## Legacy combat proof of concept

The repository still contains the earlier Basecracker deterministic-combat work, but it is not the active Pages surface. That branch is parked because reaching exact combat fidelity would require a much larger empirical video/vision pipeline and too much operator attention for a hobby proof of concept.

## Development

```bash
npm test
npm run serve
```

Open `http://localhost:8080`.
