# Soroban Budget Action - Documentation

## How it works

1. **Find the binary.** Uses `binary-path` if set. Otherwise, if `binary-version` is set, downloads `budget-core-linux-amd64` from the core release `v<version>` and caches it with `@actions/tool-cache`. Otherwise runs `./budget-core`.
2. **Pick the baseline.** A file at `baseline-path`, if it exists. Otherwise the snapshot saved in the Actions cache for the PR's base commit, or the most recent one. Otherwise an empty baseline: every function shows as `🆕 NEW` and the PR comment says no baseline was found.
3. **Run core.** Passes `--baseline` with the baseline from step 2. With `fixture-path`, it adds `--fixture`, `--rpc-url` (if set) and `--output-json new.json`. Without it, it passes `--new` with `new-path`, or `new.json` if that is empty.
4. **Read the result** from core's exit code: `0` no regression, `1` regression, anything else means core could not compare. In that last case the step fails with core's error message, and nothing is commented or cached.
5. **Comment.** On a pull request event, writes core's stdout into the PR's Budget Gate comment with a shields.io badge: it updates the existing comment, or creates one on the first run.
6. **Save.** On a push to the default branch, after a result of `0` or `1`, saves the compared snapshot (`new.json`, or `new-path`) to the Actions cache under the key `budgetgate-baseline-<sha>`. Merged code is the new reference, so this happens even after a regression.

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `github-token` | No | the workflow's `GITHUB_TOKEN` | Token used to post the PR comment. |
| `baseline-path` | No | `baseline.json` | A committed baseline snapshot. Used when the file exists; otherwise the cached baseline is used. |
| `fixture-path` | No | — | Fixture to simulate. When set, `new-path` is ignored. |
| `new-path` | No | `new.json` | Existing snapshot to compare when no fixture is given. |
| `rpc-url` | No | core's default (testnet) | RPC endpoint, used only with `fixture-path`. |
| `binary-path` | No | `./budget-core` | Path to a `budget-core` binary. |
| `binary-version` | No | — | Core release to download. Fails today: core has no releases. |

## Outputs

| Output | Description |
|---|---|
| `regression_detected` | `"true"` if core exited `1` (a regression), otherwise `"false"`. Also `"false"` when core failed, so check the step's outcome too. |

## PR comment

The comment contains a heading, a "Passing" or "Regression Detected" badge, and core's full stdout, which is the report table. See the [report format](/core/api-reference#report).

There is one Budget Gate comment per pull request. Its first line is a hidden marker, `<!-- budgetgate-report -->`. Each run looks for a comment containing the marker and updates it, so the PR always shows the latest result instead of a new comment per push. Editing or deleting the marker makes the next run post a fresh comment.

## Known limitations

- **A failed run leaves the last report in place.** When core can't compare, the step fails but the comment still shows the previous run's result. Check the step's status for the latest outcome.
- **Cache lifetime.** GitHub evicts cache entries that haven't been used for 7 days. A repository with no default-branch pushes for longer loses its cached baseline, and the next PR shows the "no baseline" note until the default branch runs again.
- **Comment failures fail the step.** If the token cannot post comments (for example, on pull requests from forks), the step fails.
- **No retries.** An RPC failure fails the run on the first attempt.
