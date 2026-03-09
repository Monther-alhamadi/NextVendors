from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional


class BaseEntity:
    """Simple base entity providing common fields and behaviour.

    This is intentionally independent from SQLAlchemy so it can be used for
    domain logic, testing, and composition with persistence models.
    """

    def __init__(self, id: Optional[int] = None) -> None:
        self.id: Optional[int] = id
        # Use timezone-aware UTC datetimes to avoid naive/aware comparison issues
        self.created_at: datetime = datetime.now(timezone.utc)
        self.updated_at: datetime = datetime.now(timezone.utc)

    def touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class PricingStrategy(ABC):
    """Strategy interface for computing final price."""

    @abstractmethod
    def compute_price(self, base_price: float, quantity: int) -> float:
        raise NotImplementedError()


class FixedDiscountStrategy(PricingStrategy):
    def __init__(self, discount_amount: float) -> None:
        self.discount_amount = discount_amount

    def compute_price(self, base_price: float, quantity: int) -> float:
        price = max(0.0, (base_price - self.discount_amount) * quantity)
        return price


class PercentageDiscountStrategy(PricingStrategy):
    def __init__(self, percent: float) -> None:
        self.percent = percent

    def compute_price(self, base_price: float, quantity: int) -> float:
        multiplier = max(0.0, 1.0 - (self.percent / 100.0))
        return base_price * quantity * multiplier


class Product(BaseEntity):
    def __init__(
        self,
        sku: str,
        name: str,
        price: float,
        inventory: int = 0,
        pricing_strategy: Optional[PricingStrategy] = None,
        id: Optional[int] = None,
    ) -> None:
        super().__init__(id=id)
        # encapsulated attributes
        self._sku = sku
        self._name = name
        self._price = float(price)
        self._inventory = int(inventory)
        # composition: product uses a pricing strategy
        self.pricing_strategy = pricing_strategy

    # meaningful property names with type hints
    @property
    def sku(self) -> str:
        return self._sku

    @property
    def name(self) -> str:
        return self._name

    @property
    def price(self) -> float:
        return self._price

    @property
    def inventory(self) -> int:
        return self._inventory

    def is_available(self, quantity: int = 1) -> bool:
        return self._inventory >= quantity

    def reduce_inventory(self, quantity: int = 1) -> None:
        if quantity < 0:
            raise ValueError("quantity must be positive")
        if quantity > self._inventory:
            raise ValueError("not enough inventory")
        self._inventory -= quantity
        self.touch()

    def calculate_price(self, quantity: int = 1) -> float:
        if self.pricing_strategy:
            return self.pricing_strategy.compute_price(self._price, quantity)
        return self._price * quantity

    def to_dict(self) -> dict:
        base = super().to_dict()
        base.update(
            {
                "sku": self._sku,
                "name": self._name,
                "price": self._price,
                "inventory": self._inventory,
            }
        )
        return base


class Category(BaseEntity):
    def __init__(
        self, name: str, description: Optional[str] = None, id: Optional[int] = None
    ) -> None:
        super().__init__(id=id)
        self._name = name
        self._description = description
        self._products: List[Product] = []

    @property
    def name(self) -> str:
        return self._name

    def add_product(self, product: Product) -> None:
        if product not in self._products:
            self._products.append(product)

    @property
    def products(self) -> List[Product]:
        return list(self._products)


@dataclass
class OrderItem:
    product: Product
    quantity: int
    unit_price: float

    @property
    def subtotal(self) -> float:
        return float(self.unit_price) * int(self.quantity)


class Order(BaseEntity):
    def __init__(self, user_id: Optional[int] = None, id: Optional[int] = None) -> None:
        super().__init__(id=id)
        self.user_id = user_id
        self._items: List[OrderItem] = []
        self.status: str = "pending"

    def add_item(self, item: OrderItem) -> None:
        # polymorphism: OrderItem may wrap different product types
        if not item.product.is_available(item.quantity):
            raise ValueError("Product not available in requested quantity")
        # reduce inventory as a side-effect of adding to order
        item.product.reduce_inventory(item.quantity)
        self._items.append(item)
        self.touch()

    @property
    def items(self) -> List[OrderItem]:
        return list(self._items)

    def total(self) -> float:
        return sum(item.subtotal for item in self._items)


class User(BaseEntity):
    def __init__(self, username: str, email: str, id: Optional[int] = None) -> None:
        super().__init__(id=id)
        self._username = username
        self._email = email
        self._password_hash: Optional[str] = None
        self.role: str = "customer"

    @property
    def username(self) -> str:
        return self._username

    @property
    def email(self) -> str:
        return self._email

    def set_password_hash(self, hashed: str) -> None:
        # encapsulate how password is stored
        self._password_hash = hashed

    def check_password_hash(self, hashed: str) -> bool:
        return self._password_hash == hashed

    def to_dict(self) -> dict:
        base = super().to_dict()
        base.update(
            {"username": self._username, "email": self._email, "role": self.role}
        )
        return base


__all__ = [
    "BaseEntity",
    "PricingStrategy",
    "FixedDiscountStrategy",
    "PercentageDiscountStrategy",
    "Product",
    "Category",
    "OrderItem",
    "Order",
    "User",
]
