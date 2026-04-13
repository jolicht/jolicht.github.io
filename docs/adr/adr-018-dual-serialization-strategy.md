---
id: adr-018-dual-serialization-strategy
title: ADR-018 Dual Serialization Strategy for Value Objects (Identifiers)
description: Decision to utilize a hybrid serialization approach for Identifiers to achieve framework-agnostic, boilerplate-free domain tests while maintaining flat JSON structures in the database.
tags: [ architecture, event-sourcing, serialization, ddd, symfony, dynamodb ]
image: /img/og/adr/adr-018-dual-serialization-strategy.jpg
---

# ADR-018: Dual Serialization Strategy for Value Objects (Identifiers)

**Status:** Accepted  
**Date:** 2026-04-13

## Context

In our Event-Sourced architecture, Domain Events frequently contain Value Objects, particularly Aggregate Root
Identifiers (e.g., `TrainingSessionId`, `DrillId`).

When working with EventSauce, we face two competing serialization needs:

1. **Domain Testing (Behavior Tests):** Our tests use EventSauce's native `AggregateRootTestCase` and its internal
   `ObjectMapper` (Hydrator). For maximum test execution speed and strict adherence to ADR-008 (Strict Framework
   Agnosticism), we do not boot the Symfony Dependency Injection Container or the Symfony Serializer during domain
   tests.
2. **Production Persistence (Infrastructure):** When persisting events to our Event Store (DynamoDB), we use the Symfony
   Serializer to convert Domain Events into JSON payloads. For optimal database querying and storage efficiency, we
   require these IDs to be stored as flat strings (e.g., `"sessionId": "123-456"`) rather than nested JSON objects (
   e.g., `"sessionId": { "id": "123-456" }`).

EventSauce's native hydrator natively supports PHP 8.1+ `readonly` properties but creates a nested array structure in
memory. Writing custom EventSauce `PropertyCaster` attributes for every single Identifier class to flatten them creates
unnecessary boilerplate in the Domain layer.

## Decision

We adopt a **Dual Serialization Strategy** that leverages PHP's native features for the Domain and Symfony's
normalization capabilities for the Infrastructure.

1. **Domain Layer (The Structure):**
    * All Aggregate Identifiers MUST extend an abstract base `Identifier` class.
    * This base class defines the identity as a `public readonly string $id` (Constructor Property Promotion).
    * We do **not** use EventSauce `PropertyCaster` attributes. EventSauce's native hydrator is allowed to handle these
      as nested objects during in-memory testing.

2. **Infrastructure Layer (The Flattening):**
    * We introduce an `IdentifierNormalizer` (implementing Symfony's `NormalizerInterface` and `DenormalizerInterface`)
      in the `Shared/Infrastructure` layer.
    * This normalizer intercepts any object extending the abstract `Identifier` class during the Symfony serialization
      process.
    * **On Serialize (Write to DB):** It calls `$identifier->toString()`, flattening the object into a simple string for
      the JSON payload.
    * **On Denormalize (Read from DB):** It calls the static `$type::fromString($data)` to reconstitute the Value Object
      from the flat database string.

## Consequences

### Positive

* **Zero Domain Boilerplate:** Developers do not need to write getters, setters, or custom caster attributes for new
  Identifiers. Creating a new ID is as simple as extending the base class.
* **Fast & Agnostic Tests:** Domain behavior tests run completely independent of the Symfony Serializer, relying
  entirely on native PHP speed and EventSauce's internal hydrator.
* **Clean Database Schema:** The resulting JSON in DynamoDB remains perfectly flat and highly readable/searchable,
  despite the object-oriented structure in the PHP code.
* **Centralized Infrastructure:** The conversion logic is written exactly once (`IdentifierNormalizer`) and
  automatically applies to all current and future identifiers.

### Negative

* **Serialization Asymmetry:** There is a slight conceptual asymmetry between how events look in memory during a Domain
  Test (nested ID structures) and how they look in the actual database (flat ID structures). However, since Integration
  Tests (which test the database boundary) will use the Symfony Serializer, this risk is actively mitigated and
  verified.