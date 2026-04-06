---
id: directory-structure
title: Directory Structure Cheat Sheet
---

# Architecture and Directory Structure

The application is designed as a modular monolith. The codebase follows Domain-Driven Design (DDD), CQRS (Command Query
Responsibility Segregation), and Event Sourcing. The goal of this structure is high cohesion within business domains and
loose coupling between them, facilitating a smooth migration of individual modules to independent microservices if
needed.

## 1. Top Level

`src/`

The first level below the `src/` directory strictly divides the application into business boundaries (Bounded Contexts)
and cross-cutting technical foundations.

* **`src/<BoundedContext>/` (e.g., `src/Training/`)**
  Represents a self-contained business domain. Each bounded context logically operates as an independent application.
  There are no direct dependencies in the domain code between different bounded contexts. Communication across these
  boundaries occurs exclusively asynchronously via Domain Events or through defined API contracts in the Application
  Layer.

* **`src/Shared/` (Shared Kernel)**
  Contains purely technical, domain-agnostic infrastructure and base classes. These components are utilized by various
  bounded contexts to prevent code duplication in technical implementations. The Shared Kernel never contains business
  logic.
    * Examples: Abstract repository classes, generic DynamoDB adapters, central Symfony Messenger configurations (
      `Messaging/`), and generic EventSauce JSON serializers (`Serialization/`).

## 2. Application Layer

`src/<BoundedContext>/Application/`

The Application Layer orchestrates business use cases, implements CQRS, and defines communication contracts (Ports). It
coordinates operations but contains no core business logic.

* **`Command/`**
  Contains state-mutating operations. Each use case consists of a Command (a flat Data Transfer Object) and a
  CommandHandler.
    * **`Input/`**: Houses nested objects or complex data structures required as input by a Command.
* **`Query/`**
  Contains read-only operations. Each use case consists of a Query (DTO) and a QueryHandler.
    * **`Result/`**: Contains the specific Data Transfer Objects or View Models returned by the QueryHandlers.

* **`Port/`**
  Defines interfaces for interactions crossing the boundary of the Application Layer (Hexagonal Architecture).
    * **`Out/` (Outbound)**: Interfaces required by the Application Layer to fetch data or trigger operations in other
      Bounded Contexts or external services. These are implemented in the Infrastructure Layer.
    * **`In/` (Inbound)**: Explicit API contracts provided to other Bounded Contexts to execute logic within this
      context, if the standard Command/Query bus is not exposed directly.

* **`Projection/`**
  Contains the Projectors (Event Handlers). These classes listen to Domain Events and determine how the data should be
  transformed to build or update specific Read Models. They orchestrate the update process but delegate the actual
  database operations to Outbound Ports.

### Example Directory Structure

```text
src/Training/Application/
├── Command/
│   ├── Input/
│   │   └── ParticipantDto.php                  # Complex nested input structure
│   ├── ScheduleTrainingSession.php             # The Command (DTO)
│   └── ScheduleTrainingSessionHandler.php      # The Handler
├── Query/
│   ├── Result/
│   │   └── TrainingSessionViewModel.php        # The optimized read structure
│   ├── GetTrainingSession.php                  # The Query (DTO)
│   └── GetTrainingSessionHandler.php           # The Handler
├── Port/
│   ├── In/
│   │   └── TrainingManagementInterface.php     # Explicit API for other contexts
│   └── Out/
│       └── TrainingSessionReadModelPort.php    # Interface for DB operations
└── Projection/
    └── TrainingSessionProjector.php            # Listens to Domain Events
```

## 3. Domain Layer
`src/<BoundedContext>/Domain/`

The Domain Layer contains the pure business logic, rules, and state of the application. It is completely
framework-agnostic and has zero dependencies on the Application or Infrastructure layers. In an Event-Sourced system,
this layer dictates how state changes occur through events.

* **`Aggregate/`**
  Contains the Aggregate Roots, which act as the transactional boundaries for state changes. The Aggregate's internal
  State class is placed directly alongside the Aggregate Root to maintain high cohesion.
    * **`State/` (Optional)**: Only necessary if the Aggregate's state is highly complex and divided into multiple
      sub-state classes.
    * **`ValueObject/`**: Immutable objects that describe characteristics or attributes (e.g., `TrainingSessionId`,
      `Duration`).
    * **Repository Interfaces**: The interface for retrieving and saving the Aggregate (e.g.,
      `TrainingSessionRepository`) is placed at the root of the Aggregate folder.

