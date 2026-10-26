# Soroban Budget Dashboard - Documentation

## Stack

React 19, Vite, TypeScript, Tailwind CSS, Recharts for charts, `@octokit/rest` for GitHub access, and React Router.

## Structure

- `src/App.tsx`: routes `/` to `Dashboard` and `/docs` to `Docs`.
- `src/pages/Dashboard.tsx`: the dashboard. Holds the loaded history, the selected function, the data source URL and the demo state.
- `src/pages/Docs.tsx`: renders the repository's `DOCUMENTATION.md`.
- `src/api.ts`: `fetchSnapshotHistory(url)` and the built-in sample history.

## Loading data

`fetchSnapshotHistory` runs whenever the data source URL changes:

- **No URL:** returns the built-in sample history after 500 ms.
- **`github://owner/repo/branch/path`:** calls `repos.getContent` with an unauthenticated Octokit client and base64-decodes the file.
- **Any other URL:** `fetch` and parse as JSON.

Errors are shown in place of the charts.

## What the page shows

- **Latest commit:** `commit_sha` of the last snapshot.
- **Regression state:** "Regression Detected" if any function's `cpu_instructions` in the last snapshot is more than 10% above the snapshot before it. Only CPU is checked, and the 10% is fixed.
- **Tracked functions:** the number of distinct function names across all snapshots.
- **Chart:** CPU instructions and memory bytes per snapshot, for all functions summed or for one selected function.

## Known limitations

- Read bytes, write bytes and footprint entry counts are not charted.
- Core records `memory_bytes` as `null` because current RPCs do not report it. In the all-functions view, `null` is summed as 0, so memory shows as 0 for real data.
- Sample data and demo snapshots are not labelled as such in the UI.
- GitHub API rate limits (403/429) appear only as a generic error.
- The dashboard does not check `schema_version`.
