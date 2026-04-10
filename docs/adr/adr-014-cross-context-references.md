---
id: adr-014-cross-context-references
title: ADR-014 Cross-Context References & Shared Kernel
description: Decision on how to reference identities across different Bounded Contexts to maintain strict autonomy and prevent tight coupling.
tags: [ architecture, domain-driven-design, bounded-context, shared-kernel, coupling ]
image: /img/og/adr-014-cross-context-references.jpg
---

# ADR-014: Cross-Context References & Shared Kernel

**Status:** Accepted  
**Date:** 2026-04-06

## Context

Our application is divided into autonomous Bounded Contexts (e.g., `User`, `Training`). Entities in one context often
need to reference entities in another. For example, a `TrainingSession` (in `Training`) needs to record which user
completed it.

Directly importing domain classes across context boundaries (e.g., `use App\User\Domain\UserId;` inside `src/Training/`)
creates a hard physical dependency. If the `User` context changes, the `Training` context breaks. This violates the
autonomy of Bounded Contexts and makes future extraction into microservices impossible.

## Decision

We enforce strict boundary rules for cross-context referencing:

1. **Zero Cross-Context Domain Imports:** Classes within the `Domain` or `Application` layer of one context are *
   *strictly forbidden** from importing classes from another context's `Domain` or `Application` layer.
2. **Referencing by ID:** Contexts may only reference concepts from other contexts via their identity (e.g., storing a
   `userId`, not the `User` object).
3. **The Shared Kernel for Universal Concepts:** For truly universal, system-wide identities that originate from
   external foundations (specifically the Cognito User ID / Sub), we place the Value Object (`UserId`) into the **Shared
   Kernel** (`src/Shared/Domain/UserId.php`). All contexts are allowed to import from `App\Shared\`.
4. **Context-Specific Translation:** If Context A needs to reference an ID from Context B that is *not* in the Shared
   Kernel, Context A must define its own local Value Object for that ID (e.g., `App\Training\Domain\DrillId`) and the
   boundary layer (Controller/Event-Listener) translates the primitive string into this local ID.

## Consequences

### Positive

* **High Autonomy:** Contexts remain fully decoupled. The `Training` context can be modified, tested, and potentially
  deployed without needing the `User` context.
* **Clear Rules:** Developers have a hard rule (detectable via static analysis tools like Deptrac) against cross-context
  imports.
* **Ubiquitous Language:** Each context maintains its own pure domain model.

### Negative

* **Shared Kernel Risk:** The `Shared` directory can become a dumping ground if not strictly monitored. Only genuinely
  universal concepts (like system-wide IDs or foundational abstractions) belong here.