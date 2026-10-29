# API & CLI Reference

## Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--baseline` | string | — | **Required.** Path to the baseline snapshot JSON. |
| `--fixture` | string | — | Path to a fixture JSON. Each entry is simulated over RPC. Takes precedence over `--new`. |
| `--new` | string | — | Path to an existing snapshot JSON to compare instead of simulating. |
| `--rpc-url` | string | `https://soroban-testnet.stellar.org` | Soroban RPC endpoint used with `--fixture`. |
| `--output-json` | string | — | Where to write the new snapshot. If it cannot be written, the run exits `2`. |
| `--commit-sha` | string | — | The commit of your contract code that was measured. Recorded in the snapshot's `commit_sha` (fixture runs). |
| `--max-delta-pct` | float | `10` | A metric is a regression when it rises by more than this percentage. `0` turns the check off. |
| `--max-cpu-increase` | int | `0` | A regression when CPU instructions rise by more than this many. `0` turns it off. |
| `--max-read-bytes-increase` | int | `0` | Same for read bytes. |
| `--max-write-bytes-increase` | int | `0` | Same for write bytes. |
| `--max-read-entries-increase` | int | `0` | Same for read entries. |
| `--max-write-entries-increase` | int | `0` | Same for write entries. |
| `--cap-warning-pct` | float | `80` | Show `⚠️ CAP WARNING` when a metric is above this percentage of the network's per-transaction cap. `0` turns it off. |
| `--fail-on-cap-warning` | bool | off | Exit `1` when any metric has a cap warning. Needs `--cap-warning-pct` above `0`. |

One of `--fixture` or `--new` is required. Negative threshold values are rejected with exit code `2`. A metric regresses if it breaks either its percentage limit or its absolute limit.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | No regression. Also `-h`. |
| `1` | At least one metric regressed, or a cap warning with `--fail-on-cap-warning`. |
| `2` | The run could not compare: missing or undefined flags, an unreadable or invalid file, an unsupported `schema_version`, a fixture or `--new` snapshot that repeats a function name, an RPC failure, or a `--output-json` file that could not be written. |

stdout carries only the Markdown report, so it can be redirected or posted as-is. Usage, progress and error messages go to stderr; on an error, stdout is empty, except when only writing `--output-json` failed: the report is printed first, then the run exits `2`.

## Fixture format

```json
[
  {
    "name": "balance_check",
    "fixture_id": "test_balance",
    "xdr": "AAAAAgAAAA..."
  }
]
```

| Field | Description |
|---|---|
| `name` | Function or test name. Snapshots are matched on this, so each entry needs its own: a fixture that repeats a name stops the run with exit code `2` before anything is simulated. To measure one function with different arguments, give each call a different name. |
| `fixture_id` | Identifier copied into the snapshot. |
| `xdr` | Base64 transaction envelope XDR that invokes the contract. |

`stellar contract invoke --id <contract> --source <key> --network testnet --build-only -- <function> [args]` prints a suitable XDR for a deployed contract. The source account must exist on the network when core simulates the call. To measure each commit's code in CI rather than a contract deployed once, see [Measure each commit's contract code](/action/setup#measure-each-commit-s-contract-code).

## Snapshot format

Schema version `2.0`. Core writes `2.0` and reads `1.0` and `2.0` snapshots, as a baseline or with `--new`. A `1.0` baseline compares cleanly: its memory value is ignored, and missing entry counts show as `➖ NOT REPORTED`. Any other version, or none, stops the run with exit code `2`.

Function names are unique within a snapshot. A `--new` snapshot that repeats one stops the run with exit code `2`. A baseline that repeats one (core did not check this before [core #45](https://github.com/BudgetGate/soroban-budget-core/pull/45), so a fixture that measured one function twice under the same name wrote such baselines) is still read: core prints a warning and compares those functions as `🆕 NEW`, since either entry would be a guess. The next baseline saved no longer has the repeat.

Snapshots written before 2.0 existed say `1.0` even when they contain the newer fields. Version history: [`SCHEMA.md`](https://github.com/BudgetGate/soroban-budget-core/blob/main/SCHEMA.md#versions).

```json
{
  "schema_version": "2.0",
  "network": "testnet",
  "generated_at": "2026-10-26T23:21:33Z",
  "commit_sha": "7810b21f631ce73302472b915992957f1317eb8f",
  "functions": [
    {
      "name": "transfer_to_contract",
      "fixture_id": "test_transfer_to_contract",
      "cpu_instructions": 218663,
      "memory_bytes": null,
      "read_bytes": 144,
      "write_bytes": 368,
      "read_entries": 3,
      "write_entries": 2,
      "pct_of_network_cap": 1
    }
  ]
}
```

| Field | Description |
|---|---|
| `cpu_instructions` | CPU instructions the simulation used, without the RPC's declaration pad; slightly above what an executed call uses (see [measurement](/core/documentation#cpu-instructions)). |
| `memory_bytes` | `null` when the RPC does not report memory, which current RPCs do not. Not compared. |
| `read_bytes` | The RPC's `diskReadBytes`. Does not include reads of live contract storage. |
| `write_bytes` | Bytes written. |
| `read_entries` | Number of ledger entries in the footprint (read-only plus read-write). |
| `write_entries` | Number of read-write footprint entries. |
| `pct_of_network_cap` | The highest percentage of any metric's network cap that the function uses (here 1%: 2 write entries of 200). Filled in when the snapshot is measured from a fixture; `0` in older snapshots. |

When core simulates a fixture, it fills in:

- `network` from the RPC's network passphrase: `testnet`, `mainnet` or `futurenet`, or the passphrase itself for any other network;
- `generated_at` with the time of the run, RFC 3339 in UTC;
- `commit_sha` with the `--commit-sha` value, or `""` if you didn't pass one.

Snapshots written by older versions of core have `"testnet"`, `""` and `"dynamic"` there, whatever network was used.

## Report

Core prints one row per function and metric:

```
| Function | Metric | Baseline | New | Delta | % Change | % of Cap | Status |
|----------|--------|----------|-----|-------|----------|----------|--------|
| balance_check | CPUInstructions | 91406 | 91406 | 0 | 0.00% | 0.02% | ✅ OK |

% of Cap uses the network's per-transaction limits at protocol 29, ledger 5406551.
```

The last line names the protocol version and ledger the caps were read at. It is left out when caps were not read, and `% of Cap` then shows `n/a`.

Metrics compared: `CPUInstructions`, `ReadBytes`, `WriteBytes`, `ReadEntries`, `WriteEntries`.

| Status | Meaning |
|---|---|
| `✅ OK` | Within the threshold. |
| `❌ REGRESSION` | Rose by more than `--max-delta-pct`, or by more than its `--max-*-increase` limit. Fails the run. |
| `⚠️ CAP WARNING` | Above `--cap-warning-pct` (default 80%) of the network's cap. Fails the run only with `--fail-on-cap-warning`. |
| `➖ NOT REPORTED` | Missing from the baseline or the new snapshot (for example, a baseline written before entry counts existed). |
| `🆕 NEW` | The function is not in the baseline. The row shows its value and `% of Cap`; `Baseline`, `Delta` and `% Change` are `n/a`. Can carry `& ⚠️ CAP WARNING`. Never fails the run. |
| `🗑️ REMOVED` | The function is in the baseline but not in the new snapshot. One row with `—` as the metric. Never fails the run. |

A renamed function shows up as one `🆕 NEW` function and one `🗑️ REMOVED` function.
