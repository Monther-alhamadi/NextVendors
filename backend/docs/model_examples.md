# Model examples — usage

This document provides simple Python examples showing how to use the SQLAlchemy models
in the `backend/app/models` package using the project's `SessionLocal` from `core.database`.

Run these examples inside a Python REPL or a script while the repository root is on `PYTHONPATH`:

```python
from app.core.database import SessionLocal, init_db
from app.models.user import User
from app.services.user_service import UserService
from app.models.product import Product
from app.services.product_service import ProductService
from app.models.order import Order
from app.models.order_item import OrderItem

# Ensure database is initialized (simpler for examples)
init_db()

# Create a session and use services
session = SessionLocal()
try:
    user_service = UserService(session)
    product_service = ProductService(session)

    # 1) Create a user
    user = user_service.register_user("alice", "alice@example.com", "password123")
    print(f"Created user: {user.id} / {user.username}")

    # 2) Create products
    p1 = product_service.create({"name": "Widget", "description": "Small widget", "price": 10.0, "inventory": 10})
    p2 = product_service.create({"name": "Gadget", "description": "Blue gadget", "price": 20.0, "inventory": 5})
    print(f"Products created: {p1.id}, {p2.id}")

    # 3) Create an order (low-level example):
    order = Order(user_id=user.id, shipping_address={"line1": "123 Main St"})
    order_item1 = OrderItem(product_id=p1.id, quantity=2, unit_price=p1.price)
    order_item2 = OrderItem(product_id=p2.id, quantity=1, unit_price=p2.price)
    order.items = [order_item1, order_item2]
    session.add(order)
    session.commit()
    session.refresh(order)

    print(f"Order created: {order.id} total: {order.calculate_total()}")

finally:
    session.close()
```

Notes:
- Prefer using the service layer for business logic (e.g., `order_service.create()`), which will implement consistency checks and inventory adjustments.
- For tests or quick scripts, use `init_db()` or `Base.metadata.create_all()` to create tables in SQLite memory or a file DB.
- Unit tests in `backend/tests/test_services/` provide richer examples of how to invoke services and validate behavior.

Documentation and style:
- Keep model methods small and deterministic — side effects (e.g. sending emails) belong in service or task layers.
- Use `to_dict()` for simple JSON serialization in admin scripts; use Pydantic models for API schemas.
