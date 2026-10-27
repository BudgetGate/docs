# Soroban Budget Dashboard - Documentation

## Stack

React 19, Vite, TypeScript, Tailwind CSS, Recharts for charts, `@octokit/rest` for GitHub access, and React Router.

## Structure

- `src/App.tsx`: routes `/` to `Dashboard`.
- `src/pages/Dashboard.tsx`: the dashboard. Holds the loaded history, the selected function, the data source URL and the demo state.
- `src/api.ts`: `fetchSnapshotHistory(url)` and the built-in sample history.
- `src/metrics.ts`: turns snapshots into chart points, one value per metric per snapshot.
- `src/components/MetricChart.tsx`: one chart per unit.

## Loading data

`fetchSnapshotHistory` runs whenever the data source URL changes:

- **No URL:** returns the built-in sample history after 500 ms.
- **`github://owner/repo/branch/path`:** calls `repos.getContent` with an unauthenticated Octokit client and base64-decodes the file.
- **Any other URL:** `fetch` and parse as JSON.

Every history, including the built-in sample, is checked before anything is drawn. It must be an object with a `snapshots` array, and each snapshot must be an object with a `schema_version` of `1.0` or `2.0` (the versions core reads) and a `functions` array. Otherwise the page shows an error naming the snapshot and its commit, for example `Snapshot 2 (commit v2count) has schema_version "3.0", which this dashboard does not support. Supported versions: 1.0, 2.0.` The dashboard does not try to read a version it does not know.

A 403 or 429 response is shown as **RATE_LIMITED** instead of an error when GitHub's rate-limit rules apply: `x-ratelimit-remaining` is `0`, `retry-after` is set, the status is 429, or the message names a rate limit. The page shows when to try again, taken from `x-ratelimit-reset` or `retry-after`, if the response gave one. Any other 403 is shown as an error. Requests are not retried automatically.

Other errors are shown in place of the charts.

## What the page shows

- **Latest commit:** `commit_sha` of the last snapshot.
- **Regression state:** "Regression Detected" if any function's `cpu_instructions` in the last snapshot is more than 10% above the snapshot before it. Only CPU is checked, and the 10% is fixed.
- **Tracked functions:** the number of distinct function names across all snapshots.
- **Charts:** one per unit, per snapshot, for all functions summed or for one selected function:
  - CPU instructions (`cpu_instructions`)
  - Ledger bytes: read bytes (`read_bytes`) and write bytes (`write_bytes`)
  - Footprint entries: all entries (`read_entries`) and read-write entries (`write_entries`)

  Each y-axis is labelled with its unit, and the second line in a chart is dashed so the two can be told apart without colour.
- **Missing values:** a value that is `null` or absent, or a function missing from a snapshot, is drawn as a gap, not as 0. The all-functions sum is a gap if any function lacks the value. Snapshots without entry counts (schema `1.0`, including the built-in sample) show "Not reported in these snapshots" in place of the entries chart.
- Memory (`memory_bytes`) is not charted: core records it as `null` because current RPCs do not report it.

## Known limitations

- Sample data and demo snapshots are not labelled as such in the UI.
- Results are not cached, and entering the same URL again does not reload it.
