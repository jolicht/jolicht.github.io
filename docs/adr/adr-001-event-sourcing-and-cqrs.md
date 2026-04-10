---
id: adr-001-event-sourcing-and-cqrs
title: ADR-001 Event Sourcing & CQRS
description: Decision to use Event Sourcing for state persistence and CQRS to separate read and write operations.
tags: [ architecture, ddd, event-sourcing, cqrs ]
image: /img/og/adr-001-event-sourcing-and-cqrs.jpg
---

# ADR-001: Event Sourcing and CQRS for Core Domains

**Status:** Accepted  
**Date:** 2026-04-04

## Context

Our application models complex business domains where understanding the history and intent of user actions is as
critical as the current state itself. In traditional CRUD (Create, Read, Update, Delete) and state-based persistence
models, updating a database row overwrites historical data. Tracking "why" a state changed often requires cumbersome,
error-prone audit logging tables.

Furthermore, as the application scales, the requirements for data mutation (validating complex business rules) and data
retrieval (fast, aggregated queries for the API/UI) conflict with each other. Attempting to fulfill both needs with a
single unified data model leads to slow queries and overly complex database schemas.

## Decision

We decided to adopt **Event Sourcing** combined with **CQRS (Command Query Responsibility Segregation)**.

1. **Event Sourcing (Write Side):** The state of our Aggregate Roots is no longer persisted as a snapshot in a
   relational table. Instead, all state changes are captured as an append-only log of immutable Domain Events (e.g.,
   `TrainingSessionScheduled`). These events form the single source of truth. An Aggregate's current state is
   reconstructed by replaying its historical events.
2. **CQRS (Read Side):** We strictly separate the Application Layer into `Command/` (state-mutating) and `Query/` (
   read-only) operations.
3. **Projections:** To serve fast reads, we use Projectors (Event Handlers) located in the Application Layer. These
   listen to the asynchronous Domain Events and continuously update optimized Read Models.

## Consequences

### Positive

* **Complete Audit Trail:** We never lose data. We have a 100% accurate, business-readable history of everything that
  happened in the system.
* **Time-Travel & Replayability:** If a new read requirement arises, we can create a new Read Model, replay all past
  events from the Event Store, and immediately have historically accurate projections.
* **Optimized Read Performance:** Queries do not need to execute complex SQL `JOIN`s against highly normalized tables.
  Read Models are structured exactly as the UI or API needs them (e.g., as denormalized JSON documents in DynamoDB).
* **Decoupling:** Bounded Contexts can communicate asynchronously. One context can react to events published by another
  without tight synchronous coupling.

### Negative

* **Steeper Learning Curve:** Developers accustomed to active record patterns or traditional ORMs (like Doctrine or
  Eloquent) require time to adapt to event-driven thinking.
* **Eventual Consistency:** Since Read Models are updated asynchronously via Projections, there is a small delay (
  usually milliseconds) between a successful Command and the updated data appearing in a Query. The UI must be designed
  to handle this.
* **Event Versioning:** Domain Events are immutable historical facts. If the business changes and an event schema
  evolves, we cannot simply `ALTER TABLE`. We must manage event versioning and implement upcasters to translate old
  event payloads into new formats during rehydration.