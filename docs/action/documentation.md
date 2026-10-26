# Soroban Budget Action - Documentation

## How it works

1. **Find the binary.** Uses `binary-path` if set. Otherwise, if `binary-version` is set, downloads `budget-core-linux-amd64` from the core release `v<version>` and caches it with `@actions/tool-cache`. Otherwise runs `./budget-core`.
2. **Run core.** Always passes `--baseline`. With `fixture-path`, it adds `--fixture`, `--rpc-url` (if set) and `--output-json new.json`. Without it, it passes `--new` with `new-path`, or `new.json` if that is empty.
3. **Comment.** On a pull request event, posts core's stdout as a new comment with a shields.io badge.
4. **Save.** On a push to `main` or `master`, saves `new.json` to the Actions cache under the key `budgetgate-baseline-<sha>`.

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `github-token` | No | the workflow's `GITHUB_TOKEN` | Token used to post the PR comment. |
| `baseline-path` | No | `baseline.json` | Baseline snapshot passed to `--baseline`. |
| `fixture-path` | No | — | Fixture to simulate. When set, `new-path` is ignored. |
| `new-path` | No | `new.json` | Existing snapshot to compare when no fixture is given. |
| `rpc-url` | No | core's default (testnet) | RPC endpoint, used only with `fixture-path`. |
| `binary-path` | No | `./budget-core` | Path to a `budget-core` binary. |
| `binary-version` | No | — | Core release to download. Fails today: core has no releases. |

## Outputs

| Output | Description |
|---|---|
| `regression_detected` | `"true"` if core's report contains `❌ REGRESSION` or core exited non-zero, otherwise `"false"`. |

## PR comment

The comment contains a heading, a "Passing" or "Regression Detected" badge, and core's full stdout, which is the report table. See the [report format](/core/api-reference#report).

## Known limitations

- **Errors look like regressions.** Any non-zero exit from core, including a missing baseline file or an RPC failure, is reported as a regression. Core prints its errors to stdout, so the error text ends up in the PR comment.
- **A comment on every run.** Each run posts a new comment; it does not update an earlier one.
- **The saved baseline is never used.** `new.json` is saved to the cache on `main`, but nothing restores it. Pull requests still need a baseline file in the repository.
- **Comment failures fail the step.** If the token cannot post comments (for example, on pull requests from forks), the step fails.
- **No retries.** An RPC failure fails the run on the first attempt.
