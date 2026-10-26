# Dashboard (`soroban-budget-dashboard`)

`soroban-budget-dashboard` is a React and Vite web app that charts a history of BudgetGate snapshots over time. It runs entirely in the browser, with no backend.

The deployed app is at [budgetgate-dashboard.vercel.app](https://budgetgate-dashboard.vercel.app/).

::: warning The numbers you see are sample data
Until you enter a data source URL, the dashboard shows built-in sample snapshots, and the page does not label them as sample data. The "demo" button adds a made-up snapshot with CPU raised 25% and memory 15%. Neither is a real measurement.
:::

## Data source

Enter a URL in the `DATASOURCE_URL` box. Two forms are accepted:

- `https://...`: any URL that returns the history JSON.
- `github://owner/repo/branch/path/to/history.json`: a file read from a public GitHub repository through the GitHub REST API, without authentication. Unauthenticated requests are limited to 60 per hour per IP address.

The file must be a history: an object with a `snapshots` array, each entry a [core snapshot](/core/api-reference#snapshot-format).

```json
{ "snapshots": [ { "schema_version": "1.0", "commit_sha": "…", "functions": [ … ] } ] }
```

::: warning
Nothing in BudgetGate produces this history file yet. Core writes one snapshot per run, and the Action saves it to the Actions cache, which the dashboard cannot read. You have to build the file yourself from saved snapshots.
:::

## Local development

```bash
git clone https://github.com/BudgetGate/soroban-budget-dashboard.git
cd soroban-budget-dashboard
npm ci
npm run dev
```
