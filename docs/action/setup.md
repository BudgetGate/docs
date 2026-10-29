# Workflow Setup

The Action downloads the runner's binary from core's v0.2.3 release with `binary-version: 0.2.3` and checks it against the release's `SHA256SUMS`. Linux, macOS and Windows runners work, on x64 and arm64 (core v0.2.1 and earlier only ship Linux x64). On any other runner, see [Building core yourself](#building-core-yourself).

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
          binary-version: 0.2.3
```

`v0.2.2` is the Action's latest [release](https://github.com/BudgetGate/soroban-budget-action/releases/tag/v0.2.2): the same inputs and behaviour as v0.2.1, plus macOS, Windows and Linux arm64 runners, and a cached baseline that Windows runners can restore. Tags are exact: there is no moving `v0` tag, so change the version yourself to upgrade.

Until the first push to the default branch has run, there is no baseline: the PR comment says so, and every function is shown as `🆕 NEW`.

## Measure each commit's contract code

Build the contracts, deploy them to testnet and write the fixture against those deployments in every run, before Budget Gate. A pull request is then measured on its own code, and the default branch's runs measure (and save as the baseline) the default branch's code.

1. Copy [`build-fixture.sh`](https://github.com/BudgetGate/soroban-budget-action/blob/main/examples/build-fixture.sh) to `budget/build-fixture.sh` and make it executable. Set:
   - `CONTRACTS`: one line per contract: a name for it, the wasm `stellar contract build` writes, then its constructor arguments if it has a constructor, for example `"token target/wasm32v1-none/release/token.wasm --admin {ADDRESS} --decimal 7"`. Contracts are deployed in this order;
   - `CALLS`: one line per call to measure: the name it is reported under, the contract's name from `CONTRACTS`, the function, then its arguments as for `stellar contract invoke`, for example `"transfer token transfer --from {ADDRESS} --to {ADDRESS} --amount 10"`. The baseline is matched by the reported name, so each must be unique (the script stops otherwise), and renaming one shows it as removed and added.

   - `ACCOUNTS`, if a call needs authorization from an account other than the transaction's source: one name per line, for example `"alice"`. Each gets a throwaway key funded by friendbot.

   In all three lists `{ADDRESS}` becomes the run's funded address and `{<name>}` the address of an account in `ACCOUNTS` or the ID of a contract listed above, so a contract that calls another can take its ID in its constructor (`"pool target/wasm32v1-none/release/pool.wasm --token {token}"`) or in a call. Arguments are split on spaces, so an argument cannot contain one.
2. Pin Rust in `rust-toolchain.toml`, so the baseline and every pull request compile the same wasm. A different Rust version compiles slightly different wasm and moves the measured cost (in the test repository, 449,013 instead of 449,005 CPU instructions for the same code):

   ```toml
   [toolchain]
   channel = "1.97.1"
   targets = ["wasm32v1-none"]
   ```
3. Add the build cache, the CLI and the script before the Action ([`measure-contract-code.yml`](https://github.com/BudgetGate/soroban-budget-action/blob/main/examples/measure-contract-code.yml)), and add `budget/fixture.json` to `.gitignore`:

   ```yaml
       steps:
         - uses: actions/checkout@v7
         - uses: actions/cache@v6
           with:
             path: |
               ~/.cargo/registry
               ~/.cargo/git
               target
             key: contracts-${{ runner.os }}-${{ hashFiles('rust-toolchain.toml', 'Cargo.lock') }}
         - uses: stellar/stellar-cli@v28.1.0
         - name: Deploy this commit's contracts and write the fixture
           run: budget/build-fixture.sh
         - uses: BudgetGate/soroban-budget-action@v0.2.2
           with:
             fixture-path: budget/fixture.json
             binary-version: 0.2.3
   ```

The script creates a throwaway key and funds it with friendbot, so no secrets are needed, and it retries testnet steps that time out. Because every run deploys fresh contracts, a testnet reset does not break it. Fixture calls are simulated, never submitted, so every call sees the contracts' storage as it is right after deployment (constructors have run). To measure a function with state in place (balances, an initialised config), add real `stellar contract invoke` commands without `--build-only` to the script after the deploys and before the fixture is written. A call that needs authorization works from `{ADDRESS}` (the transaction's source) and from any account in `ACCOUNTS`: the simulation records the authorization, including the other account's signature check and nonce. In the test repository a `deposit` measured 411,511 CPU instructions from the source and 1,258,736 from a second funded account, which used 1,233,282 when executed; read and write entries matched. The account must exist: authorization by an account that was never funded simulated at 497,093, which no real call can match, so list it in `ACCOUNTS` rather than typing an unfunded address.

The cache keeps downloaded crates and compiled dependencies between runs, keyed on the toolchain and `Cargo.lock`. A fresh checkout makes your contracts' sources newer than the cache, so cargo rebuilds them every run, and the wasm is byte-identical to an uncached build. In the test repository, with three contracts, the cache cut the build from about 43 to 10 seconds; the whole step (CLI install, build, three deploys) took 54–65 seconds, most of it testnet deploys.

A call into another contract costs slightly more or less depending on which of the two contract IDs sorts first. In the test repository the relay contract (which calls the counter) measured 558,474 CPU instructions whenever the counter's ID sorted after the relay's and 559,224 whenever it sorted before, across 13 fresh deployments of the same wasm; calls that stay in one contract never varied. Since the throwaway key gives new IDs every run, that order would be random, so the script deploys each contract with a salt that keeps the IDs in `CONTRACTS` order. With it, six fresh deployments all measured 559,224. Keep the order of `CONTRACTS` fixed: reordering it can move cross-contract costs by a few hundred instructions.

Tested in [BudgetGate/budgetgate-action-test](https://github.com/BudgetGate/budgetgate-action-test) (2026-10-29), with the script used as published apart from its lists: a pull request with unchanged code measured 291,573 CPU instructions, 0.00% against the baseline ([PR #10](https://github.com/BudgetGate/budgetgate-action-test/pull/10)), and a pull request that only changed the contract's Rust code reported the regression, 291,573 → 449,005 ([PR #11](https://github.com/BudgetGate/budgetgate-action-test/pull/11)). With three contracts ([PR #12](https://github.com/BudgetGate/budgetgate-action-test/pull/12)): a vault with a constructor (`--admin {ADDRESS} --limit 1000`) whose `deposit --from {ADDRESS} --amount 10` needs authorization measured 411,511 CPU instructions, and a relay given `{counter}` in its constructor, which calls the counter, measured 558,474. Changing only the counter's code raised the relay too, to 587,205 (measured on testnet before that pull request).

## Committing the baseline instead

If you'd rather keep the baseline in the repository, create it locally as shown in [First run](/core/#first-run), commit it, and pass its path:

```yaml
        with:
          binary-version: 0.2.3
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

