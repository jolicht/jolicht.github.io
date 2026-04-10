---
id: adr-009-api-response-strategy
title: ADR-009 API Response Strategy for Commands
description: Decision on how to handle API responses for state-mutating commands given the eventual consistency of our read models.
tags: [ architecture, api, cqrs, eventual-consistency ]
image: /img/og/adr-009-api-response-strategy.jpg
---

# ADR-009: API Response Strategy for Command Endpoints

**Status:** Accepted  
**Date:** 2026-04-04

## Context

Our architecture utilizes CQRS and Event Sourcing. When a state-mutating operation (Command) is executed, it is handled
**synchronously** to immediately validate business invariants and policies. If the operation is successful, the
resulting events are appended to the Event Store.

However, the Read Models (Projections) used for queries are updated **asynchronously** in the background by Event
Handlers. Because of this separation, the system is eventually consistent. If a client sends a `POST` request to
schedule a training session and we attempt to immediately return the newly formatted Read Model, the projection might
not be updated yet, resulting in stale data or a 404 Not Found.

## Decision

We embrace eventual consistency at the API boundary. The API will process Commands synchronously but respond without
waiting for the Read Models to update:

1. **Synchronous Execution:** The Action (Controller) dispatches the Command synchronously to the Command Handler.
   Domain Policies are checked, and the Aggregate mutates its state. If a domain rule is violated, a synchronous
   Exception is thrown and translated into a `4xx` HTTP response (e.g., `409 Conflict`).
2. **Immediate Acknowledgement:** Once the events are successfully persisted to the Event Store, the Command Handler
   completes. The API immediately returns an **`HTTP 202 Accepted`** (or `201 Created` / `204 No Content` depending on
   the exact creation context).
3. **Minimal Payload:** The response body will not contain the fully updated Read Model. It will only return the
   identifier (UUIDv7) of the Aggregate Root being operated on.
4. **Client Responsibility:** The client (Frontend, Mobile App, etc.) is responsible for determining when the read model
   is updated. The client uses the returned UUID to poll the corresponding `GET` endpoint (e.g.,
   `GET /api/training-sessions/{uuid}`) until the new or updated state is available.

## Consequences

### Positive

* **Immediate Domain Validation:** The user receives immediate feedback if a business rule (e.g., Room is already
  booked) is violated.
* **High Read Performance:** We do not block the HTTP request to wait for database projection writes, which might
  involve network latency to external search indices or complex aggregations.
* **CQRS Alignment:** Strict separation between the write side (returning only acknowledgments/IDs) and the read side (
  returning data) is maintained.

### Negative

* **Increased Client Complexity:** Frontend developers must implement polling mechanisms or appropriate UI loading
  states (e.g., optimistic UI updates) to handle the delay between a successful command and the projection update.