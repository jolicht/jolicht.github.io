---
id: adr-008-strict-framework-agnosticism
title: ADR-008 Strict Framework Agnosticism
description: Decision to enforce a strictly framework-agnostic Domain Layer, forbidding the use of external libraries, ORM attributes, or framework-specific validation.
tags: [ architecture, ddd, domain-layer, framework-agnostic ]
---

# ADR-008: Strict Framework Agnosticism in the Domain Layer

**Status:** Accepted  
**Date:** 2026-04-04

## Context

When developing domain models, it is highly tempting to use framework-provided tools to simplify data validation or
database mapping. For instance, developers often add validation attributes (e.g., Symfony's `#[Assert\NotBlank]`) to
Value Objects, or ORM attributes (e.g., Doctrine's `#[ORM\Column]`) directly to Aggregate State classes.

While this seems like a harmless addition of "metadata," it tightly couples the core business logic to specific
third-party vendors. If a framework upgrade introduces breaking changes to these attributes, or if the project needs to
migrate to a different infrastructure, the core domain must be modified. Furthermore, relying on framework tools within
the domain often leads to anemic models where validation is outsourced to external validators rather than being enforced
through encapsulation and constructor constraints.

## Decision

We decided to enforce **Strict Framework Agnosticism** within the Domain Layer (`src/<BoundedContext>/Domain/`).

The Domain Layer contains the pure business logic, rules, and state of the application. It is completely
framework-agnostic and has zero dependencies on the Application or Infrastructure layers.

**Hard Rules:**

1. **No Framework Namespaces:** Classes within the `Domain/` directory must not contain `use` statements originating
   from frameworks (e.g., `Symfony\*`, `Illuminate\*`, `Doctrine\*`).
2. **Exception for Language Standards:** Standard PHP libraries, native attributes, and highly ubiquitous interfaces (
   e.g., `DateTimeImmutable`, `Throwable`) are permitted.
3. **Internal Invariants:** Domain invariants must be validated using pure PHP logic (e.g.,
   `if ($value === '') throw new InvalidArgumentException()`) inside Value Objects and Aggregate Roots, rather than
   relying on external validation libraries.

## Consequences

### Positive

* **Ultimate Portability:** The entire domain logic can be copied into a different PHP project or framework without any
  modifications.
* **Lightning-Fast Tests:** Unit testing the domain requires zero framework bootstrapping. Tests run in milliseconds
  because there are no dependency injection containers or database ORMs to initialize.
* **Encapsulation:** By forcing invariant checks into the constructors of Value Objects and Aggregates, it becomes
  impossible to instantiate an invalid domain object.

### Negative

* **Duplication of Validation:** Validation rules often need to be defined twice: once as user-friendly framework
  constraints in the Request DTOs (Infrastructure Layer), and again as strict invariant checks within the Domain Value
  Objects.
* **Manual Mapping Required:** Because we cannot use ORM attributes in the domain, we must write explicit mapping logic
  in our Infrastructure Repositories to translate database records into Domain Objects, and vice versa.