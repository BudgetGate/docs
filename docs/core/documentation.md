# Soroban Budget Core - Documentation

How `soroban-budget-core` measures cost, compares snapshots, and where it falls short today.

## Measurement

For each fixture entry, core calls `simulateTransaction` on the RPC and decodes the returned `transactionData` XDR with the Stellar Go SDK.

### CPU instructions

The instruction count an RPC returns is what it recommends *declaring*, not what was used: the simulation's usage plus `max(instructionLeeway, provider pad)`. On soroban-testnet the pad is 50,000, which hides real changes. A 10% increase in a function that uses 91,406 instructions shows up as about 6.5%.

Core removes the pad by simulating each entry twice, with `instructionLeeway` set to 1,000,000 and to 2,000,000, and subtracting:

```
used = declared(1,000,000) − 1,000,000
```

It checks that the two declared values differ by exactly 1,000,000. If they don't, the provider pads some other way, and core stops with an error instead of reporting a wrong number. Each fixture entry therefore costs two RPC calls.

The result is what the **simulation** used. Executing the same call uses slightly fewer instructions. On testnet (protocol 29, 2026-10-29), three calls that core measured were then submitted, and the instructions each one used were read from the transaction's `core_metrics` diagnostic events:

| Call | Core (simulated) | Executed |
|---|---|---|
| A counter `bump` (one storage write) | 291,573 | 288,297 (−1.14%) |
| A `deposit` with a constructor-set limit and `require_auth` | 411,511 | 409,658 (−0.45%) |
| A `relay` that calls the counter | 559,224 | 555,007 (−0.76%) |

Read and write bytes and entries matched exactly, and each transaction declared core's figure plus the CLI's 50,000 leeway. Both sides of a comparison are simulated, so regressions and percentages are unaffected; treat the figure as slightly above what execution uses, and not as what a transaction declares or pays for. A simulation response does not include `core_metrics`, so core cannot report the executed figure without submitting transactions, which it never does.

### Read and write bytes

`read_bytes` is the RPC's `diskReadBytes`. Since protocol 23, reads of live contract storage are not charged as disk reads, so **`read_bytes` does not change when a contract reads more of its own storage.** Use `read_entries` for that.

`write_bytes` is the bytes written by the transaction.

### Footprint entries

`read_entries` is the number of ledger entries in the transaction's footprint (read-only plus read-write); `write_entries` is the number of read-write entries. They come from the decoded footprint and are the signal for added storage access.

### Memory

Current `simulateTransaction` responses do not report memory. `memory_bytes` is recorded as `null` and is not compared.

### Archived contract state

A contract and its wasm are archived when their TTL runs out; on testnet the minimum for persistent entries is 120,960 ledgers, about 7 days. Since protocol 23 a simulation restores archived entries automatically, and its figures include that work. They are not the cost of the call: on testnet at protocol 30 a counter measured 474,777 CPU instructions and 788 write bytes archived, and 291,573 and 80 live.

So since v0.2.4 ([core #79](https://github.com/BudgetGate/soroban-budget-core/pull/79)), a fixture run that would restore entries stops with exit code `2`, prints no report and writes no snapshot. v0.2.3 and earlier report the inflated figures, which show as a regression the code did not cause.

Building and deploying the contract in each run avoids this. For a fixture that calls an existing deployment, keep it alive. Restore both the contract and its wasm, since `--id` alone leaves the wasm archived, then extend both:

```bash
stellar contract restore --id <contract> --source <key> --network testnet
stellar contract restore --wasm-hash <hash> --source <key> --network testnet
stellar contract extend --id <contract> --ledgers-to-extend 1500000 --source <key> --network testnet
stellar contract extend --wasm-hash <hash> --ledgers-to-extend 1500000 --source <key> --network testnet
```

## Comparison

Functions are matched by `name`. For each compared metric:

```
delta    = new − baseline
% change = delta / baseline × 100
```

If the baseline value is `0` and the new value is higher, the change counts as 100% for the regression check; after v0.2.4 the report shows `from 0` instead of a percentage. A metric is a regression when `% change > --max-delta-pct`, or when `delta` is above that metric's `--max-*-increase` limit. Absolute limits are per metric because the scales differ: CPU is in the hundreds of thousands, entry counts in single digits.

### Network caps

The `% of Cap` column divides the new value by the network's per-transaction limit for that metric. Core reads the limits from `--rpc-url` on every run, with one `getLedgerEntries` call for the network's config settings and one `getNetwork` call for the protocol version, so they follow protocol upgrades and match the network you test against. Nothing is hardcoded.

| Metric | Network limit | Testnet, protocol 29 |
|---|---|---|
| CPUInstructions | `txMaxInstructions` | 400,000,000 |
| ReadBytes | `txMaxDiskReadBytes` | 200,000 |
| WriteBytes | `txMaxWriteBytes` | 132,096 |
| ReadEntries | `txMaxFootprintEntries` | 400 |
| WriteEntries | `txMaxWriteLedgerEntries` | 200 |

`read_entries` counts every footprint entry, so its limit is the footprint limit, not the disk-read-entries limit.

If the limits can't be read, the run stops with exit code `2`; core never falls back to built-in numbers. A `--new` run with `--cap-warning-pct 0` skips the lookup and needs no network; `% of Cap` then shows `n/a`.

Going above `--cap-warning-pct` (default 80%) of a cap shows a warning. It fails the run only with `--fail-on-cap-warning`. A transaction over a real limit is expected to fail in simulation itself, which core reports as an error (exit `2`).

## Known limitations

- Measuring a changed contract has been verified on testnet only. On mainnet, a read-only call measured the same on three public RPC providers (91,406 CPU instructions, caps read at protocol 29, `network: mainnet`); see core's README. Any Soroban RPC that serves `simulateTransaction`, `getLedgerEntries` and `getNetwork` works, and each fixture entry's source account must exist on that network.
- Memory is not measured: simulation responses do not report it, so snapshots record `memory_bytes` as `null` and it is never compared. Executed transactions do report it, in their `core_metrics` events, and it repeated exactly: the counter's v1 used 1,134,567 bytes in four runs and v2 1,150,869 in three (testnet, protocol 30, 2026-11-06). Reading it would mean submitting each call, which needs a funded key; that is not built.
- A contract's cost depends on its stored state, and a fixture measures whatever state the contract is in. On a fresh counter, `bump` simulated at 291,573 instructions before any real call and 301,254 once a real call had stored its count (testnet, protocol 30, 2026-11-06); bytes and entries did not change. Deploy the contract fresh in each run, as the Action's example workflow does, so both sides of a comparison start from the same state.
- The CPU figure is the simulation's usage, slightly above what an executed call uses (0.45%–1.14% in the three checks under [CPU instructions](#cpu-instructions) at protocol 29; 1.65% and 3.37% for the counter's v1 and v2 at protocol 30, with its count already stored; 2.0% for a call authorized by a second account, see [Workflow Setup](/action/setup)). Comparisons are unaffected because both sides are simulated.
