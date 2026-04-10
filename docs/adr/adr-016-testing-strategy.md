---
id: adr-016-testing-strategy
title: ADR-016 Testing Strategy and the Honeycomb Model
description: Decision on utilizing a behavior-centric Honeycomb testing strategy tailored for DDD and Event Sourcing to secure business logic and enable fearless refactoring.
tags: [ architecture, testing, tdd, bdd, event-sourcing, ddd, integration-testing ]
image: /img/og/adr-016-testing-strategy.jpg
---

# ADR-016: Testing Strategy and the Honeycomb Model

**Status:** Accepted  
**Date:** 2026-04-09

## Context

Our application utilizes Domain-Driven Design (DDD), CQRS, Event Sourcing (EventSauce), and is deployed on a serverless
AWS architecture.

The primary goal of our testing suite is to prove that the application correctly implements business requirements,
prevents regressions when adding new features, and ensures the stability of the current system.

The traditional "Test Pyramid" relies heavily on isolated unit tests using mocks. In a DDD and Event-Sourced
environment, heavy unit testing of internal state mutations leads to fragile tests that break during normal domain
refactoring. Furthermore, mocking infrastructure creates a false sense of security, failing to catch real-world
integration errors or regressions caused by third-party package updates (e.g., AWS SDK, EventSauce) and framework
upgrades.

We need a testing strategy that prioritizes the verification of business behavior, allows for fearless refactoring, and
provides a robust safety net for both current feature development and future infrastructure upgrades.

## Decision

We explicitly reject the traditional test pyramid in favor of a **Honeycomb (or Diamond) Testing Strategy**. We separate
tests by their architectural purpose, prioritizing business behavior over internal implementation details.

The testing suite is divided into four distinct categories:

1. **Behavior Tests (Domain Layer) - *High Volume***
    * **Target:** Aggregate Roots, Domain Policies, and Command Handlers.
    * **Format:** `Given (History of Events) -> When (Command) -> Then (New Events/Exceptions)`.
    * **Primary Purpose:** Secures the core business logic. Ensures that the application behaves correctly according to
      the domain rules.
    * **Secondary Purpose:** Because these tests assert against the *output* (Events) rather than internal state, the
      internal domain code can be completely refactored or extended without breaking existing tests.

2. **Integration Tests (Infrastructure Layer) - *Medium Volume***
    * **Target:** Repositories (Event Store adapters) and Projectors.
    * **Format:** Real database interactions (e.g., using DynamoDB Local). Strictly NO mocking of the database.
    * **Primary Purpose:** Secures the actual persistence mechanisms. Guarantees that events are correctly serialized,
      stored, retrieved, and idempotently projected in the real database environment.
    * **Secondary Purpose:** Protects the application against regressions during package upgrades (e.g., updating
      EventSauce or the AWS SDK).

3. **API / Contract Tests (Delivery Layer) - *Low Volume***
    * **Target:** Controllers / Actions and HTTP request/response mappings.
    * **Format:** Making HTTP requests to the application boundaries and asserting JSON responses.
    * **Primary Purpose:** Secures the external contract. Ensures that frontend or mobile clients do not break when
      internal logic changes.
    * **Secondary Purpose:** Acts as a shield against framework updates (e.g., Symfony or Bref upgrades) breaking the
      routing or payload delivery.

4. **Unit Tests (Algorithmic Logic) - *Minimal Volume***
    * **Target:** Pure, complex mathematical or algorithmic functions (e.g., Elo/Q-Score calculators, fatigue
      algorithms).
    * **Format:** Classic xUnit input/output testing.
    * **Purpose:** Fast verification of complex, isolated logic that does not involve state transitions or external
      dependencies.

## Consequences

### Positive

* **Business First:** The testing suite acts as living documentation of the domain's behavior, heavily focused on
  verifying the actual features rather than technical implementations.
* **Fearless Refactoring:** The Domain Layer can be restructured internally without breaking Behavior Tests, as long as
  the emitted Domain Events remain the same.
* **Upgrade Safety:** Upgrading Symfony, Bref, or EventSauce is safe because Integration and API tests interact with the
  actual framework and database layers rather than mocks.
* **High Confidence:** Testing against DynamoDB Local ensures that serverless infrastructure quirks (like Eventual
  Consistency or out-of-order event delivery) can be actively simulated and tested.

### Negative

* **Execution Speed:** Integration tests running against a local database container (DynamoDB Local) are slower than
  purely mocked unit tests.
* **Discipline Required:** Developers must resist the urge to write classic unit tests with mocks for standard Aggregate
  behavior, adhering strictly to the Given-When-Then event testing paradigm.