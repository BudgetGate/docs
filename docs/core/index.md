# Core CLI (`soroban-budget-core`)

`soroban-budget-core` is a Go CLI. It reads a fixture of contract calls, simulates each one with the Soroban RPC method `simulateTransaction`, compares the measured cost with a baseline snapshot, and prints the comparison as a Markdown table.

It keeps no state of its own. Every run takes a baseline file and produces a new snapshot.

## Why a standalone CLI?

- You can run the same check locally that CI runs.
- Other CI systems can call it directly.
- The measurement and comparison logic lives in one place.

## Install

There are no releases yet. Build from source with Go 1.25 or later:

```bash
git clone https://github.com/BudgetGate/soroban-budget-core.git
cd soroban-budget-core
go build -o budget-core .
```

::: warning
The repository contains a committed `budget-core` binary. It predates the current code and does not work. Build your own as shown above.
:::

## First run

`--baseline` is always required. For the first run, use an empty baseline and save the result as your real baseline:

```bash
echo '{"schema_version":"2.0","functions":[]}' > empty.json
./budget-core --baseline empty.json --fixture fixture.json --output-json baseline.json
```

The table is empty because there is nothing to compare against. `baseline.json` now holds the measured cost of every fixture entry.

## Checking a change

After changing the contract, regenerate the fixture XDR if needed and compare against the saved baseline:

```bash
./budget-core --baseline baseline.json --fixture fixture.json --output-json new.json
```

The CLI exits `1` if any metric rose more than `--max-delta-pct` (default `10`). `new.json` can become the next baseline.

`fixture.json` in the repository is a working example against testnet. Regenerate it with `go run ./cmd/genfixture > fixture.json` after a testnet reset.

See the [API & CLI Reference](/core/api-reference) for flags and file formats, and [In-Depth Documentation](/core/documentation) for how the numbers are measured.
