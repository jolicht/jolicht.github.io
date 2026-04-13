---
id: adr-013-typed-event-properties
title: ADR-013 Centralized Serialization for Typed Domain Events
description: Decision to strictly type Domain Events using POPOs and delegate their serialization to a centralized Symfony Serializer instead of implementing manual payload methods.
tags: [ architecture, event-sourcing, domain-driven-design, symfony-serializer ]
image: /img/og/adr/adr-013-typed-event-properties.jpg
---

# ADR-013: Centralized Serialization for Typed Domain Events

**Status:** Accepted  
**Date:** 2026-04-06

## Context

Domain Events must be strictly typed in PHP for domain logic (using Value Objects/IDs) but must be stored as primitive
types in the Event Store (JSON/DynamoDB).
The standard EventSauce approach uses `SerializablePayload` with manual `toPayload()` and `fromPayload()` methods. This
creates significant boilerplate code for every new event and couples the domain model to its persistence format.

## Decision

We decide to keep Domain Events as **Plain Old PHP Objects (POPOs)**. They will NOT implement any serialization
interface.

### Rules for Event Classes:

* **Properties:** Use **Value Objects** for IDs and complex types, and **primitive types** (int, string, bool) for
  simple values.
* **Constructor:** All properties are promoted through the constructor. No manual mapping logic inside the class.

### Centralized Serialization Strategy:

We delegate all transformation logic to the **Symfony Serializer**:

1. **Normalizers:** We implement/configure custom Normalizers that know how to handle our `AggregateRootId`
   implementations (converting them `toString()` and back via `fromString()`).
2. **DateTime:** A global configuration handles `DateTimeImmutable` to/from ISO-8601.
3. **No Boilerplate:** The event itself remains unaware of how it is stored.

## Consequences

### Positive

* **Zero Boilerplate:** Adding a new event requires only the class and its properties.
* **Decoupling:** The Domain Layer is not polluted with persistence concerns (like array keys for JSON).
* **Consistency:** All parts of the system (API, Event Store, Message Bus) use the same serialization logic.

### Negative

* **Reflection Overhead:** The Symfony Serializer uses reflection (though this is mitigated by metadata caching in
  production).
* **Implicit Mapping:** It is less obvious "at a glance" within the event class how it will look in the database, as the
  logic lives in central Normalizers.