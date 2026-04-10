---
id: adr-015-serverless-event-fan-out
title: ADR-015 Serverless Event Fan-Out and Idempotent Projections
description: Decision on utilizing AWS EventBridge and standard SQS for context-based fan-out, enforcing playhead-based idempotency to handle out-of-order events.
tags: [ architecture, serverless, aws, event-driven, event-sourcing, projections, sqs, eventbridge, idempotency, event-sauce ]
image: /img/og/adr-015-serverless-event-fan-out.jpg
---

# ADR-015: Serverless Event Fan-Out and Idempotent Projections

**Status:** Accepted  
**Date:** 2026-04-06

## Context

The application is built as a modular monolith utilizing Event Sourcing (EventSauce) and CQRS, deployed on a serverless
AWS infrastructure (Bref, Lambda, DynamoDB). Domain events are appended to a DynamoDB event store. These events must
trigger read model projections (within the same Bounded Context) and external reactions/commands (in other Bounded
Contexts).

We face three main architectural challenges:

1. **Failure Isolation:** Synchronously processing all listeners in one Lambda execution means one failing projection
   fails the entire batch.
2. **Coupling via Infrastructure:** Writing imperative code (e.g., in PHP) to forward events to specific Context queues
   violates the autonomy of Bounded Contexts and creates a "mini-orchestrator".
3. **Ordering and Throughput:** Event Sourcing naturally relies on the order of events. While AWS SQS FIFO queues
   guarantee ordering, they suffer from throughput limits and "head-of-line blocking" (one failing event blocks the
   entire aggregate queue).

## Decision

We adopt a **Declarative Context-Based Fan-Out Architecture** utilizing AWS EventBridge and Standard SQS, combined with
strict **Playhead-Based Idempotency**.

1. **Declarative Fan-Out via EventBridge:** A single DynamoDB stream forwarder unconditionally publishes all newly
   appended domain events to a central AWS EventBridge bus. The actual routing is handled declaratively via
   Infrastructure as Code (`serverless.yml`), ensuring the core PHP application remains completely unaware of the target
   queues.
2. **Context-Level Standard Queues:** We route events from EventBridge into dedicated SQS queues based on the target
   Bounded Context. We explicitly use **Standard SQS** (not FIFO) to ensure infinite horizontal scalability and avoid
   head-of-line blocking.
3. **Playhead-Based Idempotency (Out-of-Order Handling):** Because Standard SQS does not guarantee strict ordering, and
   because retries can cause duplicate deliveries, **all projectors MUST implement playhead-based idempotency**.
    * Every event contains the `playhead` (version) of the Aggregate.
    * The projector must check the currently projected version in the read database.
    * If an event arrives out of order (e.g., expecting playhead 2, but received playhead 3), the projector must throw
      an exception or explicitly reschedule the event to force a retry later.
    * If an event is a duplicate (playhead already processed), it must be silently ignored.
4. **Synchronous Internal Dispatching:** Inside the Lambda worker of a specific context, the event is dispatched
   synchronously (via Symfony Messenger) to all relevant Projectors and Anti-Corruption Layer (ACL) subscribers
   belonging to that context.

### Example Configuration Strategy

```yaml
# serverless.yml (Declarative Routing)
functions:
  training-worker:
    handler: src/Training/Infrastructure/Delivery/Messaging/SqsWorker.php
    events:
      - sqs: arn:aws:sqs:...:Training-Events-Standard-Queue

  statistics-worker:
    handler: src/Statistics/Infrastructure/Delivery/Messaging/SqsWorker.php
    events:
      - sqs: arn:aws:sqs:...:Statistics-Events-Standard-Queue
```

## Consequences

### Positive

* **High Failure Isolation:** A database timeout in the `Training` projections will only fail the `Training` worker. The
  `Statistics` worker will continue to process the same event successfully.
* **Zero Code Coupling:** Adding a new Bounded Context requires zero changes to the Domain or the Event Forwarder code.
  It only requires a new EventBridge rule in the infrastructure config.
* **No Head-of-Line Blocking:** If one specific aggregate state causes an error, it will retry independently without
  blocking the event processing for other users/aggregates.
* **Maximum Throughput:** Standard SQS allows for virtually unlimited throughput compared to the strict limits of FIFO
  queues.

### Negative

* **Increased Projection Complexity:** Developers cannot simply execute relative database updates (e.g.,
  `count = count + 1`). They must explicitly read, compare, and validate the aggregate `playhead` before persisting the
  read model update.
* **Eventual Consistency:** Read models will not be updated in the same web request that generated the command. UI
  implementations must account for this via optimistic updates or polling.