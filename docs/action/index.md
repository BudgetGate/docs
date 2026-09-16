# GitHub Action

The `soroban-budget-action` automates the execution of `soroban-budget-core` on every Pull Request, caching baseline telemetry and dropping markdown comments natively into the PR.

## Features
- **Baseline Persistence:** Automatically caches `new.json` on merges to `main` using `@actions/cache`.
- **Markdown Comments:** Generates Shields.io status badges and Markdown diff tables.
- **Fail-Fast:** Returns an exit code of `1` if resource usages trend >10% or hit >80% protocol hardcaps.
