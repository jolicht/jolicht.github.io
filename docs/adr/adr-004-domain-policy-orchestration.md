---
id: adr-004-domain-policy-orchestration
title: ADR-004 Orchestrating Domain Policies
description: Decision to orchestrate Domain Policies in the Application Layer to keep Aggregate Roots pure and free of injected services.
tags: [ architecture, ddd, application-layer, domain-policy ]
---

# ADR-004: Orchestrating Domain Policies in the Application Layer

**Status:** Accepted  
**Date:** 2026-04-04

## Context

Within our domain, we frequently encounter complex business rules that require verifying state beyond a single Aggregate
Root or coordinating multiple concepts. For example, before scheduling a training session, we might need to verify if a
specific player is already scheduled for another session (e.g., an individual session with another coach, or a
concurrent group training) at the exact same time (`PlayerAvailabilityPolicy`).

Since Aggregate Roots act as transactional boundaries and must remain pure and completely framework-agnostic, they
cannot query external data or infrastructure themselves. We considered two primary approaches to solve this:

* **Approach A (Application Layer Orchestration):** The Application Command Handler resolves the required data, invokes
  the Domain Policy, and only calls the Aggregate Root's state-mutating method if the policy evaluation passes.
* **Approach B (Double Dispatch):** The Application Command Handler passes the Domain Policy (or Domain Service) as an
  argument directly into the Aggregate Root's method (e.g., `$aggregate->schedule($time, $player, $policy)`), allowing
  the Aggregate to execute the policy internally.

## Decision

We decided to use **Approach A (Application Layer Orchestration)**.

Domain Services and Policies are orchestrated by the Application Command Handlers before the Aggregate Root is invoked.
The Application Command Handlers are responsible for translating primitive data into Domain Value Objects, invoking the
necessary Domain Policies, and subsequently loading and mutating the Aggregate Root.

Consequently, Aggregate Root methods remain completely free of injected services. Furthermore, Domain Policies operate
strictly on Domain Value Objects and must never accept Application Commands (DTOs) as parameters.

## Consequences

### Positive

* **Pure Aggregates:** Aggregate Roots remain 100% pure and unpolluted. Their method signatures only require primitive
  types or Value Objects, making them extremely straightforward to understand.
* **Easier Testing:** Unit testing Aggregates does not require mocking Domain Services or Repositories. We only need to
  provide the correct Value Objects.
* **Separation of Concerns:** The workflow (load data &rightarrow; validate complex cross-aggregate rules &rightarrow;
  mutate state &rightarrow; save) is explicitly visible in one place: the Application Layer.

### Negative

* **Fatter Handlers:** Command Handlers take on more responsibility and become slightly larger.
* **Risk of Leaking Logic:** Developers must be highly disciplined to keep the *actual rule evaluation* inside the
  Domain Layer (`Domain/Service/`). The Command Handler should only *orchestrate* the call, not contain the `if/else`
  business logic itself. If discipline is lost, core domain logic might bleed into the Application Layer, resulting in
  an Anemic Domain Model.