* **`Event/`**
  Contains Domain Events. These are immutable records of facts that have successfully occurred within the system. They
  primarily contain primitive types or Domain Value Objects.
    * **`Payload/` (Optional)**: Contains specific DTOs used strictly to organize complex payloads within a specific
      Domain Event.

* **`Exception/`**
  Contains domain-specific exceptions (e.g., `RoomAlreadyBookedException`). These are thrown when a business rule
  constraint is violated.

* **`Service/`**
  Contains Domain Services and Domain Policies. These encapsulate complex, stateless business rules that coordinate
  multiple concepts or query external states.
    * **Execution (Approach A)**: Domain Policies are orchestrated by the Application Command Handlers before the
      Aggregate Root is invoked. The Aggregate Root methods remain free of injected services.

### Example Directory Structure

```text
src/Training/Domain/
├── Aggregate/
│   ├── TrainingSession.php                     
│   ├── TrainingSessionState.php                
│   ├── TrainingSessionRepository.php           
│   └── ValueObject/
│       ├── TrainingSessionId.php
│       ├── RoomId.php
│       └── TimeSlot.php
├── Event/
│   ├── TrainingSessionStarted.php
│   ├── TrainingSessionScheduled.php
│   └── Payload/
│       └── ExternalWorkoutData.php
├── Exception/
│   └── RoomAlreadyBookedException.php
└── Service/
    ├── RoomAvailabilityPolicy.php              
    └── AthleteFatigueCalculator.php
```

## 4. Infrastructure Layer
`src/<BoundedContext>/Infrastructure/`

The Infrastructure Layer provides the technical capabilities that support the application. It contains the concrete
implementations (Adapters) of the interfaces (Ports) defined in the Domain and Application layers.

* **`Database/`**
  Contains the technical implementations for data persistence.
    * **`Repository/`**: Implementations of the Domain Repository interfaces (e.g., Event Store configuration).
    * **`ReadModel/`**: Implementations of the Application Layer's Outbound Ports (e.g., DynamoDB adapters for
      Projections).

* **`Delivery/` (or `Api/`)**
  Contains the Inbound Adapters (Driving Adapters) that serve as entry points.
    * **`Cli/`**: Console commands for cronjobs, maintenance, or manual triggers.
    * **`Api/`**: HTTP endpoints (REST/GraphQL) structured via the Action-Domain-Responder pattern:
        * **`Action/`**: Single-action Controllers that dispatch Commands/Queries.
        * **`Request/`**: DTOs representing incoming JSON payloads.
        * **`Resource/`**: Transformers mapping Query results to JSON responses.
        * **`Validation/`**: Framework-specific validation constraints for incoming requests.
        * **`Exception/`**: HTTP-specific exceptions (e.g., `400 Bad Request` formats).

* **`Messaging/` & `Serialization/` (Context-Specific Only)**
  Most messaging and serialization infrastructure belongs in the `Shared/` Kernel. These folders only exist in a
  specific Bounded Context if highly custom, domain-exclusive adapters are required (e.g., a specific payload upcaster
  or an adapter for a domain-exclusive external hardware queue).

### Example Directory Structure

```text
src/Training/Infrastructure/
├── Database/
│   ├── Repository/
│   │   └── EventSauceTrainingSessionRepository.php
│   └── ReadModel/
│       └── DynamoDbTrainingSessionReadModelAdapter.php
└── Delivery/
    ├── Cli/
    │   └── RebuildProjectionsCommand.php
    └── Api/
        ├── Action/
        │   └── ScheduleTrainingSessionAction.php
        ├── Request/
        │   └── ScheduleSessionRequestDto.php
        ├── Resource/
        │   └── TrainingSessionResource.php
        ├── Validation/
        │   └── ValidTimeSlotConstraint.php
        └── Exception/
            └── MalformedScheduleRequestException.php
```