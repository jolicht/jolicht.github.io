---
id: adr-002-modular-monolith
title: ADR-002 Modular Monolith over Microservices
description: Decision to build a Modular Monolith instead of Microservices to reduce operational overhead while maintaining strict boundaries.
tags: [ architecture, ddd, modular-monolith, microservices ]
image: /img/og/adr/adr-002-modular-monolith.jpg
---

# ADR-002: Modular Monolith over Microservices

**Status:** Accepted  
**Date:** 2026-04-04

## Context

Our system is designed around distinct business domains (Bounded Contexts). To ensure high cohesion and loose coupling,
a Microservices architecture is a common approach. Microservices allow for independent deployment, scaling, and
technology choices per domain.

However, distributed systems introduce significant operational and accidental complexity. This includes managing network
latency, distributed transactions, complex CI/CD pipelines, and distributed tracing. Given the current team size and the
early stage of the project, the infrastructure overhead required to properly maintain a
Microservices architecture would severely slow down feature delivery and business value creation.

## Decision

We decided to adopt a **Modular Monolith** architecture.

All Bounded Contexts will reside within a single codebase and a single deployment unit. However, they are strictly
separated at the directory level (`src/<BoundedContext>/`).

To keep the door open for a future extraction into microservices:

1. There must be **no direct dependencies** in the domain code between different bounded contexts.
2. Communication across boundaries must occur exclusively asynchronously via Domain Events or through explicitly defined
   API contracts (Ports) in the Application Layer.
3. Each module should ideally treat its data as private, even if they currently share the same physical database server.

## Consequences

### Positive

* **Low Operational Overhead:** A single deployment pipeline, a single repository, and simplified local development
  environments.
* **Refactoring Safety:** If we discover that our initial domain boundaries were wrong (which is common in early
  development phases), moving code between modules in a single repository is significantly easier than refactoring
  across microservice boundaries.
* **No Network Latency:** Synchronous cross-module calls (via Application Ports) happen in memory, avoiding the
  performance penalties and failure risks of HTTP/gRPC network calls.
* **Future-Proof:** Because the internal boundaries are strict, extracting a heavily loaded module into a standalone
  Microservice in the future remains a straightforward structural refactoring rather than a complete rewrite.

### Negative

* **Risk of Boundary Erosion:** Without physical network boundaries, there is a constant temptation to bypass the
  Application Ports and directly access classes or database tables of another module. This requires strict developer
  discipline and automated architectural tests (e.g., using PHPStan or Deptrac) to prevent the system from degrading
  into a Big Ball of Mud.
* **Coupled Deployments:** We cannot deploy a bug fix for the `Training` module without deploying the entire
  application.
* **Coupled Scaling:** We cannot scale resources independently. If one module requires massive CPU resources, the entire
  monolith must be scaled up.