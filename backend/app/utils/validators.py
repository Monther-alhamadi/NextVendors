"""Validation helpers used by models and services.

This module contains small validators following the Single Responsibility
principle. Use them in Pydantic schemas, model constructors and service
layers to ensure consistent checks across the application.
"""

from __future__ import annotations

import re
from typing import List

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"


def is_valid_email(email: str) -> bool:
    """Return True if the email looks valid using a simple regex.

    This is intentionally small — heavier checks and sending validation
    emails should be used for critical flows.
    """
    return bool(re.match(EMAIL_REGEX, email))


def validate_price(price: float) -> float:
    """Validate price is a positive float; raise ValueError otherwise."""
    if price is None:
        raise ValueError("Price must be set")
    if not isinstance(price, (float, int)):
        raise TypeError("Price must be a number")
    if float(price) < 0:
        raise ValueError("Price must be positive")
    return float(price)


def validate_inventory(value: int) -> int:
    """Validate inventory is a non-negative integer."""
    if value is None:
        return 0
    if not isinstance(value, int):
        raise TypeError("Inventory must be an integer")
    if value < 0:
        raise ValueError("Inventory cannot be negative")
    return value


def validate_image_urls(urls: List[str]) -> List[str]:
    """Simple validation for a list of image urls. This function doesn't
    fetch URLs — it checks the list shape and basic URL form.
    """
    if urls is None:
        return []
    if not isinstance(urls, list):
        raise TypeError("Images must be a list of URLs")
    url_re = re.compile(r"https?://[\w\-\.]+(:\d+)?(/\S*)?")
    for u in urls:
        if not isinstance(u, str) or not url_re.match(u):
            raise ValueError(f"{u} is not a valid URL")
    return urls
