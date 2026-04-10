---
id: index
title: Architecture Overview
slug: /
image: /img/og/architecture/architecture.index.jpg
---

# poolplayers.world Architecture

Welcome to the central technical hub for **[poolplayers.world](https://poolplayers.world/)**. This documentation defines
how we design, build, and maintain the API and core services powering the platform..

## The Mission

Our goal is to provide a robust, scalable, and highly accurate system for tracking player progress, match results, and
training sessions. To achieve this at a professional level, we use a **strategic architectural stack** that ensures data
integrity and high performance.

## Core Architectural Principles

The implementation of the [poolplayers.world](https://poolplayers.world/) API follows these foundational patterns:

* **Modular Monolith & DDD:** We organize code into Bounded Contexts like `Training`, `User`, and `Match`. This ensures
  that a change in the scoring logic doesn't accidentally break user profile management.
* **Hexagonal Architecture:** We separate our billiard-specific business logic from technical details like AWS Lambda,
  DynamoDB, or Symfony.
* **Event Sourcing:** Instead of just storing the current "Highscore," we store every single `DrillResultTracked` event.
  This allows us to reconstruct a player's entire history and calculate advanced statistics at any time.
* **CQRS:** We use separate models for writing data (enforcing game rules) and reading data (providing fast API
  responses for leaderboards and profiles).
* **Serverless First:** Designed for **AWS Lambda** and **Bref**, ensuring our API scales automatically with the number
  of active players while keeping costs low.

## Documentation Structure

### 1. Architecture & Guides (The "How")

Practical guides for daily development within the [poolplayers.world](https://poolplayers.world/) ecosystem.

* **[Directory Structure Cheat Sheet](./directory-structure.md):** The "Map" of our codebase. Use this to find where
  to put your billiard domain logic.

### 2. Architecture Decision Records (The "Why")

Historical records of our technical choices.

* **[Browse ADRs](./adr):** Understand why we chose our specific stack and how we handle things
  like [PII data](./adr/adr-010-gdpr-pii-handling) or [Event Enrichment](./adr/adr-012-event-enrichment).

---

> *Building the digital home for the pool community, one event at a time.*