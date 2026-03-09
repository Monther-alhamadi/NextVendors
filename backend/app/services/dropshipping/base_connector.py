from abc import ABC, abstractmethod
from typing import Dict, Any

class DropshippingConnector(ABC):
    """
    Abstract base class for all dropshipping supplier connectors.
    Follows a professional, pluggable architecture.
    """
    
    def __init__(self, api_config: Dict[str, Any]):
        self.config = api_config

    @abstractmethod
    def sync_product(self, external_id: str) -> Dict[str, Any]:
        """Fetch real product data from the supplier."""
        pass

    @abstractmethod
    def place_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Forward a real order to the supplier API."""
        pass

    @abstractmethod
    def track_order(self, external_order_id: str) -> Dict[str, Any]:
        """Get live tracking status from the supplier."""
        pass
