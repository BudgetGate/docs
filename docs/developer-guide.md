# Developer Guide

## Local Setup

BudgetGate is composed of three interconnected modules. To deploy the entire architecture:

### 1. `soroban-budget-core`
The Go CLI tool that parses XDR and interrogates the Soroban RPC.
```bash
git clone https://github.com/BudgetGate/soroban-budget-core.git
cd soroban-budget-core
go build -o budget-core .
```

### 2. `soroban-budget-action`
The GitHub Action that caches baseline outputs.
```bash
git clone https://github.com/BudgetGate/soroban-budget-action.git
cd soroban-budget-action
npm install && npm run build
```

### 3. `soroban-budget-dashboard`
The React/Vite dashboard for historical visualization.
```bash
git clone https://github.com/BudgetGate/soroban-budget-dashboard.git
cd soroban-budget-dashboard
npm install && npm run dev
```

## Environment Variables

For local simulation, you only need to provide the target RPC URL.
\`\`\`bash
export RPC_URL="https://soroban-testnet.stellar.org"
\`\`\`

## Real Code Examples

Running the core CLI tool directly against a deployed testnet contract:

\`\`\`bash
./budget-core --fixture ./test_fixture.json --output-json ./baseline.json --network testnet
\`\`\`

The \`test_fixture.json\` must contain an array of Soroban function calls in XDR format.
