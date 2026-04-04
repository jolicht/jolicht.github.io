---
id: adr-003-hexagonal-architecture
title: ADR-003 Hexagonal Architecture
description: Decision to use Hexagonal Architecture (Ports and Adapters) to isolate business logic from technical infrastructure.
tags: [ architecture, ddd, hexagonal-architecture, ports-and-adapters ]
---

# ADR-003: Hexagonal Architecture (Ports and Adapters)

**Status:** Accepted  
**Date:** 2026-04-04

## Context

Enterprise applications often suffer from tight coupling between business rules and technical infrastructure. If
database queries, HTTP request parsing, and business validations are mixed within the same classes (e.g., "Fat
Controllers" or "Active Records"), the system becomes rigid. Testing business logic requires a database connection, and
upgrading the underlying framework or swapping a third-party API requires rewriting core domain code.

To ensure our application remains maintainable, testable, and adaptable over a long lifespan, we need a structural
pattern that protects the core business logic from external technical details.

## Decision

We decided to implement the **Hexagonal Architecture** (also known as Ports and Adapters) as the foundational layering
strategy for each Bounded Context.

The codebase is strictly divided into three layers, with a rigid dependency rule: **Dependencies must only point
inwards.**

1. **Domain Layer (Center):** Contains pure business logic. It is completely framework-agnostic and has zero
   dependencies on the Application or Infrastructure layers.
2. **Application Layer (Middle):** Orchestrates use cases. It coordinates operations but contains no core business
   logic. To interact with the outside world, this layer defines communication contracts called **Ports** (interfaces).
    * *Outbound Ports* (`Port/Out/`) are defined here when the application needs to fetch data or trigger external
      operations.
    * *Inbound Ports* (`Port/In/`) define explicit API contracts provided to other Bounded Contexts.
3. **Infrastructure Layer (Outer):** Provides the technical capabilities that support the application. It contains the
   concrete implementations (**Adapters**) of the interfaces (Ports) defined in the inner layers. Examples include API
   Controllers (`Delivery/Api/`), CLI commands, and database repositories.

## Consequences

### Positive

* **High Testability:** The Domain and Application layers can be unit-tested completely in isolation. By mocking the
  Outbound Ports (e.g., using an in-memory repository instead of a real database), tests run in milliseconds.
* **Framework Independence:** The core domain is entirely decoupled from Symfony, EventSauce, or any specific database
  engine. Upgrading or replacing these tools only affects the Infrastructure layer adapters.
* **Parallel Development:** Once a Port (interface) is defined in the Application layer, one developer can implement the
  business logic while another concurrently writes the database adapter in the Infrastructure layer.

### Negative

* **Increased Boilerplate:** We must write more code. Even if an interface (Port) currently only has a single
  implementation (e.g., a specific DynamoDB adapter), we must define the interface in the Application layer and
  implement the adapter in the Infrastructure layer.
* **Mapping Overhead:** Data must be mapped as it crosses boundaries. For example, an incoming HTTP JSON payload must be
  mapped to a Request DTO, then to an Application Command, and finally to Domain Value Objects.