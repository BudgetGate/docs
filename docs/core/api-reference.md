# API & CLI Reference

## Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--baseline` | string | — | **Required.** Path to the baseline snapshot JSON. |
| `--fixture` | string | — | Path to a fixture JSON. Each entry is simulated over RPC. Takes precedence over `--new`. |
| `--new` | string | — | Path to an existing snapshot JSON to compare instead of simulating. |
| `--rpc-url` | string | `https://soroban-testnet.stellar.org` | Soroban RPC endpoint used with `--fixture`. |
| `--output-json` | string | — | Where to write the new snapshot. If it cannot be written, the run exits `2`. |
| `--max-delta-pct` | float | `10` | A metric is a regression when it rises by more than this percentage. `0` turns the check off. |
| `--max-cpu-increase` | int | `0` | A regression when CPU instructions rise by more than this many. `0` turns it off. |
| `--max-read-bytes-increase` | int | `0` | Same for read bytes. |
| `--max-write-bytes-increase` | int | `0` | Same for write bytes. |
| `--max-read-entries-increase` | int | `0` | Same for read entries. |
| `--max-write-entries-increase` | int | `0` | Same for write entries. |
| `--cap-warning-pct` | float | `80` | Show `⚠️ CAP WARNING` when a metric is above this percentage of its built-in cap. `0` turns it off. |

One of `--fixture` or `--new` is required. Negative threshold values are rejected with exit code `2`. A metric regresses if it breaks either its percentage limit or its absolute limit.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | No regression. Also `-h`. |
| `1` | At least one metric regressed. |
| `2` | The run could not compare: missing or undefined flags, an unreadable or invalid file, an unsupported `schema_version`, an RPC failure, or a `--output-json` file that could not be written. |

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
| `name` | Function or test name. Snapshots are matched on this. |
| `fixture_id` | Identifier copied into the snapshot. |
| `xdr` | Base64 transaction envelope XDR that invokes the contract. |

`stellar contract invoke ... --build-only -- <function>` prints a suitable XDR.

## Snapshot format

Schema version `2.0`. Core writes `2.0` and reads `1.0` and `2.0` snapshots, as a baseline or with `--new`. A `1.0` baseline compares cleanly: its memory value is ignored, and missing entry counts show as `➖ NOT REPORTED`. Any other version, or none, stops the run with exit code `2`.

Snapshots written before 2.0 existed say `1.0` even when they contain the newer fields. Version history: [`SCHEMA.md`](https://github.com/BudgetGate/soroban-budget-core/blob/main/SCHEMA.md#versions).

```json
{
  "schema_version": "2.0",
  "network": "testnet",
  "generated_at": "",
  "commit_sha": "dynamic",
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
      "pct_of_network_cap": 0
    }
  ]
}
```

| Field | Description |
|---|---|
| `cpu_instructions` | Actual CPU instructions used (see [measurement](/core/documentation#cpu-instructions)). |
| `memory_bytes` | `null` when the RPC does not report memory, which current RPCs do not. Not compared. |
| `read_bytes` | The RPC's `diskReadBytes`. Does not include reads of live contract storage. |
| `write_bytes` | Bytes written. |
| `read_entries` | Number of ledger entries in the footprint (read-only plus read-write). |
| `write_entries` | Number of read-write footprint entries. |
| `pct_of_network_cap` | Not populated; always `0`. |

When core simulates a fixture, `network` is always `"testnet"`, `commit_sha` is always `"dynamic"` and `generated_at` is empty, whatever RPC you use.

## Report

Core prints one row per function and metric:

```
| Function | Metric | Baseline | New | Delta | % Change | % of Cap | Status |
|----------|--------|----------|-----|-------|----------|----------|--------|
| balance_check | CPUInstructions | 91406 | 91406 | 0 | 0.00% | 0.09% | ✅ OK |
```

Metrics compared: `CPUInstructions`, `ReadBytes`, `WriteBytes`, `ReadEntries`, `WriteEntries`.

| Status | Meaning |
|---|---|
| `✅ OK` | Within the threshold. |
| `❌ REGRESSION` | Rose by more than `--max-delta-pct`, or by more than its `--max-*-increase` limit. Fails the run. |
| `⚠️ CAP WARNING` | Above `--cap-warning-pct` (default 80%) of the built-in cap. Does not fail the run. |
| `➖ NOT REPORTED` | Missing from the baseline or the new snapshot (for example, a baseline written before entry counts existed). |
| `🆕 NEW` | The function is not in the baseline. The row shows its value and `% of Cap`; `Baseline`, `Delta` and `% Change` are `n/a`. Can carry `& ⚠️ CAP WARNING`. Never fails the run. |
| `🗑️ REMOVED` | The function is in the baseline but not in the new snapshot. One row with `—` as the metric. Never fails the run. |

A renamed function shows up as one `🆕 NEW` function and one `🗑️ REMOVED` function.
