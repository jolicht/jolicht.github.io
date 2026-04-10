---
id: adr-006-action-domain-responder
title: ADR-006 Command-Based API & Action-Domain-Responder
description: Decision to use a Command-Based API via the Action-Domain-Responder pattern, relying primarily on GET and POST requests.
tags: [ architecture, api, action-domain-responder, delivery, command-based-api, cqrs ]
image: /img/og/adr-006-action-domain-responder.jpg
---

# ADR-006: Command-Based API & Action-Domain-Responder (ADR) Pattern

**Status:** Accepted  
**Date:** 2026-04-04

## Context

In traditional REST APIs, endpoints are usually grouped by entity within a single Controller (e.g.,
`TrainingSessionController`) and rely on standard HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) to perform CRUD
operations.

Because we use CQRS and Event Sourcing, our application requires a **Command-Based API**. In an event-sourced system, we
do not update or delete database rows directly. Instead, we dispatch specific business intents (Commands) that generate
Domain Events. Grouping all these distinct commands into a single traditional controller would violate the Single
Responsibility Principle and lead to bloated classes.

## Decision

We decided to structure our HTTP APIs using a **Command-Based API** approach combined with the *
*Action-Domain-Responder (ADR)** pattern within the Infrastructure layer (`Delivery/Api/`).

**1. HTTP Method Restriction:**
We abandon traditional RESTful CRUD semantics in favor of strict CQRS alignment. The API will primarily rely on two HTTP
methods:

* **`GET`**: Used exclusively to query Read Models (Projections) via the Application Query bus.
* **`POST`**: Used exclusively to dispatch Application Commands. We do not use `PUT`, `PATCH`, or `DELETE`. Instead of a
  `DELETE` request, a client issues a `POST` request to a specific command endpoint (e.g.,
  `POST /api/training-sessions/{id}/cancel`).

**2. Folder Structure (ADR Pattern):**
Every API endpoint is modeled as an individual, highly focused set of classes:

* **`Action/`**: Single-action Controllers (e.g., `CancelTrainingSessionAction`). They receive the Request, dispatch the
  Command/Query, and pass the result to the Resource.
* **`Request/`**: Strictly typed DTOs representing the incoming JSON payloads for specific commands.
* **`Resource/`**: Presenters mapping Query results to the final JSON response format.
* **`Validation/`**: Framework-specific constraints applied to the Request DTOs.
* **`Exception/`**: HTTP-specific exceptions mapped to appropriate status codes.

## Consequences

### Positive

* **1:1 Alignment with CQRS:** The API directly reflects the architecture. A `POST` request maps directly to a specific
  Application Command, making the workflow completely transparent.
* **Single Responsibility:** Each Action class has exactly one reason to change and only injects the dependencies it
  actually needs.
* **Business Intent:** API endpoints reflect explicit business operations (`/schedule`, `/cancel`) rather than generic
  data mutations (`PUT`).

### Negative

* **File Explosion:** A Command-Based API requires significantly more files. Each command requires its own Action,
  Request DTO, and potentially specific Exception classes.
* **Deviation from REST Conventions:** External developers or consumers accustomed to standard RESTful CRUD APIs (
  expecting `PUT` or `DELETE`) will face a learning curve when integrating with this API.