This setup has run on GitHub in [BudgetGate/budgetgate-action-test](https://github.com/BudgetGate/budgetgate-action-test) (2026-10-28): a push to `main` downloaded core v0.2.0, saved the baseline and wrote the history; pull requests restored that baseline from the cache, posted a regression report for a contract whose cost went up, updated the same comment on the next push, and replaced it with "The latest run failed" when core could not run. Those runs used the Action's `main` at the code later tagged `v0.2.0`; a pull request run of the `@v0.2.0` tag itself then passed ([test repo PR #4](https://github.com/BudgetGate/budgetgate-action-test/pull/4)). The released `@v0.2.1` tag then passed on [test repo PR #7](https://github.com/BudgetGate/budgetgate-action-test/pull/7) (2026-10-29). Before that, core v0.2.1 ran through the Action on [test repo PR #6](https://github.com/BudgetGate/budgetgate-action-test/pull/6) (2026-10-29): downloaded, checksum matched, a regression reported for the costlier contract and the same comment updated to a pass. On 2026-10-29 the released `@v0.2.2` tag ran on `ubuntu-latest`, `ubuntu-24.04-arm`, `macos-26-intel`, `macos-latest`, `windows-latest` and `windows-11-arm` ([test repo PR #8](https://github.com/BudgetGate/budgetgate-action-test/pull/8)): each downloaded its own core v0.2.2 binary, matched the checksum, restored the baseline saved by a Linux run and reported the counter contract's regression. Core v0.2.3 then ran through `@v0.2.2` on `ubuntu-latest` ([test repo PR #14](https://github.com/BudgetGate/budgetgate-action-test/pull/14)): downloaded, checksum matched, 0.00% for all three functions against the cached baseline. The `binary-path` variant above has not been run there.
