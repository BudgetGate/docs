# Soroban Budget Dashboard - Documentation

## Stack

React 19, Vite, TypeScript, Tailwind CSS, Recharts for charts, `@octokit/rest` for GitHub access, and React Router.

## Structure

- `src/App.tsx`: routes `/` to `Dashboard`.
- `src/pages/Dashboard.tsx`: the dashboard. Holds the loaded history, the selected function and the data source URL.
- `src/api.ts`: `fetchSnapshotHistory(url)` and the built-in sample history.
- `src/metrics.ts`: turns snapshots into chart points, one value per metric per snapshot, and into the rows of the per-function tables.
- `src/components/MetricChart.tsx`: one chart per unit.
- `src/components/FunctionTables.tsx`: the per-function tables under the charts.
- `src/trends.ts` and `src/components/TrendAlerts.tsx`: the trend rules and the Trend alerts panel.

## Loading data

`fetchSnapshotHistory` runs whenever the data source URL changes:

- **No URL:** returns the built-in sample history after 500 ms. The page shows a **Sample data** note above it saying the numbers are examples, not measurements; the note goes away once a data source URL is applied.
- **`github://owner/repo/branch/path`:** calls `repos.getContent` with an unauthenticated Octokit client and the raw media type, so the file arrives whole at any size up to GitHub's 100 MB limit for this API. (GitHub's default JSON response has no content for files over 1 MB.)
- **Any other URL:** `fetch` and parse as JSON.

Every history, including the built-in sample, is checked before anything is drawn. It must be an object with a `snapshots` array, and each snapshot must be an object with a `schema_version` of `1.0` or `2.0` (the versions core reads) and a `functions` array. Otherwise the page shows an error naming the snapshot and its commit, for example `Snapshot 2 (commit v2count) has schema_version "3.0", which this dashboard does not support. Supported versions: 1.0, 2.0.` The dashboard does not try to read a version it does not know.

A 403 or 429 response is shown as **RATE_LIMITED** instead of an error when GitHub's rate-limit rules apply: `x-ratelimit-remaining` is `0`, `retry-after` is set, the status is 429, or the message names a rate limit. The page shows when to try again, taken from `x-ratelimit-reset` or `retry-after`, if the response gave one. Any other 403 is shown as an error. Requests are not retried automatically.

Other errors are shown in place of the charts.

A `github://` history is reused for as long as GitHub's `Cache-Control: max-age` says it is fresh (60 seconds on the Contents API). Without a token, even a conditional request answered with 304 Not Modified costs one of the 60 requests per hour, so the page does not ask again within that time. Above the charts it says when the history was fetched and until when a refresh reuses it. A history that fails its checks is not kept. The refresh button reloads even when the URL is unchanged.

## What the page shows

- **Latest commit:** `commit_sha` of the last snapshot.
- **Regression state:** "Regression Detected" if any function's `cpu_instructions` in the last snapshot is more than 10% above the snapshot before it. Only CPU is checked, and the 10% is fixed.
- **Tracked functions:** the number of distinct function names across all snapshots.
- **Trend alerts:** a panel above the charts for slow growth that the single-commit regression state misses. It checks each function in the latest snapshot, using the snapshots that contain it (its measurements):
  - **Cap projection:** a least-squares line through `pct_of_network_cap` over the last 5 measurements. The function is flagged when the line reaches 80% within 10 commits, counted from the latest share, or when the share is already 80% or more. All 5 measurements need a cap figure; snapshots made before core read network caps have `0` and do not count, and the panel says when no function has enough. `pct_of_network_cap` is the highest share of any single metric's cap, so the alert cannot say which metric is closing in.
  - **Creep:** a metric (CPU, read or write bytes, all or read-write entries) that rose in each of the last 3 measurements and by 10% or more in total, from a starting value above 0.

  80% and 10% are the defaults of core's `--cap-warning-pct` and `--max-delta-pct`; the dashboard does not read your own flags. Each alert shows the numbers it is based on and opens the function's history table.
- **Charts:** one per unit, per snapshot, for all functions summed or for one selected function:
  - CPU instructions (`cpu_instructions`)
  - Ledger bytes: read bytes (`read_bytes`) and write bytes (`write_bytes`)
  - Footprint entries: all entries (`read_entries`) and read-write entries (`write_entries`)

  Each y-axis is labelled with its unit, and the second line in a chart is dashed so the two can be told apart without colour.
- **Missing values:** a value that is `null` or absent, or a function missing from a snapshot, is drawn as a gap, not as 0. The all-functions sum is a gap if any function lacks the value. Snapshots without entry counts (schema `1.0`, including the built-in sample) show "Not reported in these snapshots" in place of the entries chart.
- **Repeated names:** core before v0.2.3 accepted a fixture that measured two calls under one function name, so an older snapshot can contain two entries with the same name. Neither entry is known to be that function's measurement, so for that function the snapshot is a gap in the charts, its history row says "Name repeated in this snapshot, not measured", and trend alerts and the regression card leave it out. The all-functions sum still includes both entries.
- Memory (`memory_bytes`) is not charted: core records it as `null` because current RPCs do not report it.
- **Functions table** (all functions selected), under the charts: one row per function with its latest measurement, the commit it came from, every metric with its change since the function's previous measurement, and its share of the network cap (`pct_of_network_cap`). Functions in the latest snapshot come first; a function missing from it is marked "not in latest snapshot" and shows its last measurement. Selecting a function's name opens its history.
- **History table** (one function selected, from the Functions table or the filter): one row per snapshot, newest first, with each metric and its change, so a jump can be traced to the commit that caused it. A snapshot without the function says "Not in this snapshot". **All functions** goes back.

  A change is the percent difference from the last snapshot that contained the function. There is none for the first measurement, from a previous value of 0, or when either value is unknown. Unknown values say "not reported"; a `pct_of_network_cap` of 0 (snapshots made before core read network caps) and an empty `commit_sha` say "not recorded". The sign of a change shows its direction; colour only repeats it.

## Known limitations

- **Size:** checked at the Action's limit of 200 snapshots, each with 30 functions (a 1.1 MB `history.json`), in headless Chrome on 2026-10-30: the functions table appeared 0.25 s after applying the URL, the charts about 0.85 s later, and a function's 200-row history 0.2 s after selecting it, with no errors. At that size the chart points merge into a thick line, and the x-axis labels every ninth commit.
- An `https://` source is left to the browser's HTTP cache: raw.githubusercontent.com sends `max-age=300`, so a refresh within 5 minutes may show the same copy.
