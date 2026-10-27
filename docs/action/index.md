# GitHub Action

`soroban-budget-action` runs [`soroban-budget-core`](/core/) in a GitHub workflow, posts its report as a pull request comment, and fails the step when core reports a regression.

## What it does

- Runs core with your baseline and either a fixture (simulated over RPC) or an existing snapshot.
- On a pull request, keeps one comment with the report table and a pass/fail badge, updated on every run.
- Sets the `regression_detected` output and fails the step on a regression (core exit `1`).
- Fails the step with core's error message when core can't compare (exit `2`), and replaces the PR comment with a note that the latest run failed.
- Keeps the baseline for you: each push to the default branch saves the measured snapshot to the Actions cache, and pull requests compare against it. A committed baseline file can be used instead.

::: warning Status
There are no releases of the Action or of core yet, and the `binary-version` input cannot work until core publishes one. See [Workflow Setup](/action/setup) for a workflow that builds core from source.
:::
