---
title: Johannes Lichtenwallner
description: Senior Software Engineer · Software Architect · PHP · Symfony · Event Sourcing · CQRS
hide_table_of_contents: false
---

import Link from '@docusaurus/Link';

# Johannes Lichtenwallner

## Senior Software Engineer · Software Architect

PHP · Symfony · Event Sourcing · CQRS

I design systems by making architectural decisions explicit — including their trade-offs.

This site documents the architecture of a real-world sports tracking
platform ([poolplayers.world](https://poolplayers.world/)) using Architecture Decision Records (ADRs).
Instead of abstract guidelines, you’ll find concrete decisions and the reasoning behind them.

Covered areas include:

- Event Sourcing & CQRS in practice
- Modular Monolith vs. Microservices (and why)
- API design based on commands and boundaries
- Handling GDPR in an event-driven system

<div style={{ margin: '2rem 0' }}>
  <Link className="button button--primary button--lg"
    to="/docs/adr">Browse the ADRs</Link>
</div>

## Key Decisions

- [ADR-001: Event Sourcing & CQRS](./docs/adr/adr-001-event-sourcing-and-cqrs)
- [ADR-002: Modular Monolith over Microservices](./docs/adr/adr-002-modular-monolith)
- [ADR-010: Handling Personal Data (GDPR) in an Event-Sourced System](./docs/adr/adr-010-gdpr-pii-handling)
- [ADR-015: Serverless Event Fan-Out and Idempotent Projections](./docs/adr/adr-015-serverless-event-fan-out)
