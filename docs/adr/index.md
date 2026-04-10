---
title: Architecture Decision Records
description: Thematic and chronological list of all architectural decisions for poolplayers.world.
sidebar_position: 1
---

# Architecture Decision Records

Here you can find all strategic architectural decisions for the poolplayers.world platform. Instead of chronological
order, these records are grouped by their architectural domain to provide better context.

### Macro-Architecture & Core Paradigms

Decisions defining the fundamental boundaries, paradigms, and physical structure of the system.

* [ADR-001: Event Sourcing and CQRS](/docs/adr/adr-001-event-sourcing-and-cqrs)
* [ADR-002: Modular Monolith over Microservices](./adr-002-modular-monolith)
* [ADR-003: Hexagonal Architecture (Ports and Adapters)](./adr-003-hexagonal-architecture)
* [ADR-008: Strict Framework Agnosticism in the Domain Layer](./adr-008-strict-framework-agnosticism)
* [ADR-014: Cross-Context References & Shared Kernel](./adr-014-cross-context-references)

### Domain Modeling & Event Sourcing

Decisions regarding the internal design of Aggregate Roots, Domain Events, and Business Policies.

* [ADR-004: Orchestrating Domain Policies in the Application Layer](./adr-004-domain-policy-orchestration)
* [ADR-005: Separation of State from Aggregate Root](./adr-005-separation-of-state)
* [ADR-012: Event Enrichment (Fat Events)](./adr-012-event-enrichment)

### API Design & Communication

Decisions on how external clients (Frontend/Mobile) interact with the application boundary.

* [ADR-006: Command-Based API & Action-Domain-Responder](./adr-006-action-domain-responder)
* [ADR-007: Identifier Generation Strategy](./adr-007-identifier-strategy)
* [ADR-009: API Response Strategy for Command Endpoints](./adr-009-api-response-strategy)

### Infrastructure, Cloud & Data

Decisions concerning persistence, AWS serverless routing, compliance, and serialization.

* [ADR-010: Handling Personal Data (GDPR) in an Event-Sourced System](./adr-010-gdpr-pii-handling)
* [ADR-013: Centralized Serialization for Typed Domain Events](./adr-013-typed-event-properties)
* [ADR-015: Serverless Event Fan-Out and Idempotent Projections](./adr-015-serverless-event-fan-out)

### Quality Assurance & Testing

Decisions defining how we ensure system stability and deployment confidence.

* [ADR-011: Test Suite Segmentation & Configuration](./adr-011-test-suite-segmentation)
* [ADR-016: Testing Strategy and the Honeycomb Model](./adr-016-testing-strategy)