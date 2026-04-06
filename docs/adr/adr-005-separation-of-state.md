---
id: adr-005-separation-of-state
title: ADR-005 Separation of State from Aggregate Root
description: Decision to extract the internal data properties of an Aggregate into a dedicated State object to separate behavior from data.
tags: [ architecture, ddd, aggregate, event-sourcing ]
---

# ADR-005: Separation of State from Aggregate Root

**Status:** Accepted  
**Date:** 2026-04-04

## Context

In traditional object-oriented design and many DDD examples, an Aggregate Root contains both its behavioral logic (
methods enforcing business rules) and its structural data (properties like `$id`, `$status`, or `$createdAt`).

In an Event-Sourced system, state is continuously mutated by applying Domain Events. As the Aggregate grows, mixing the
complex business rule validations (the "behavior") with the event-handling and property mutations (the "data") within a
single class can lead to massive, hard-to-read files. Furthermore, modern Event Sourcing libraries (like EventSauce)
heavily encourage separating the pure data structure from the behavior to streamline the event rehydration process.

## Decision

We decided to strictly separate behavior from data within our Aggregates by introducing dedicated `State` classes.

The internal State class is placed directly alongside the Aggregate Root to maintain high cohesion. Only if the
Aggregate's state is highly complex or divided into multiple child entities, a dedicated `State/` subfolder will be
used.

**Responsibilities:**

1. **The Aggregate Root:** Acts exclusively as the transactional boundary and decision-maker. It exposes command
   methods (e.g., `schedule()`), validates invariants against the current State, and records new Domain Events. It holds
   no primitive data properties itself, only a reference to its `State` object.
2. **The State Object:** Acts as a pure data container. It holds the properties and provides the `apply*()` methods (
   e.g., `applyTrainingSessionScheduled()`) that mutate the properties when an event is recorded or replayed from the
   Event Store.

## Consequences

### Positive

* **Single Responsibility:** The Aggregate Root class becomes significantly cleaner. Developers reading the Aggregate
  Root only see business rules and event generation, not data mutation boilerplate.
* **Testability:** State transitions can theoretically be unit-tested independently of the Aggregate's complex
  decision-making logic, though typically testing the Aggregate Root covers both effectively.
* **Framework Alignment:** This pattern aligns perfectly with EventSauce's architecture, making rehydration (replaying
  events from the database to reconstruct the current state) highly efficient.

### Negative

* **Increased Boilerplate:** Every Aggregate requires at least two classes (e.g., `TrainingSession` and
  `TrainingSessionState`).
* **Slight Indirection:** Accessing internal properties within the Aggregate Root requires an extra indirection (e.g.,
  `$this->state->status()` instead of `$this->status`), which might feel unfamiliar to developers used to traditional
  ORM entities.