---
id: adr-012-event-enrichment
title: ADR-012 Event Enrichment (Fat Events)
description: Decision to use context-enriched events to enable stateless projections, with a strict exception for PII data.
tags: [ architecture, event-sourcing, domain-events, projections ]
image: /img/og/adr/adr-012-event-enrichment.jpg
---

# ADR-012: Event Enrichment (Fat Events)

**Status:** Accepted  
**Date:** 2026-04-06

## Context

In Event Sourcing, Domain Events are often designed as "Lean Events," containing only the exact delta of the state
change (e.g., `ScoreTracked { score: 10 }`). However, when building Read Models (Projections), the projector often needs
additional context (e.g., "Which user does this score belong to?").
If events are lean, projectors must either maintain their own internal state to remember the `userId` from a previous
`SessionStarted` event, or query external databases during projection. Both approaches introduce high complexity,
latency, and tight coupling.

## Decision

We adopt the **"Fat Events" (Event Enrichment)** pattern for our Domain Events.

Events should explicitly include relevant context identifiers (such as `userId`, `tenantId`, `drillId`, or
`organizationId`) that are necessary for routing or building standard projections, even if that specific event did not
mutate those fields.

**Strict Exception (PII Data):**
In accordance with [ADR-010](./adr-010-gdpr-pii-handling.md) (GDPR & PII), Personally Identifiable Information (e.g.,
email addresses, clear-text names)
must **never** be used to enrich subsequent events. Enrichment is strictly limited to immutable, non-identifying IDs (
UUIDs).

## Consequences

### Positive

* **Stateless Projectors:** Projections become purely functional (`f(event) = update`). They do not need to query
  databases or remember past events to determine the context.
* **Independent Scalability:** Events can be routed via Message Brokers (e.g., AWS EventBridge/SQS) directly to
  specialized consumers based on `userId` or `drillId` without needing to look up the parent aggregate.
* **Simpler Debugging:** Looking at a single event in the Event Store provides immediate context.

### Negative

* **Increased Payload Size:** Events take up slightly more storage in DynamoDB (and AWS EventBridge/SQS payload limits).
* **Aggregate Memory:** The Aggregate Root must keep these context IDs in its internal state memory to attach them to
  newly recorded events.