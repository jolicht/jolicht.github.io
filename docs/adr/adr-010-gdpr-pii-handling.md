---
id: adr-010-gdpr-pii-handling
title: ADR-010 GDPR and Personal Data Handling
description: Decision to exclude Personal Data (PII) from the immutable Event Store to comply with GDPR, utilizing a separate mutable store instead.
tags: [ architecture, event-sourcing, gdpr, privacy, compliance ]
image: /img/og/adr/adr-010-gdpr-pii-handling.jpg
---

# ADR-010: Handling Personal Data (GDPR) in an Event-Sourced System

**Status:** Accepted  
**Date:** 2026-04-04

## Context

Our application utilizes Event Sourcing, meaning the state of the system is stored as an append-only log of immutable
Domain Events.
Under the European General Data Protection Regulation (GDPR), users have the "Right to be Forgotten," meaning we must be
able to completely delete or anonymize their Personally Identifiable Information (PII) upon request.

Because the Event Store is strictly immutable, we cannot simply run an `UPDATE` or `DELETE` statement to remove a user's
name or email address from historical events. Alternative solutions like "Crypto-Shredding" (encrypting PII in events
and deleting the decryption key) add significant complexity to event serialization, key management, and read-model
generation.

## Decision

We decided to keep the Event Store completely free of PII and use a **Separated Mutable PII Store** approach.

1. **PII-Free Events:** Domain Events must never contain personal data (e.g., email, plaintext names, addresses). They
   may only contain references (UUIDs) to the entities holding that data (e.g., `UserId`).
2. **Mutable PII Record:** Personal data is stored in a separate, traditional (mutable) database table or service.
3. **Projection Enrichment:** When an Event Handler (Projector) processes an event to build a Read Model, it extracts
   the UUID from the event, queries the mutable PII store for the personal data, and writes the combined result into the
   Read Model.
4. **Anonymization:** When a user requests deletion, we only delete or permanently anonymize the record in the mutable
   PII store and trigger a rebuild or update of the affected Read Models. The Event Store remains completely untouched
   and immutable, retaining its structural integrity without leaking personal data.

## Consequences

### Positive

* **GDPR Compliance:** We can confidently delete user data without violating the fundamental rule of Event Sourcing (
  immutability).
* **Simplicity:** We avoid the immense architectural and operational overhead of implementing Crypto-Shredding.
* **Auditability:** The behavioral history of the system remains intact for analytical purposes (e.g., "User X scheduled
  5 sessions"), even if the user's real-world identity is gone.

### Negative

* **Projection Overhead:** Event Handlers (Projectors) have an additional dependency. They must perform synchronous
  network or database lookups to the PII store while building Read Models, which slows down projection rebuilds.
* **Temporal Coupling:** If the mutable PII store is temporarily unavailable, projections cannot process events that
  require data enrichment.
* **Developer Discipline:** Developers must strictly review event payloads to ensure no PII accidentally leaks into the
  Event Store, as fixing such a leak retroactively is extremely difficult.