---
id: adr-007-identifier-strategy
title: ADR-007 Identifier Strategy (Client-Provided UUIDv7)
description: Decision to use UUIDv7 for all entities, preferring client-provided IDs with a controller fallback to support strict CQRS.
tags: [ architecture, ddd, event-sourcing, identifiers, api, uuidv7 ]
image: /img/og/adr-007-identifier-strategy.jpg
---

# ADR-007: Identifier Generation Strategy (Client-Provided UUIDv7)

**Status:** Accepted  
**Date:** 2026-04-04

## Context

In an Event-Sourced architecture, the identifier of an Aggregate Root (the event stream ID) must be known *before* the
first events are appended to the Event Store. Relying on database auto-incrementing integers is not feasible.

Furthermore, our Command-Based API adheres to strict CQRS principles, meaning Command Handlers mutate state but return
`void`. They cannot return newly generated IDs to the caller. We need an identifier strategy that supports:

1. Pre-allocation of IDs before reaching the Domain Layer.
2. Idempotency and safe retries for API consumers.
3. Efficient database indexing (randomly generated UUIDv4 can cause severe index fragmentation over time).

## Decision

We decided to use a **Hybrid Client-Provided Identifier Strategy** utilizing **UUIDv7**.

**1. Format (UUIDv7):**
All Aggregate Roots and exposed entities will use UUIDv7. Unlike UUIDv4, UUIDv7 includes a timestamp, making it
time-sortable.

* **Write-Side (Event Store):** In relational databases, this provides the uniqueness of a UUID while behaving similarly
  to auto-incrementing integers in B-Tree indexes, drastically reducing index fragmentation.
* **Read-Side (DynamoDB):** The time-sortable nature allows for highly efficient chronological queries when the UUID is
  used within a Sort Key (SK) in our Single Table Design.

**2. Generation Strategy:**

* **Primary (Client-Provided):** Clients (e.g., Single Page Applications, Mobile Apps) are strongly encouraged to
  generate the UUIDv7 and include it in the POST request payload. This allows for Optimistic UI (immediate navigation)
  and prevents duplicate creation on network retries.
* **Fallback (Controller-Generated):** To maintain API usability for simple consumers (e.g., cURL, third-party scripts),
  the ID field in the Request DTO is optional. If omitted, the API Action (Controller in the Infrastructure layer) will
  generate the UUIDv7 before instantiating the Application Command.

**3. Validation and Duplicate Prevention:**

* The expected UUID format (v7) is strictly enforced via validation attributes on the Request DTOs in the Delivery
  layer. Invalid versions will result in a `400 Bad Request`.
* We do not perform manual read-queries to check for duplicate IDs before dispatching a Command. Instead, we rely on the
  Event Store's unique database constraints (`aggregate_root_id` + `version`). A duplicate ID attempt will throw an
  infrastructure exception that the API maps to a `409 Conflict`.

## Consequences

### Positive

* **CQRS Purity:** Command Handlers remain pure and return `void`. The ID is known at the Controller level and can be
  immediately returned in a `202 Accepted` response.
* **Database Performance (Write):** UUIDv7 solves the classic relational database insertion performance degradation
  associated with standard UUIDv4.
* **Query Efficiency (Read):** In DynamoDB, UUIDv7 simplifies time-based sorting and range queries without requiring
  additional secondary indexes for creation timestamps.
* **Developer Experience:** We offer the robust idempotency of client-generated IDs for advanced frontends, without
  punishing simple API consumers who prefer server-generated IDs.

### Negative

* **Storage Overhead:** UUIDs (stored as 36-character strings or 16-byte binary structures) consume more memory and
  storage space than standard 4-byte integers.
* **Validation Boilerplate:** Every creation endpoint requires specific DTO validation rules to ensure the client is not
  sending older UUID versions or maliciously formatted strings.