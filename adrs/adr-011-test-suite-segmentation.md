---
id: adr-011-test-suite-segmentation
title: ADR-011 Test Suite Segmentation & Configuration
description: Decision to categorize tests by type into distinct directories and use isolated configuration files to optimize pipelines, environment setups, and enforce strict mocking rules.
tags: [ architecture, testing, devops, phpunit, event-sourcing, bdd, api-testing, mocking ]
---

# ADR-011: Test Suite Segmentation & Configuration

**Status:** Accepted  
**Date:** 2026-04-05

## Context

As the application grows, the number of tests increases. Running all tests for every minor change slows down the
feedback loop. Furthermore, different types of tests have fundamentally different technical requirements and require
different testing mindsets:

* Pure logic tests must be lightning-fast and focus on state.
* Behavior-Driven tests focus on business use-cases.
* Orchestration tests must verify interactions without hitting databases.
* Integration tests require external infrastructure (e.g., databases).
* API tests require booting the application framework and HTTP kernel.

Mixing these tests in a single directory makes it difficult to run them selectively or to apply consistent structural
rules. Additionally, using a single, global `phpunit.xml` configuration leads to bleeding environment variables and
distorted code coverage metrics.

Most importantly, without strict boundaries, developers tend to mix "State Verification" and "Interaction Verification,"
leading to brittle unit tests overloaded with complex mocks.

## Decision

### 1. Directory Segmentation & Mocking Rules

We decided to segment our test suite into five distinct directories within the `tests/` folder, each reflecting a
specific scope, execution speed, structural rule, and mocking strategy:

1. **`tests/Unit/`**: Tests for pure business logic (e.g., Value Objects, Domain Policies, Entities).
    * **Structure:** Must mirror the directory structure of the `src/` folder.
    * **Testing Style:** State Verification only.
    * **Mocking Rule:** Mocks for interaction testing (e.g., `$mock->expects($this->once())`) are **strictly forbidden
      **. Tests must use real objects. Simple stubs are only allowed to fake environmental inputs (e.g., a
      `ClockInterface` stub returning a fixed time).

2. **`tests/Behavior/`**: Event Sourcing scenario tests using the Given-When-Then pattern (
   `Given[OldEvents] -> When[Command] -> Then[NewEvents]`).
    * **Structure:** Organized logically by Command or Use Case (does not mirror `src/`).
    * **Testing Style:** Contract and Behavior Verification of the Aggregate Root as a whole.

3. **`tests/Application/`**: Tests that verify the orchestration within the Application Layer (e.g., Command Handlers).
    * **Structure:** Must mirror the directory structure of the `src/Application/` folder.
    * **Testing Style:** Interaction Verification.
    * **Mocking Rule:** These tests **must** use Test Doubles (Mocks, Spies, or In-Memory Repositories) for all outgoing
      ports (e.g., Event Buses, Repositories). They verify the sequence and correct delegation of calls without
      executing infrastructure code. They are not End-to-End (E2E) tests.

4. **`tests/Integration/`**: Tests for the Infrastructure Adapters (e.g., Repositories, external API Clients).
    * **Structure:** Mirrors the `src/Infrastructure/` folder.
    * **Testing Style:** Integration Verification. They verify the interaction between our code and external systems (
      like DynamoDB or PostgreSQL) using real (test) databases.

5. **`tests/Api/`**: Tests targeting the HTTP delivery boundary (e.g., Action-Domain-Responder endpoints).
    * **Structure:** Mirrors the Delivery/API folder.
    * **Testing Style:** Boundary/Subcutaneous Verification. They boot the framework kernel to verify HTTP routing,
      Request DTO validation, JSON response serialization, and ensure the correct Application Commands are dispatched.

### 2. Configuration and Execution Strategy

To enforce strict boundaries, environment isolation, and accurate code coverage, we do not use a single global
`phpunit.xml`. Instead, each test suite uses its own dedicated configuration file (e.g., `phpunit.unit.xml`,
`phpunit.integration.xml`, `phpunit.api.xml`):

* **Environment Variables:** External dependencies (like `DATABASE_URL`) are strictly defined in the XML files of the
  suites that require them (Integration, API). The Unit and Application test XMLs explicitly omit these to ensure tests
  fail immediately if they accidentally attempt network or database access.
* **Code Coverage Isolation:** Each XML file configures its own coverage `<source>`. For example, `phpunit.unit.xml`
  only measures coverage for `src/Domain/` and `src/Application/`, ensuring a strict 100% coverage target can be
  enforced. `phpunit.integration.xml` restricts its coverage analysis solely to `src/Infrastructure/`.

## Consequences

### Positive

* **Targeted Execution:** Developers and CI/CD pipelines can execute specific suites (e.g.,
  `phpunit -c phpunit.application.xml`) depending on the context of the code changes.
* **Clear Mocking Boundaries:** Developers know exactly when to use mocks (Application Layer) and when to avoid them (
  Domain Layer), leading to highly resilient and maintainable test code.
* **Refactoring Resilience:** Because `tests/Behavior/` does not mirror the internal class structure of the Aggregate
  Root, the Domain can be heavily refactored without breaking test paths.
* **Accurate Coverage:** Isolated XML files prevent integration tests from artificially inflating the unit test code
  coverage metrics, allowing for strict coverage gates in CI/CD.

### Negative

* **Structural Overhead:** Developers must understand the distinct rules for five different directories.
* **Configuration Maintenance:** PHPUnit requires managing multiple XML files, and the IDE (e.g., PHPStorm) requires
  custom configuration to map namespaces correctly to multiple test roots.