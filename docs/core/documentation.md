# Soroban Budget Core - Documentation

How `soroban-budget-core` measures cost, compares snapshots, and where it falls short today.

## Measurement

For each fixture entry, core calls `simulateTransaction` on the RPC and decodes the returned `transactionData` XDR with the Stellar Go SDK.

### CPU instructions

The instruction count an RPC returns is what it recommends *declaring*, not what was used: actual usage plus `max(instructionLeeway, provider pad)`. On soroban-testnet the pad is 50,000, which hides real changes. A 10% increase in a function that uses 91,406 instructions shows up as about 6.5%.

Core removes the pad by simulating each entry twice, with `instructionLeeway` set to 1,000,000 and to 2,000,000, and subtracting:

```
actual = declared(1,000,000) − 1,000,000
```

It checks that the two declared values differ by exactly 1,000,000. If they don't, the provider pads some other way, and core stops with an error instead of reporting a wrong number. Each fixture entry therefore costs two RPC calls.

### Read and write bytes

`read_bytes` is the RPC's `diskReadBytes`. Since protocol 23, reads of live contract storage are not charged as disk reads, so **`read_bytes` does not change when a contract reads more of its own storage.** Use `read_entries` for that.

`write_bytes` is the bytes written by the transaction.

### Footprint entries

`read_entries` is the number of ledger entries in the transaction's footprint (read-only plus read-write); `write_entries` is the number of read-write entries. They come from the decoded footprint and are the signal for added storage access.

### Memory

Current `simulateTransaction` responses do not report memory. `memory_bytes` is recorded as `null` and is not compared.

## Comparison

Functions are matched by `name`. For each compared metric:

```
delta    = new − baseline
% change = delta / baseline × 100
```

If the baseline value is `0` and the new value is higher, the change counts as 100%. A metric is a regression when `% change > --max-delta-pct`.

The `% of Cap` column divides the new value by a built-in cap: 100,000,000 CPU instructions, 10,000,000 read bytes, 1,000,000 write bytes. These values have no documented source or protocol version and may not match the network's real limits. Entry counts have no cap and always show `0.00%`. Going above 80% of a cap shows a warning but never fails the run.

## Known limitations

- Runtime errors exit `1`, the same code as a regression.
- Errors and progress text go to stdout, mixed with the report.
- Functions that are only in the new snapshot, or only in the baseline, are skipped without a message.
- `network`, `commit_sha` and `generated_at` in snapshots are placeholders.
- Only one threshold is configurable; the cap warning level is fixed at 80%.
- If writing `--output-json` fails, the error is ignored.
