# Workflow Setup

The Action downloads the runner's binary from core's v0.2.2 release with `binary-version: 0.2.2` and checks it against the release's `SHA256SUMS`. Linux, macOS and Windows runners work, on x64 and arm64 (core v0.2.1 and earlier only ship Linux x64). On any other runner, see [Building core yourself](#building-core-yourself).

You need a [fixture](/core/api-reference#fixture-format), for example `budget/fixture.json`. A fixture measures whatever contract it calls: with a fixture against a contract you deployed once, a pull request that changes the contract's code is measured on the old deployment and shows no change. To have each pull request measured on its own code, use [Measure each commit's contract code](#measure-each-commit-s-contract-code). The workflow below suits a committed fixture.

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

## Measure each commit's contract code

Build the contract, deploy it to testnet and write the fixture against that deployment in every run, before Budget Gate. A pull request is then measured on its own code, and the default branch's runs measure (and save as the baseline) the default branch's code.

1. Copy [`build-fixture.sh`](https://github.com/BudgetGate/soroban-budget-action/blob/main/examples/build-fixture.sh) to `budget/build-fixture.sh` and make it executable. Set:
   - `WASM`: the file `stellar contract build` writes, for example `target/wasm32v1-none/release/my_contract.wasm`;
   - `CALLS`: one line per call to measure, the function name then its arguments as for `stellar contract invoke`, for example `"transfer --from {ADDRESS} --to {ADDRESS} --amount 10"`. `{ADDRESS}` becomes the run's funded address;
   - `CONSTRUCTOR_ARGS`, if your contract has a constructor.
2. Pin Rust in `rust-toolchain.toml`, so the baseline and every pull request compile the same wasm. A different Rust version compiles slightly different wasm and moves the measured cost (in the test repository, 449,013 instead of 449,005 CPU instructions for the same code):

   ```toml
   [toolchain]
   channel = "1.97.1"
   targets = ["wasm32v1-none"]
   ```
3. Add the CLI and the script before the Action ([`measure-contract-code.yml`](https://github.com/BudgetGate/soroban-budget-action/blob/main/examples/measure-contract-code.yml)), and add `budget/fixture.json` to `.gitignore`:

   ```yaml
       steps:
         - uses: actions/checkout@v7
         - uses: stellar/stellar-cli@v28.1.0
         - name: Deploy this commit's contract and write the fixture
           run: budget/build-fixture.sh
         - uses: BudgetGate/soroban-budget-action@v0.2.2
           with:
             fixture-path: budget/fixture.json
             binary-version: 0.2.2
   ```

The script creates a throwaway key and funds it with friendbot, so no secrets are needed, and it retries testnet steps that time out. Because every run deploys a fresh contract, a testnet reset does not break it. Fixture calls are simulated, never submitted, so every call sees the contract's storage as it is right after deployment. To measure a function with state in place (balances, an initialised config), add real `stellar contract invoke` commands without `--build-only` to the script after the deploy and before the fixture is written. The CLI install, build and deploy took 56–63 seconds per run in the test repository.

Tested in [BudgetGate/budgetgate-action-test](https://github.com/BudgetGate/budgetgate-action-test) (2026-10-29), with the script used as published apart from `WASM` and `CALLS`: a pull request with unchanged code measured 291,573 CPU instructions, 0.00% against the baseline ([PR #10](https://github.com/BudgetGate/budgetgate-action-test/pull/10)), and a pull request that only changed the contract's Rust code reported the regression, 291,573 → 449,005 ([PR #11](https://github.com/BudgetGate/budgetgate-action-test/pull/11)).

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
