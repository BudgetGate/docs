---
layout: home

hero:
  name: "BudgetGate"
  text: "Soroban resource-cost regression checks"
  tagline: "Fail a pull request when a Soroban contract function gets more expensive, using costs measured on a real network."
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
    details: Soroban enforces resource limits at execution time, so only a simulation shows them. Soroban teams keep filing the same task for their own repos, a CI gate on resource cost.
---

# Welcome to BudgetGate

BudgetGate is a CI regression checker for Soroban smart-contract resource cost. It simulates configured contract calls, saves the measured cost as a baseline snapshot, and flags a change when a function's cost goes up too much.

## See it run

<video controls preload="none" poster="/demo-poster.jpg" src="/demo.mp4" style="width:100%;border-radius:8px" aria-label="105-second demo with narration and captions"></video>

A 105-second demo with captions and a synthetic voice: a real run of the CLI on testnet, then a real pull request where the Action reports a regression and fails the check, the fix that turns the same report green, and the history on the live dashboard. Every number is from a real run.

## Why it exists

A change to a Soroban contract can make a function much more expensive without failing a test. Nothing shows it until a call costs more, or hits a network limit.

Teams building on Soroban keep writing this task for themselves:

- [lyricsflip-toolkit #78](https://github.com/Stellar-songifi/lyricsflip-toolkit/issues/78): "Track and gate on resource-cost regressions in CI"
- [latch-contracts #70](https://github.com/3K1-Labs/latch-contracts/issues/70): "Add a resource-cost regression report to CI"
- [accensa-contracts #92](https://github.com/accensa/accensa-contracts/issues/92): "Fail CI when a contract's resource cost regresses"
- [HarvestLock-Contracts #31](https://github.com/Agrisettle/HarvestLock-Contracts/issues/31): "Set up a gas/resource-cost regression-tracking CI job"
- [cee-devpulsar #41](https://github.com/Cracked-CEE/cee-devpulsar/issues/41): "CI gate on Soroban resource-cost regressions per PR"
- [Fluxora-Contracts #573](https://github.com/Fluxora-Org/Fluxora-Contracts/issues/573): "Add Soroban gas-cost regression CI gate for create_stream, withdraw, and batch operations"

## What it does

Other tools also compare Soroban costs. BudgetGate measures through a Soroban RPC on testnet, so it needs no local network, ships binaries for Linux, macOS and Windows, and keeps the history:

- **Per function:** CPU instructions, read and write bytes, and read and write entries for each call in a fixture.
- **Each commit's own code:** an example workflow builds and deploys the contract, so a pull request is measured on its own code.
- **A clear result:** exit code `1` is a regression and `2` means the run could not measure, so CI never confuses the two. An archived contract stops the run instead of reporting a restore as a regression.
- **Any runner:** released, checksummed and attested binaries for Linux, macOS and Windows, on x64 and arm64.
- **Live limits:** network caps are read from the RPC on every run, never hardcoded.
- **History:** snapshots are kept on a branch and charted on the [dashboard](https://budgetgate-dashboard.vercel.app/).

Run on real pull requests in the public [test repository](https://github.com/BudgetGate/budgetgate-action-test). Early-stage: not audited and not production-ready.

## What it is not

It does not do static analysis or vulnerability scanning. For that, see [Scout-Soroban](https://github.com/CoinFabrik/scout-soroban).

::: warning Status
BudgetGate is early-stage software. It has not been audited and is not production-ready. Core's latest release is v0.2.5; the Action's is v0.2.2. The limitations of each part are listed on its pages.
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
