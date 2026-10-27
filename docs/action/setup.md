# Workflow Setup

Core has no releases yet, so the workflow builds it from source and passes the binary to the Action with `binary-path`.

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
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: '1.25'

      - name: Build soroban-budget-core
        run: |
          git clone --depth 1 https://github.com/BudgetGate/soroban-budget-core.git "$RUNNER_TEMP/core"
          cd "$RUNNER_TEMP/core" && go build -o budget-core .

      - name: Run Soroban Budget Guard
        uses: BudgetGate/soroban-budget-action@main
        with:
          binary-path: ${{ runner.temp }}/core/budget-core
          fixture-path: budget/fixture.json
```

`@main` follows the Action's latest code. Pin a commit SHA if you need a fixed version.

Until the first push to the default branch has run, there is no baseline: the PR comment says so, and every function is shown as `🆕 NEW`.

## Committing the baseline instead

If you'd rather keep the baseline in the repository, create it locally as shown in [First run](/core/#first-run), commit it, and pass its path:

```yaml
        with:
          binary-path: ${{ runner.temp }}/core/budget-core
          baseline-path: budget/baseline.json
          fixture-path: budget/fixture.json
```

A baseline file that exists always wins over the cache. To update it after an intended cost change, rerun core locally with `--output-json budget/baseline.json` and commit the result.

::: warning
This workflow has not yet been tested end-to-end in a separate repository, and the cache round trip (save on a push, restore on a pull request) has not yet run on GitHub.
:::
