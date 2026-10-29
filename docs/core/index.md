# Core CLI (`soroban-budget-core`)

`soroban-budget-core` is a Go CLI. It reads a fixture of contract calls, simulates each one with the Soroban RPC method `simulateTransaction`, compares the measured cost with a baseline snapshot, and prints the comparison as a Markdown table.

It keeps no state of its own. Every run takes a baseline file and produces a new snapshot.

## Why a standalone CLI?

- You can run the same check locally that CI runs.
- Other CI systems can call it directly.
- The measurement and comparison logic lives in one place.

## Install

### Download a release

[v0.2.0](https://github.com/BudgetGate/soroban-budget-core/releases/tag/v0.2.0) is the first release. It contains a static Linux x86-64 binary and a checksum file:

```bash
curl -sSLO https://github.com/BudgetGate/soroban-budget-core/releases/download/v0.2.0/budget-core-linux-amd64
curl -sSLO https://github.com/BudgetGate/soroban-budget-core/releases/download/v0.2.0/SHA256SUMS
sha256sum -c SHA256SUMS
chmod +x budget-core-linux-amd64 && mv budget-core-linux-amd64 budget-core
```

### Build from source

On other platforms, build with Go 1.26.10 or later (core's `go.mod` requires it; an older Go downloads 1.26.10 itself unless `GOTOOLCHAIN=local` is set):

```bash
git clone https://github.com/BudgetGate/soroban-budget-core.git
cd soroban-budget-core
go build -o budget-core .
```

## First run

`--baseline` is always required. For the first run, use an empty baseline and save the result as your real baseline:

```bash
echo '{"schema_version":"2.0","functions":[]}' > empty.json
./budget-core --baseline empty.json --fixture fixture.json --output-json baseline.json
```

Every function is listed as `🆕 NEW`, with its measured values, because there is nothing to compare against yet. `baseline.json` now holds the measured cost of every fixture entry.

## Checking a change

After changing the contract, regenerate the fixture XDR if needed and compare against the saved baseline:

```bash
./budget-core --baseline baseline.json --fixture fixture.json --output-json new.json
```

The CLI exits `1` if any metric rose more than `--max-delta-pct` (default `10`). `new.json` can become the next baseline.

`testdata/fixture.json` in the repository is a working example against testnet, and `testdata/snapshot_testnet.json` is a snapshot core measured from it, so you can try the CLI without writing a fixture:

```bash
./budget-core --baseline testdata/snapshot_testnet.json --fixture testdata/fixture.json
```

After a testnet reset the fixture's account no longer exists; regenerate it with `go run ./cmd/genfixture > testdata/fixture.json`.

See the [API & CLI Reference](/core/api-reference) for flags and file formats, and [In-Depth Documentation](/core/documentation) for how the numbers are measured.
