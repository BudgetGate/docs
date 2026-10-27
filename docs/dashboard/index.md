# Dashboard (`soroban-budget-dashboard`)

`soroban-budget-dashboard` is a React and Vite web app that charts a history of BudgetGate snapshots over time. It runs entirely in the browser, with no backend.

The deployed app is at [budgetgate-dashboard.vercel.app](https://budgetgate-dashboard.vercel.app/).

::: info Sample data until you load your own
Until you enter a data source URL, the dashboard shows built-in sample snapshots under a **Sample data** note. They are examples, not measurements of any contract.
:::

## Data source

Enter a URL in the `DATASOURCE_URL` box. Two forms are accepted:

- `https://...`: any URL that returns the history JSON.
- `github://owner/repo/branch/path/to/history.json`: a file read from a public GitHub repository through the GitHub REST API, without authentication. Unauthenticated requests are limited to 60 per hour per IP address.

The file must be a history: an object with a `snapshots` array, each entry a [core snapshot](/core/api-reference#snapshot-format) with `schema_version` `1.0` or `2.0`. Any other version is rejected with an error. When GitHub rate-limits the request, the page says so and shows when to try again.

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
