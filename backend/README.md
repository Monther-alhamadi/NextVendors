# Backend — ecommerce-store

This backend is built with FastAPI and SQLAlchemy. The project follows Clean Architecture principles with a clear separation between models (domain), services (business logic), and API layers.

How to run tests:

```pwsh
python -m pytest backend/tests -q
```

Key files:

- `app/models/*`: Domain models (SQLAlchemy) — small, focused methods
- `app/services/*`: Service layer implements business logic and the repository pattern
- `app/api/*`: FastAPI endpoints and schema definitions (Pydantic)
- `app/utils/validators.py`: Reusable validators used by models and pydantic schemas.

Recent additions:

- `ProductVariant` model and service endpoints for product variants (size/sku/price/inventory)
- Extended `ProductImage` with `kind`, `position`, and `public` metadata for richer media handling
- Added Shuup-inspired advanced product variations: `ProductVariationVariable`, `ProductVariationVariableValue`, `ProductVariationResult` with APIs to create variables, values, set mapping results, and resolve combinations (see `/api/v1/products/{product_id}/variation_variables`, `/api/v1/products/{product_id}/variation_results`, and `/api/v1/products/{product_id}/resolve_variation`)

Design notes:

- Type hints and docstrings are included for most domain classes.
- `BaseModel` provides save/delete helpers that take a `Session` and wrap transactions.
- Validation is intentionally small and deterministic — do not place heavy I/O in models.

Migrations:

- Alembic migrations live in the root `alembic/versions` folder. The backend `alembic` directory contains legacy/secondary migration files — the root `alembic` is canonical for CI and local workflows.
- Use a clean DB for running `alembic upgrade head` during development to avoid conflicting existing schema objects, or run the test `backend/tests/test_migrations/test_upgrade.py` which will verify the full migration chain on a temporary sqlite database.
- When adding new migrations, ensure they are added to the root `alembic/versions` folder and keep migrations non-destructive. Migration scripts include guards to avoid adding duplicate columns when running against DBs that already have those fields.

New features added:

- Pricing & Tax: `TaxRate` model and `PricingService` to compute net price and taxes. Default tax rate controlled by `DEFAULT_TAX_RATE` setting.
- Coupons/Discounts: `Coupon` model and `DiscountService` to create and apply coupon codes. Coupons support `start_at` / `expires_at` time windows, `min_order_amount`, `max_uses` (global), `per_user_limit`, and a `stackable` flag. Per-user redemptions are tracked in a `coupon_redemptions` table.
- Orders now store `tax_total` and `discount_total` columns and order totals include those values.
- Import utilities: `backend/scripts/import_products.py` and `app.services.importer_service.ImporterService` provide CSV/JSON import of products (name, price, inventory, category, images, variants).
- Reports: A basic PDF order printout generator is available at `app.services.report_service.generate_order_pdf`. It relies on the optional `reportlab` package (add to dev requirements to enable PDF tests).
- Background tasks: a lightweight in-process task queue is available via `app.models.task.Task` and `app.services.task_service.TaskService` with a simple worker script `backend/scripts/run_tasks.py`. This is intended for development; for production you may replace it with Celery/RQ backed workers.

To migrate existing databases, run:

```sh
alembic upgrade head
```

This will create `tax_rates`, `coupons` and add `tax_total`/`discount_total` to `orders`.

- For production: always back up your DB and test migrations on a staging copy before applying them to production.
