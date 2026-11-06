# Contributing to the Budget Gate docs

This repository is the user documentation for all three Budget Gate repositories, published at [budgetgate.github.io/docs](https://budgetgate.github.io/docs/). Code changes belong in [soroban-budget-core](https://github.com/BudgetGate/soroban-budget-core), [soroban-budget-action](https://github.com/BudgetGate/soroban-budget-action) or [soroban-budget-dashboard](https://github.com/BudgetGate/soroban-budget-dashboard); each has its own `CONTRIBUTING.md`.

## Local setup

1. Install Node.js 24 (CI and the deploy workflow use it).
2. Clone the repository and install the locked dependencies:
   ```bash
   npm ci
   ```
3. Preview and build:
   ```bash
   npm run docs:dev      # local server with live reload
   npm run docs:build    # the same build CI runs; it fails on dead internal links
   ```

Pages live under `docs/`: `docs/core/`, `docs/action/` and `docs/dashboard/`, one folder per repository. The sidebar and navigation are in `docs/.vitepress/config.js`; add a new page there or it will not be reachable. Files in `docs/public/` (the demo video and its poster) are served as they are.

## Rules for changes

- **Every claim must match the code on `main`.** Before you document a flag, input, output, exit code, metric or schema field, check it in that repository's code or README, not in an older page or an issue. If you could not check something, say so in the PR.
- **Numbers come from real runs.** Measured figures on these pages come from testnet runs with a date and protocol version. Do not round, estimate or invent them; give the date and protocol of any new figure, and the command that produced it.
- **Say which release a change is in.** A behaviour that is on a repository's `main` but not released yet is described as "after v0.2.x", so readers on the latest release are not misled.
- **Limitations stay visible.** Each part has a known limitations section. When a limitation is fixed, update that section in the same PR; do not leave it to drift.
- **No claims of being audited or production-ready.** Budget Gate is neither.
- **One docs site.** Do not add docs to the product repositories beyond their README, `SCHEMA.md` and `CONTRIBUTING.md`, and do not start a second site.

## Matching PRs

A change to user-facing behaviour in a product repository (flags, exit codes, Action inputs or outputs, the report, the schema, metrics) needs a PR here. Open it together with the code PR and link the two in both descriptions. A docs PR on its own is welcome for corrections and clearer wording.

## Submitting a PR

- Base your branch on `main`.
- Link the issue it resolves (`Closes #<n>`), and keep the change to that issue.
- Run `npm run docs:build` before pushing; CI runs it on every PR, and a PR cannot merge until it passes.
- Say in the PR what you checked each claim against.

Merging to `main` deploys the site; there is no separate release step.

## Reporting problems

Report wrong or unclear docs as an issue in this repository. Report security issues privately through the Security tab of the affected product repository, as its `SECURITY.md` describes.
