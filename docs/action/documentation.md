# Soroban Budget Action - Documentation

## How it works

1. **Find the binary.** Uses `binary-path` if set. Otherwise, if `binary-version` is set, downloads `budget-core-linux-amd64` and `SHA256SUMS` from the core release `v<version>`, fails the step if the binary's SHA-256 is missing from `SHA256SUMS` or differs from it, and caches it with `@actions/tool-cache`. On a runner that is not Linux x64 it fails before downloading, because releases contain no other binary. Otherwise runs `./budget-core`.
2. **Pick the baseline.** A file at `baseline-path`, if it exists. Otherwise the snapshot saved in the Actions cache for the PR's base commit, or the most recent one. Otherwise an empty baseline: every function shows as `🆕 NEW` and the PR comment says no baseline was found.
3. **Run core.** Passes `--baseline` with the baseline from step 2. With `fixture-path`, it adds `--fixture`, `--rpc-url` (if set), `--output-json new.json` and `--commit-sha` with the workflow's commit, so the snapshot records which commit it measured. Without it, it passes `--new` with `new-path`, or `new.json` if that is empty.
4. **Read the result** from core's exit code: `0` no regression, `1` regression, anything else means core could not compare. In that last case the step fails with core's error message, nothing is cached, and on a pull request the comment is replaced with a "latest run failed" note (see below).
5. **Comment.** On a pull request event, writes core's stdout into the PR's Budget Gate comment with a shields.io badge: it updates the existing comment, or creates one on the first run.
6. **Save.** On a push to the default branch, after a result of `0` or `1`, saves the compared snapshot (`new.json`, or `new-path`) to the Actions cache under the key `budgetgate-baseline-<sha>`. Merged code is the new reference, so this happens even after a regression.
7. **History (optional).** If `history-branch` is set, the same snapshot is appended to `history.json` on that branch through the GitHub API, for the [dashboard](/dashboard/). See [Snapshot history](#snapshot-history).

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `github-token` | No | the workflow's `GITHUB_TOKEN` | Token used to post the PR comment. |
| `baseline-path` | No | `baseline.json` | A committed baseline snapshot. Used when the file exists; otherwise the cached baseline is used. |
| `fixture-path` | No | — | Fixture to simulate. When set, `new-path` is ignored. |
| `new-path` | No | `new.json` | Existing snapshot to compare when no fixture is given. |
| `rpc-url` | No | core's default (testnet) | RPC endpoint, used only with `fixture-path`. |
| `binary-path` | No | `./budget-core` | Path to a `budget-core` binary. |
| `history-branch` | No | — (off) | Branch that keeps `history.json` for the dashboard, for example `budgetgate-history`. Needs `contents: write`. |
| `binary-version` | No | — | Core release to download, for example `0.2.1` (the latest release; avoid `0.2.0`, built with a Go version that has known vulnerabilities). Releases only contain `budget-core-linux-amd64`, so other runners fail with a message to use `binary-path`. The download is checked against the release's `SHA256SUMS`. |

## Outputs

| Output | Description |
|---|---|
| `regression_detected` | `"true"` if core exited `1` (a regression), otherwise `"false"`. Also `"false"` when core failed, so check the step's outcome too. |

## PR comment

The comment contains a heading, a "Passing" or "Regression Detected" badge, and core's full stdout, which is the report table. See the [report format](/core/api-reference#report).

There is one Budget Gate comment per pull request. Its first line is a hidden marker, `<!-- budgetgate-report -->`. Each run looks for a comment containing the marker and updates it, so the PR always shows the latest result instead of a new comment per push. Editing or deleting the marker makes the next run post a fresh comment.

When core can't compare (any exit code other than `0` or `1`), the same comment is replaced with a "Run Failed" badge and **The latest run failed**, core's exit code, and a link to the workflow run. The earlier report is removed, so the PR never shows a result the latest run did not produce. Core's error message is not copied into the comment, because it can include the RPC URL; it is in the step's failure message and the run log. If that comment cannot be posted, the Action logs a warning; the step fails with core's error either way.

## Snapshot history

With `history-branch: budgetgate-history` and `permissions: contents: write`, every push to the default branch that core measured (exit `0` or `1`) adds its snapshot to `history.json` on that branch:

- The file is `{"snapshots": [...]}`, oldest first, each entry a [core snapshot](/core/api-reference#snapshot-format). This is the format the [dashboard](/dashboard/) reads.
- The first run creates the branch with a single commit that has no parent, so it shares no history with your code branches.
- Only the last 200 snapshots are kept.
- A file on that branch without a `snapshots` array is left alone, with a warning.
- Any failure to write the history is a warning; the step's result does not change.

For a public repository, open the dashboard with `https://raw.githubusercontent.com/<owner>/<repo>/budgetgate-history/history.json` as the data source.

## Known limitations

- **Cache lifetime.** GitHub evicts cache entries that haven't been used for 7 days. A repository with no default-branch pushes for longer loses its cached baseline, and the next PR shows the "no baseline" note until the default branch runs again.
- **Comment failures fail the step.** If the token cannot post the report (for example, on pull requests from forks), the step fails.
- **No retries.** An RPC failure fails the run on the first attempt.
- **History writes can race.** Two default-branch runs finishing at the same moment can both read the same `history.json`; the second write is then rejected and logged as a warning, and that snapshot is missing from the history.
