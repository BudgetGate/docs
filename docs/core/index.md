# Core CLI (`soroban-budget-core`)

`soroban-budget-core` is a Go CLI. It reads a fixture of contract calls, simulates each one with the Soroban RPC method `simulateTransaction`, compares the measured cost with a baseline snapshot, and prints the comparison as a Markdown table.

It keeps no state of its own. Every run takes a baseline file and produces a new snapshot.

## Why a standalone CLI?

- You can run the same check locally that CI runs.
- Other CI systems can call it directly.
- The measurement and comparison logic lives in one place.

## Install

### Download a release

[v0.2.3](https://github.com/BudgetGate/soroban-budget-core/releases/tag/v0.2.3) is the latest release; it rejects a fixture or `--new` snapshot that repeats a function name (exit code `2`), which earlier releases compared against the wrong baseline entry. It has static binaries for Linux, macOS and Windows on x86-64 and arm64, plus one `SHA256SUMS` file covering them: `budget-core-linux-amd64`, `budget-core-linux-arm64`, `budget-core-darwin-amd64`, `budget-core-darwin-arm64`, `budget-core-windows-amd64.exe`, `budget-core-windows-arm64.exe`. Use it rather than v0.2.0, which was built with Go 1.25.14 (known vulnerabilities in its HTTP and TLS libraries). v0.2.1 and later are built with Go 1.26.10 and measure the same.

Linux and macOS (pick your `ASSET`):

```bash
V=v0.2.3; ASSET=budget-core-linux-amd64
curl -sSLO https://github.com/BudgetGate/soroban-budget-core/releases/download/$V/$ASSET
curl -sSLO https://github.com/BudgetGate/soroban-budget-core/releases/download/$V/SHA256SUMS
sha256sum -c --ignore-missing SHA256SUMS      # macOS: shasum -a 256 -c --ignore-missing SHA256SUMS
chmod +x $ASSET && mv $ASSET budget-core
```

Windows (PowerShell; the comparison must print `True`):

```powershell
$V = 'v0.2.3'; $A = 'budget-core-windows-amd64.exe'
$R = "https://github.com/BudgetGate/soroban-budget-core/releases/download/$V"
Invoke-WebRequest "$R/$A" -OutFile $A; Invoke-WebRequest "$R/SHA256SUMS" -OutFile SHA256SUMS
$expected = ((Select-String -Path SHA256SUMS -Pattern " $A$").Line -split '\s+')[0]
(Get-FileHash $A -Algorithm SHA256).Hash.ToLower() -eq $expected
Rename-Item $A budget-core.exe
```

`--ignore-missing` is needed because `SHA256SUMS` lists all six binaries. v0.2.1 and earlier only include `budget-core-linux-amd64`.

### Build from source

To build it yourself, use Go 1.26.10 or later (core's `go.mod` requires it; an older Go downloads 1.26.10 itself unless `GOTOOLCHAIN=local` is set):

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
