---
layout: home

hero:
  name: "BudgetGate"
  text: "Soroban Resource Budget Guard"
  tagline: "Measure Soroban contract resource cost with simulateTransaction and fail CI when it goes up."
  actions:
    - theme: brand
      text: Core CLI Docs
      link: /core/
    - theme: alt
      text: Action Setup
      link: /action/setup

features:
  - title: Measured, not estimated
    details: Runs simulateTransaction against a Soroban RPC and records CPU instructions, read and write bytes, and footprint entry counts for each function in a fixture.
  - title: Baseline comparison
    details: Compares a new measurement with a stored baseline snapshot and exits non-zero when any metric rises more than a set percentage (10% by default).
  - title: Why it exists
    details: Soroban enforces resource limits at execution time, so only a simulation shows them. stellar-cli issue #1106 asks for this kind of CI check.
---

# Welcome to BudgetGate

BudgetGate is a CI regression checker for Soroban smart-contract resource cost. It simulates configured contract calls, saves the measured cost as a baseline snapshot, and flags a change when a function's cost goes up too much.

It does not do static analysis or vulnerability scanning. For that, see [Scout-Soroban](https://github.com/CoinFabrik/scout-soroban).

::: warning Status
BudgetGate is early-stage software. It has not been audited and is not production-ready. Core's first release is v0.2.0; the Action has no release yet. The limitations of each part are listed on its pages.
:::

## How it works

1. You write a **fixture**: a JSON file listing the contract calls to measure, each as a base64 transaction envelope XDR.
2. **`soroban-budget-core`** simulates each call on a Soroban RPC (testnet by default) and builds a **snapshot** of the measured cost.
3. It compares the snapshot with a **baseline** snapshot, prints a Markdown table, and exits `1` if any metric rose more than the threshold.
4. **`soroban-budget-action`** runs core in a GitHub workflow and posts the table as a pull request comment.
5. **`soroban-budget-dashboard`** charts a history of snapshots. Nothing produces that history automatically yet; see the [dashboard page](/dashboard/).

## The three parts

1. **[Core CLI](/core/)**: the Go CLI that simulates, measures and compares.
2. **[GitHub Action](/action/)**: runs the CLI in CI and comments on pull requests.
3. **[Dashboard](/dashboard/)**: a web app that charts snapshot history.
