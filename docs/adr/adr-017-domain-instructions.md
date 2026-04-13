---
id: adr-017-domain-instructions
title: ADR-017 Domain Instructions vs. Application Commands
description: Decision to strictly separate external Application Commands from internal Aggregate Parameter Objects (Domain Instructions) to maintain domain purity and prevent naming collisions.
tags: [ architecture, ddd, cqrs, aggregate-design, testing ]
image: /img/og/adr/adr-017-domain-instructions.jpg
---

# ADR-017: Domain Instructions vs. Application Commands

**Status:** Accepted  
**Date:** 2026-04-13

## Context

In our CQRS and Event-Sourced architecture, the Application Layer uses **Commands** to encapsulate the intent of an
external actor (e.g., a user submitting a form via the API). These Application Commands are typically simple Data
Transfer Objects (DTOs) containing primitive data types (strings, integers) mapped directly from the HTTP request.

A common pattern in DDD is to pass these Command objects directly into the Aggregate Root's methods (e.g.,
`$aggregate->start($command)`). However, this creates several architectural issues:

1. **Layer Leakage:** The Domain Layer becomes coupled to the Application Layer's delivery mechanisms and DTO
   structures.
2. **Type Safety:** Application Commands often contain unvalidated primitives. The Domain Layer should operate
   exclusively on validated Value Objects (e.g., `TrainingSessionId` instead of `string $id`).
3. **Naming Collisions:** Creating a separate "Domain Command" alongside an "Application Command" with the exact same
   name (e.g., `StartTrainingSession`) leads to constant IDE auto-import conflicts and developer confusion.
4. **Huge Signatures:** Unpacking the Application Command in the handler and passing individual parameters to the
   Aggregate Root leads to excessively long method signatures (e.g.,
   `$aggregate->trackResult($id, $playerId, $score, $time, $fouls)`).

We need a standardized way to pass complex data into Aggregate Roots while keeping the Domain pure, strictly isolated
from the Application Layer, and easy to test.

## Decision

We will explicitly differentiate between **Application Commands** and **Domain Instructions**.

1. **Application Commands (`App\<Context>\Application\Command\`)**
    * Act as DTOs from the outside world.
    * Contain mostly primitive types.
    * Are handled by Application Command Handlers.

2. **Domain Instructions (`App\<Context>\Domain\Instruction\`)**
    * Act as Parameter Objects (POPOs) strictly for Aggregate Roots.
    * Contain fully validated Domain Value Objects (e.g., `TrainingSessionId`).
    * Implement an empty marker interface (`DomainInstruction`) for type safety.

**The Workflow:**
The Application `CommandHandler` receives the Application Command, validates the primitives, instantiates the necessary
Domain Value Objects, and constructs the `DomainInstruction`. This instruction is then passed to the Aggregate Root.

**Testing:**
In our Behavior Tests (Honeycomb Testing Strategy, ADR-016), we completely bypass the Application Layer. We instantiate
`DomainInstruction` objects directly and pass them to the EventSauce `AggregateRootTestCase::handle()` method. We
enforce type safety by utilizing `Webmozart\Assert` to ensure only objects implementing the `DomainInstruction`
interface are processed.

## Consequences

### Positive

* **Domain Purity:** The Domain Layer remains 100% agnostic of the Application Layer.
* **No IDE Conflicts:** By using the term "Instruction" in the domain (e.g., `Instruction\StartTrainingSession` vs
  `Command\StartTrainingSession`), we establish a clear Ubiquitous Language and avoid class name collisions.
* **Clean Signatures:** Aggregate Root methods receive a single, strongly-typed parameter object instead of a long list
  of variables.
* **Isolated Testing:** Behavior tests become purely domain-focused, acting exactly like the EventSauce documentation
  suggests.

### Negative

* **Boilerplate Code:** This introduces a slight overhead, as developers must create two classes (`Command` and
  `Instruction`) for complex operations and map the data between them in the Command Handler. However, we accept this
  trade-off in favor of long-term maintainability and strict boundary enforcement.