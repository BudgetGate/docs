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
