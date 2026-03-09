# Architecture & Clean Architecture mapping

This project follows Clean Architecture principles with separation of concerns and domain-driven design patterns.

Layers and where to find them:

- Domain (Entities / Models): `backend/app/models`
  - `User`, `Product`, `Order`, `OrderItem` and related domain objects reside here.
  - Entities contain small, deterministic domain functions (e.g., `Order.calculate_total`).

- Use Cases (Services / Business Logic): `backend/app/services`
  - Implement `BaseService` and concrete service classes such as `UserService`, `ProductService`, and `OrderService`.
  - Services handle transactions, validation orchestration, and side-effects (e.g., notification sending).

- Interface Adapters (API / Controllers): `backend/app/api/v1/endpoints`
  - FastAPI route handlers (controllers) receive requests, validate them via Pydantic schemas, call services, and return responses.

- Infrastructure & Frameworks: `backend/app/core` and `backend/app/utils`
  - Database connection and SQLAlchemy configuration (`core.database`), security helpers (`core.security`), caching (`core.cache`) and configuration (`core.config`).
  - Middleware, monitoring, and logging are also in `core`.

- Presentation: `frontend/` (Vite + React)
  - Components, pages, and services for the client are in `frontend/src`.

Security & Cross-cutting concerns:
- Authentication & Authorization: `core/security.py` + OAuth2 endpoints in `api/v1/endpoints/auth.py`.
- Rate limiting: `core/rate_limiter.py` and `slowapi` decorators in endpoints.
- Caching: `core/cache.py` and Per-namespace invalidation in services (e.g., `ProductService`).
- Monitoring and logging: `core/monitoring.py` and `core/logging_config.py`.

Testing:
- Unit tests: `backend/tests/test_services` and `backend/tests/test_models`.
- Integration tests: `backend/tests/test_api` and `backend/tests/test_integration`.

Notes & Good Practices:
- Keep database session management inside the service layer and pass `Session` objects explicitly for easier testing and separation.
- Avoid business logic in API endpoints — endpoint handlers should validate and map to DTOs then call services.
- Implement feature flags with runtime endpoints (e.g., `admin/cache/config`) and environment variables with proper fallbacks.

This mapping helps maintain single responsibility and testability.
