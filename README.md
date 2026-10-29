<p align="center"><img src=".github/avatar.png" width="120" alt="Budget Gate logo: a resource-cost gauge behind a gate bar"></p>

# Budget Gate docs

User documentation for Budget Gate, a CI regression checker for Soroban smart-contract resource cost. Live at **[budgetgate.github.io/docs](https://budgetgate.github.io/docs/)**.

This is the only docs site for the three Budget Gate repositories:

| Section | Source | Covers |
|---|---|---|
| `docs/core/` | [soroban-budget-core](https://github.com/BudgetGate/soroban-budget-core) | The Go CLI: measuring with `simulateTransaction`, flags, exit codes, the report, the snapshot and fixture formats |
| `docs/action/` | [soroban-budget-action](https://github.com/BudgetGate/soroban-budget-action) | The GitHub Action: workflow setup, inputs, outputs, the PR comment, the cached baseline |
| `docs/dashboard/` | [soroban-budget-dashboard](https://github.com/BudgetGate/soroban-budget-dashboard) | The dashboard app |

The site is built with [VitePress](https://vitepress.dev/); its configuration is in `docs/.vitepress/config.js` (served under `/docs/`).

## Run locally

```bash
npm ci
npm run docs:dev      # local server with live reload
npm run docs:build    # static build into docs/.vitepress/dist
```

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. There is no separate release step.

`package.json` overrides VitePress 1.6.4's Vite 5 with Vite 6.4.4 or later: Vite 5 and its `esbuild` have dev-server advisories (one high) that are only fixed in Vite 6.4.4, and VitePress has no stable release on Vite 6 yet (2.0 is in alpha). With the override, every page's text is unchanged and `npm audit` reports 0 (checked 2026-10-29). Remove it when VitePress moves to Vite 6 or later. Dependabot opens weekly update PRs, and `.github/workflows/audit.yml` audits the dependencies every week.

Every pull request to `main` runs `.github/workflows/ci.yml` (job `docs-build`), which runs the same `npm run docs:build`. A dead internal link or a malformed `{{ }}` expression (VitePress evaluates them even inside inline code) fails the build, so it fails the PR instead of the deploy.

## Contributing

- Base your branch on `main` and open a PR.
- A change to a product's flags, inputs, outputs, exit codes, report or schema ships with a matching PR here. Link the two, and merge this one after the code PR.
- Describe only behaviour that exists in that product's `main`. If something is planned, say so, or leave it out.

## License

[MIT](LICENSE)
