# Core CLI

The `soroban-budget-core` repository contains the Go-based CLI tool responsible for executing simulated transactions against a testnet/mainnet RPC to gather resource footprints.

## Local Setup

```bash
git clone https://github.com/BudgetGate/soroban-budget-core.git
cd soroban-budget-core
go build -o budget-core .
```

## Running the CLI

```bash
export RPC_URL="https://soroban-testnet.stellar.org"
./budget-core --fixture ./test_fixture.json --output-json ./baseline.json --network testnet
```
