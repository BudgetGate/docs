# API & CLI Reference

## Core CLI (`soroban-budget-core`)

The core Go binary is the workhorse of BudgetGate. 

### Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--fixture` | `string` | `""` | **Required.** Path to the JSON fixture defining the simulated transactions. |
| `--output-json` | `string` | `""` | Path to save the resulting `snapshot.json`. Necessary for GitHub action caching. |
| `--baseline` | `string` | `""` | Path to a previous `snapshot.json` to calculate regression deltas. |
| `--max-delta-pct` | `float` | `10.0` | The maximum percentage increase allowed for any resource before failing the CI check. |
| `--network` | `string` | `"testnet"` | The network limits to enforce (`testnet`, `mainnet`). Determines absolute caps. |

### Request Shapes

The JSON `fixture.json` expects the following schema:
\`\`\`json
[
  {
    "function_name": "mint",
    "xdr": "AAAAAgAAAA..."
  }
]
\`\`\`

### Response Shapes

The tool outputs a \`snapshot.json\` conforming to:
\`\`\`json
{
  "functions": {
    "mint": {
      "CPUInstructions": 10500,
      "MemoryBytes": 2048,
      "ReadBytes": 512,
      "WriteBytes": 128
    }
  }
}
\`\`\`
