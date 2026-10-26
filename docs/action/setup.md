# Workflow Setup

Core has no releases yet, so the workflow builds it from source and passes the binary to the Action with `binary-path`.

You need two files in your repository:

- a [fixture](/core/api-reference#fixture-format), for example `budget/fixture.json`
- a baseline snapshot, for example `budget/baseline.json`. Create it locally as shown in [First run](/core/#first-run) and commit it.

```yaml
name: Budget check

on: pull_request

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
          baseline-path: budget/baseline.json
          fixture-path: budget/fixture.json
```

`@main` follows the Action's latest code. Pin a commit SHA if you need a fixed version.

To update the baseline after an intended cost change, rerun core locally with `--output-json budget/baseline.json` and commit the result.

::: warning
This workflow has not yet been tested end-to-end in a separate repository.
:::
