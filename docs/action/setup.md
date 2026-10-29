# Workflow Setup

The Action downloads the runner's binary from core's v0.2.2 release with `binary-version: 0.2.2` and checks it against the release's `SHA256SUMS`. Linux, macOS and Windows runners work, on x64 and arm64 (core v0.2.1 and earlier only ship Linux x64). On any other runner, see [Building core yourself](#building-core-yourself).

You need a [fixture](/core/api-reference#fixture-format) in your repository, for example `budget/fixture.json`.

The baseline is handled for you: every push to your default branch saves the measured snapshot to the Actions cache, and pull requests compare against it. For that, the workflow has to run on pushes to the default branch as well as on pull requests:

```yaml
name: Budget check

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  budget-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - name: Run Soroban Budget Guard
        uses: BudgetGate/soroban-budget-action@v0.2.2
        with:
          fixture-path: budget/fixture.json
          binary-version: 0.2.2
```

`v0.2.2` is the Action's latest [release](https://github.com/BudgetGate/soroban-budget-action/releases/tag/v0.2.2): the same inputs and behaviour as v0.2.1, plus macOS, Windows and Linux arm64 runners, and a cached baseline that Windows runners can restore. Tags are exact: there is no moving `v0` tag, so change the version yourself to upgrade.

Until the first push to the default branch has run, there is no baseline: the PR comment says so, and every function is shown as `🆕 NEW`.

## Committing the baseline instead

If you'd rather keep the baseline in the repository, create it locally as shown in [First run](/core/#first-run), commit it, and pass its path:

```yaml
        with:
          binary-version: 0.2.2
          baseline-path: budget/baseline.json
          fixture-path: budget/fixture.json
```

A baseline file that exists always wins over the cache. To update it after an intended cost change, rerun core locally with `--output-json budget/baseline.json` and commit the result.

## Building core yourself

On a runner `binary-version` does not cover, or to run core's latest code, build it and pass its path with `binary-path` instead of `binary-version`:

```yaml
      - uses: actions/setup-go@v7
        with:
          go-version: '1.26'

      - name: Build soroban-budget-core
        run: |
          git clone --depth 1 https://github.com/BudgetGate/soroban-budget-core.git "$RUNNER_TEMP/core"
          cd "$RUNNER_TEMP/core" && go build -o budget-core .

      - name: Run Soroban Budget Guard
        uses: BudgetGate/soroban-budget-action@v0.2.2
        with:
          binary-path: ${{ runner.temp }}/core/budget-core
          fixture-path: budget/fixture.json
```

## Tested

This setup has run on GitHub in [BudgetGate/budgetgate-action-test](https://github.com/BudgetGate/budgetgate-action-test) (2026-10-28): a push to `main` downloaded core v0.2.0, saved the baseline and wrote the history; pull requests restored that baseline from the cache, posted a regression report for a contract whose cost went up, updated the same comment on the next push, and replaced it with "The latest run failed" when core could not run. Those runs used the Action's `main` at the code later tagged `v0.2.0`; a pull request run of the `@v0.2.0` tag itself then passed ([test repo PR #4](https://github.com/BudgetGate/budgetgate-action-test/pull/4)). The released `@v0.2.1` tag then passed on [test repo PR #7](https://github.com/BudgetGate/budgetgate-action-test/pull/7) (2026-10-29). Before that, core v0.2.1 ran through the Action on [test repo PR #6](https://github.com/BudgetGate/budgetgate-action-test/pull/6) (2026-10-29): downloaded, checksum matched, a regression reported for the costlier contract and the same comment updated to a pass. On 2026-10-29 the released `@v0.2.2` tag ran on `ubuntu-latest`, `ubuntu-24.04-arm`, `macos-26-intel`, `macos-latest`, `windows-latest` and `windows-11-arm` ([test repo PR #8](https://github.com/BudgetGate/budgetgate-action-test/pull/8)): each downloaded its own core v0.2.2 binary, matched the checksum, restored the baseline saved by a Linux run and reported the counter contract's regression. The `binary-path` variant above has not been run there.
