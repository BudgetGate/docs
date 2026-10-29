# GitHub Action

`soroban-budget-action` runs [`soroban-budget-core`](/core/) in a GitHub workflow, posts its report as a pull request comment, and fails the step when core reports a regression.

## What it does

- Runs core with your baseline and either a fixture (simulated over RPC) or an existing snapshot.
- On a pull request, keeps one comment with the report table and a pass/fail badge, updated on every run.
- Sets the `regression_detected` output and fails the step on a regression (core exit `1`).
- Fails the step with core's error message when core can't compare (exit `2`), and replaces the PR comment with a note that the latest run failed.
- Keeps the baseline for you: each push to the default branch saves the measured snapshot to the Actions cache, and pull requests compare against it. A committed baseline file can be used instead.

::: warning Status
Core v0.2.3 is released, and `binary-version: 0.2.3` downloads the runner's binary on Linux, macOS and Windows, on x64 and arm64; downloads on all six ran in real workflows and on real pull requests with v0.2.2 (see [Workflow Setup](/action/setup#tested)), and v0.2.3 has run on Linux x64. The Action's latest release is [v0.2.2](https://github.com/BudgetGate/soroban-budget-action/releases/tag/v0.2.2).
:::
