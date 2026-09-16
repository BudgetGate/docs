---
layout: home

hero:
  name: "BudgetGate"
  text: "Soroban Resource Budget Guard"
  tagline: "Prevent accidental network limit breaches with continuous, PR-blocking CI checks for CPU, Memory, and Read/Write Bytes."
  actions:
    - theme: brand
      text: Core CLI Docs
      link: /core/
    - theme: alt
      text: Action Setup
      link: /action/setup
  
features:
  - title: The Problem (stellar-cli#1106)
    details: The official stellar-cli lacks persistent, PR-comment-based CI integration for preventing developers from accidentally merging code that breaches the 100M CPU / 40MB Memory protocol ceilings.
  - title: Actionable Insights
    details: Fails CI pipelines and outputs rich Markdown tables directly into GitHub Pull Requests when resources spike above absolute caps or delta baselines.
  - title: Visual History
    details: A Cyberpunk-styled Dashboard plots historical telemetry data directly from your cached GitHub snapshots.
---

# Welcome to BudgetGate

BudgetGate is an end-to-end telemetry and CI/CD platform designed specifically for the **Soroban Smart Contract Ecosystem**. 

When building complex smart contracts, developers often introduce subtle regressions (like inefficient loops or large memory allocations) that push the contract's execution cost beyond the strict limits of the Stellar network (such as the 100M CPU instruction cap). BudgetGate catches these spikes *before* they are merged into the main branch.

## How it works

```mermaid
graph LR
    A[GitHub PR] -->|Triggers| B(soroban-budget-action)
    B -->|Executes| C{soroban-budget-core}
    C -->|Simulates on Testnet| D[Stellar RPC]
    D -->|Returns Metrics| C
    C -->|Generates Diff| B
    B -->|Posts Comment| A
    B -->|Saves Snapshot| E[(Cache)]
    E -->|Fetched by| F[soroban-budget-dashboard]
```

## The Three Pillars

BudgetGate is divided into three interconnected repositories:

1. **[Core CLI](/core/)**: The engine that parses XDR and interrogates the Soroban RPC.
2. **[GitHub Action](/action/)**: The automation layer that runs the CLI in CI and caches the results.
3. **[Dashboard](/dashboard/)**: The visual frontend for monitoring historical telemetry data.
