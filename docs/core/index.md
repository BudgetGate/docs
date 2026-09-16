# Core CLI (`soroban-budget-core`)

The `soroban-budget-core` repository contains the Go-based CLI tool responsible for executing simulated transactions against a testnet/mainnet RPC to gather resource footprints. 

It is designed to be fast, lightweight, and completely stateless. It does not require a database; it simply takes an XDR fixture as input, asks the Stellar network how much it would cost to execute, and outputs the result as a JSON file.

## Why a standalone CLI?

By decoupling the simulation logic from the GitHub Action, we ensure that:
1. Developers can run the exact same checks locally on their machines before pushing code.
2. The core logic can be integrated into other CI/CD pipelines (e.g., GitLab CI, Jenkins) in the future.
3. The XDR parsing and delta threshold calculations are centralized in a strongly-typed language (Go) for maximum safety and performance.

## Local Setup

```bash
git clone https://github.com/BudgetGate/soroban-budget-core.git
cd soroban-budget-core
go build -o budget-core .
```

## Running the CLI

To run the CLI locally, you need to provide a JSON fixture containing the XDR representations of the contract calls you want to simulate.

```bash
export RPC_URL="https://soroban-testnet.stellar.org"
./budget-core --fixture ./test_fixture.json --output-json ./baseline.json --network testnet
```

### Understanding the output
The CLI will generate a `baseline.json` file. If you also provided a `--baseline` flag (pointing to a previous run's output), the CLI will compare the two and exit with a non-zero status code if the new run exceeds the old run's metrics by more than the `--max-delta-pct` threshold!
