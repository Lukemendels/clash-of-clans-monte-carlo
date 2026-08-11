# Personal TH9 Upgrade Planner

## Status

Active repurpose of the repository as of 2026-08-11.

The exact-combat Basecracker experiment remains parked. The active bounded goal is a personal, deterministic upgrade scheduler for one Home Village.

## Bounded objective

Find a practical minimum-time path from the current village state to **max offensive progression at Town Hall 9**, subject to Luke's actual operating constraints:

- exactly 3 builders;
- sleep window 21:00–03:30 local time;
- all 3 builders should be occupied through the sleep window whenever legal/resource-feasible work exists;
- avoid upgrades completing during sleep if that creates preventable builder idle time;
- keep Laboratory research continuously occupied when eligible and resources permit;
- strategically rush through TH7/TH8 to TH9;
- place every newly required building/trap as it unlocks;
- do not level defenses before the TH9 offense target;
- upgrade Gold/Elixir/Dark Elixir storage only when aggregate capacity blocks a higher-priority action;
- never invent a farming/resource-income rate.

At the max-offense TH9 boundary, stop and recode the strategy for the next bounded goal: defensive max TH9 before TH10.

## Phase 1 — current progression ruleset

Implemented machine-readable data:

- `src/progression/core-th1-th9.js`
  - TH1→TH9 Town Hall costs/times/capacities;
  - current progression gates;
  - mandatory building placement counts;
  - initial placement costs/times for builder-consuming defenses/resources;
  - offensive structure levels/costs/times through TH9;
  - requirement-only storage capacity/cost/time tables.
- `src/progression/mandatory-traps-th1-th9.js`
  - mandatory trap counts and initial instant-placement costs through TH9.
- `src/progression/heroes-th9.js`
  - Barbarian King, Archer Queen, and Minion Prince progression to the TH9 Hero Hall caps.
- `src/progression/research-th9.js`
  - all Laboratory troop/spell research reachable through Lab 7 / TH9.
- `src/progression/target-th9.js`
  - bounded max-offense TH9 completion target.
- `src/strategy/luke-th9-rush.js`
  - hard-coded personal strategy and sleep-window semantics.

The data is pinned to an audit date. Current Clash Wiki tables are the working structured source; official Supercell release notes override historical assumptions when progression changed. Older third-party structured datasets are cross-checks only.

Important current-version semantics encoded in tests include:

- Hero Hall / Barbarian King now begin at TH4 after the May 2026 update;
- King level upgrades begin when Dark Elixir becomes available at TH7;
- the TH8+ rush must respect current Hero Hall / Hero Banner Town Hall gates;
- existing Laboratory research continues while the Laboratory building upgrades, but a new research job cannot be started until the building upgrade completes;
- current Dark Barracks L1 is 200,000 Elixir / 8 hours;
- mandatory trap placement is resource-relevant but consumes no builder time.

## Exact target definition

For this planner, "max offense TH9" currently means the timer-bearing progression state:

- Town Hall 9;
- 4 Army Camps at L7;
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
- every troop/spell research level reachable at TH9 completed.

Hero-equipment ore levels are intentionally separate in v1 because they are not builder/Laboratory timer work. They can be shown as a parallel checklist later without contaminating the scheduling objective.

## Phase 2 — actual village state

Preferred input is the game's **Village Data Export**, pasted/imported into the PWA.

Do not add a Supercell API backend, developer secret, IP allowlist, or user-account system unless the Village Data Export proves insufficient.

The first Phase 2 task is therefore:

1. capture one raw Village Data Export from the user's account;
2. inspect its schema;
3. deterministically map it to the planner's canonical state;
4. identify any missing live state (especially active builder and Laboratory finish timestamps);
5. request only those missing fields from the user.

## Phase 3 — deterministic schedule

The first solver should plan the whole path, not greedily recommend only the next upgrade.

Conceptual lanes:

- Builder 1
- Builder 2
- Builder 3
- Laboratory research

Candidate actions are constrained by Town Hall, prerequisite, structure count/level, storage capacity, resources, and current lane occupancy.

The objective should heavily penalize:

1. critical-path delay to max-offense TH9;
2. builder idle time;
3. Laboratory idle time;
4. builder completions inside 21:00–03:30 that cause preventable overnight idle.

Storage actions have no intrinsic priority. A storage upgrade enters the DAG only when the capacity required by a higher-priority action exceeds current aggregate capacity.

Resource income remains exogenous. The scheduler can produce a structural critical path independent of farming and then replan from actual balances as the village progresses.

## Phase 4 — PWA around the plan

Keep the interface personal and small:

- **Now** — three builders + Laboratory and their finish times;
- **Next** — exact next action when a lane frees;
- **Tonight** — actions needed before 21:00 to protect the sleep window;
- **Path** — progress and projected structural path to max-offense TH9;
- **Sync village** — paste/import current Village Data Export.

No generalized strategy editor is required.

## Phase 5 — next bounded goal

At max-offense TH9:

1. freeze the completed plan;
2. re-audit any game data changed by patches;
3. recode the policy for defensive max TH9;
4. rerun the same state → plan → PWA loop.
