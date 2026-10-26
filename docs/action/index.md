# GitHub Action

`soroban-budget-action` runs [`soroban-budget-core`](/core/) in a GitHub workflow, posts its report as a pull request comment, and fails the step when core reports a regression.

## What it does

- Runs core with your baseline and either a fixture (simulated over RPC) or an existing snapshot.
- On a pull request, posts the report table as a comment with a pass/fail badge.
- Sets the `regression_detected` output and fails the step on a regression (core exit `1`).
- Fails the step with core's error message, without commenting, when core can't compare (exit `2`).
- On a push to `main` or `master`, saves `new.json` to the Actions cache.

::: warning Status
There are no releases of the Action or of core yet, and the `binary-version` input cannot work until core publishes one. See [Workflow Setup](/action/setup) for a workflow that builds core from source.
:::
