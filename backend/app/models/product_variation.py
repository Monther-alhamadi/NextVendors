from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base
from hashlib import sha1


class ProductVariationVariable(SQLAlchemyBaseModel, Base):
    __tablename__ = "product_variation_variables"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    identifier = Column(String(128), nullable=False, index=True)
    name = Column(String(128), nullable=True)
    ordering = Column(Integer, nullable=False, default=0)

    product = relationship("Product", back_populates="variation_variables")

    __table_args__ = (
        UniqueConstraint(
            "product_id", "identifier", name="uq_variant_variable_product_identifier"
        ),
    )


class ProductVariationVariableValue(SQLAlchemyBaseModel, Base):
    __tablename__ = "product_variation_variable_values"

    id = Column(Integer, primary_key=True, index=True)
    variable_id = Column(
        Integer, ForeignKey("product_variation_variables.id"), nullable=False
    )
    identifier = Column(String(128), nullable=False, index=True)
    value = Column(String(128), nullable=True)
    ordering = Column(Integer, nullable=False, default=0)

    variable = relationship("ProductVariationVariable", backref="values")

    __table_args__ = (
        UniqueConstraint(
            "variable_id", "identifier", name="uq_variable_value_variable_identifier"
        ),
    )


class ProductVariationResult(SQLAlchemyBaseModel, Base):
    __tablename__ = "product_variation_results"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    combination_hash = Column(String(40), nullable=False, index=True)
    result_product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    status = Column(Integer, nullable=False, default=1, index=True)

    product = relationship("Product", foreign_keys=[product_id])
    result = relationship("Product", foreign_keys=[result_product_id])

    __table_args__ = (
        UniqueConstraint(
            "product_id", "combination_hash", name="uq_product_combination_hash"
        ),
    )


def hash_combination(mapping: dict) -> str:
    """Create a SHA1 hex digest from a mapping of variable -> value (IDs or objects).

    Accepts either ints or ORM objects with `id` attributes.
    """
    parts = []
    for variable, value in mapping.items():
        v = variable.id if hasattr(variable, "id") else int(variable)
        w = value.id if hasattr(value, "id") else int(value)
        parts.append(f"{v}={w}")
    parts.sort()
    raw = ",".join(parts).encode("utf-8")
    return sha1(raw).hexdigest()


__all__ = [
    "ProductVariationVariable",
    "ProductVariationVariableValue",
    "ProductVariationResult",
    "hash_combination",
]
