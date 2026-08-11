# AGENTS.md — repository operating contract

## Active mission

Build a personal, deterministic Clash of Clans upgrade scheduler for one Home Village. The current bounded objective is a three-builder strategic rush to **max offensive progression at Town Hall 9**, after which the strategy will be explicitly recoded for a new bounded goal.

The earlier exact-combat Basecracker experiment remains parked in `PARKED.md`. Do not resume combat/video work as part of upgrade-planner tasks.

## Upgrade-planner invariants

1. **The strategy is personal, not generalized.** Hard-code the current operator policy instead of adding settings, accounts, or multi-user abstractions.
2. **Three builders are authoritative.** Builder scheduling assumes exactly 3 Home Village builders for this bounded goal.
3. **Protect the sleep window.** The operator sleeps 21:00–03:30 local time. Avoid preventable builder completion/idle during that window and ensure all three builders are occupied at 21:00 whenever legal/resource-feasible work exists.
4. **Laboratory is a separate scheduling lane.** Keep research occupied whenever eligible/resources permit. Existing research may continue while the Laboratory building upgrades; new research cannot begin until the Laboratory building upgrade completes.
5. **Strategically rush to TH9.** Place every mandatory newly unlocked building/trap; advance Town Hall as soon as legal and consistent with the offensive critical path.
6. **Offense before defense.** Prioritize Laboratory, Army Camps, Barracks, Dark Barracks, Spell Factories, Hero Hall, Clan Castle, Blacksmith, heroes, and Laboratory research. Do not level defenses before the bounded max-offense TH9 target.
7. **Storages are prerequisites, not goals.** Upgrade Gold/Elixir/Dark Elixir storage only when aggregate capacity blocks a higher-priority action.
8. **Do not invent resource income.** Farming/loot rate is exogenous. Use current balances or explicit scenario assumptions; never fabricate an income rate to make a schedule feasible.
9. **Plan the whole path.** The solver should reason over the remaining dependency graph to max-offense TH9 rather than greedily choosing only the locally best next upgrade.
10. **Current game data is versioned and sourced.** Costs, times, caps, unlocks, and progression rules must carry an audit date. Current Clash Wiki tables are working structured sources; official Supercell release notes override historical assumptions. Older third-party datasets are cross-checks only.
11. **Village export before APIs.** Prefer the in-game Village Data Export as authoritative imported village state. Do not add a Supercell developer API backend, browser secret, `.env`, GitHub Secret, or IP allowlist unless the export demonstrably lacks required state that the API can provide.
12. **Bounded-goal stop is real.** Never advance beyond TH9 under this strategy. When max-offense TH9 is reached, stop and require a new strategy definition before scheduling TH10 or defensive maxing.

## Current target

`src/progression/target-th9.js` defines the timer-bearing max-offense TH9 target:

- TH9;
- 4 Army Camps L7;
- Barracks L11;
- Laboratory L7;
- Spell Factory L4;
- Dark Barracks L6;
- Dark Spell Factory L4;
- Hero Hall L3;
- Clan Castle L5;
- Blacksmith L2;
- Barbarian King L30;
- Archer Queen L30;
- Minion Prince L10;
- every troop/spell Laboratory level reachable at TH9.

Hero-equipment ore levels are a separate non-timer economy in v1 and must not distort the builder/Laboratory scheduling objective.

## Development order

1. **Phase 1 — current progression data.** Complete and test TH1→TH9 costs, times, placement gates, offense, heroes, research, and storage prerequisites.
2. **Phase 2 — actual village import.** Inspect one raw in-game Village Data Export and build a deterministic parser/canonical state mapper. Ask for only state the export does not contain.
3. **Phase 3 — schedule solver.** Compute the remaining whole-path plan across Builder 1 / Builder 2 / Builder 3 / Laboratory with sleep-window and capacity constraints.
4. **Phase 4 — PWA.** Build the UI around Now / Next / Tonight / Path / Sync Village. Do not design the UI before the state and schedule are trustworthy.
5. **Phase 5 — recode bounded goal.** At max-offense TH9, freeze the completed strategy and explicitly define the defensive-max-TH9 plan before TH10.

## Code style

- Browser-native ES modules; avoid a build tool until it materially helps.
- Prefer pure functions for progression rules, state normalization, scheduling, and validation.
- Keep PWA paths relative for GitHub Pages.
- Put versioned game data in `src/progression/` and personal policy in `src/strategy/`.
- Add deterministic regression tests for current-version facts that can silently invalidate the schedule.
- Make data gaps explicit and block dependent claims instead of guessing.

## Data-change protocol

For any cost/time/unlock/progression change:

1. identify the exact current game fact;
2. verify it against a current source and relevant official patch history when needed;
3. update the versioned record and audit date if appropriate;
4. update/add a deterministic regression test;
5. invalidate/recompute any previously generated schedule that depends on the changed fact.

## Legacy Basecracker boundary

The following remain in the repository as a parked proof of concept and are not the active product direction:

- deterministic TH7 combat ruleset/kernel;
- Monte Carlo proxy scaffold;
- gameplay mechanics evidence registry;
- Evidence Lab video tooling.

Preserve them unless a cleanup is explicitly authorized. Do not spend upgrade-planner cycles extending them.
