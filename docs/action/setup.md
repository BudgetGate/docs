# Workflow Setup

Include the following step in your `.github/workflows/ci.yml`:

```yaml
jobs:
  budget-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run Soroban Budget Guard
        uses: BudgetGate/soroban-budget-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          fixture-path: 'contracts/fixtures/budget.json'
          network: 'testnet'
```
