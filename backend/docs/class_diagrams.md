# Class Diagrams / مخططات الفئات

This document describes the main class relationships used in the backend OOP models.

**High-level overview (English)**

- BaseEntity

  - fields: id, created_at, updated_at
  - used as a base for all domain entities

- PricingStrategy (interface / abstract)

  - compute_price(product, quantity) -> float
  - Implementations: FixedDiscountStrategy, PercentageDiscountStrategy

- Product (inherits BaseEntity)

  - encapsulates: \_sku, \_name, \_price, \_inventory
  - methods: is_available(), reduce_inventory(), apply_pricing(strategy)
  - composition: contains a PricingStrategy at runtime

- Category (inherits BaseEntity)

  - fields: name, description
  - composition: contains multiple Products

- OrderItem

  - composition: references Product
  - fields: quantity, unit_price
  - property: subtotal

- Order (inherits BaseEntity)

  - composition: list[OrderItem]
  - methods: add_item(), total()

- User (inherits BaseEntity)
  - encapsulates credentials and profile fields
  - methods: check_password(), set_password() (delegates to core security)

**مخطط بالعربية (نصّي)**

BaseEntity <- Product
BaseEntity <- Category
BaseEntity <- Order
BaseEntity <- User

Product --(has)--> PricingStrategy (interface)
Order --(contains)--> OrderItem --(references)--> Product
Category --(contains)--> Product

Notes:

- Inheritance: BaseEntity provides common fields and behavior.
- Encapsulation: model fields use private attributes (`_name`, `_price`) with public
  accessors where appropriate.
- Polymorphism: `PricingStrategy` implementations compute price differently.
- Composition: `Order` composes multiple `OrderItem`s; `Product` composes a pricing strategy.

Mapping to files:

- `backend/app/models/oop_models.py` : contains the OOP model implementations and strategies.

Usage:

- These models are presentation/logic-friendly wrappers and can be used by services
  to perform business logic before persisting via SQLAlchemy models (if needed).
