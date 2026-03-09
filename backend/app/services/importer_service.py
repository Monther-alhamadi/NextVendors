from typing import List, Any, Dict
import csv
import json

from app.services.product_service import ProductService
from app.services.inventory_service import InventoryService


class ImporterService:
    """Simple importer service to ingest product data from CSV/JSON.

    The importer is intentionally conservative: it maps common fields
    (name, description, price, inventory, category, images, variants)
    and delegates persistence to existing domain services.
    """

    def __init__(self, db):
        self.db = db
        self.prod = ProductService(db)
        self.inv = InventoryService(db)

    def _normalize_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize a dict-like row to the product payload expected
        by `ProductService.create`.
        """
        data: Dict[str, Any] = {}
        name = row.get("name") or row.get("title")
        if not name or len(name.strip()) < 2:
            raise ValueError("Invalid product name")
        data["name"] = name.strip()
        
        data["description"] = row.get("description") or ""
        
        try:
            price = float(row.get("price", 0))
            if price <= 0:
                raise ValueError("Price must be greater than zero")
            data["price"] = price
        except (ValueError, TypeError):
            raise ValueError("Invalid or missing price")

        try:
            inventory = int(row.get("inventory", 0))
            if inventory < 0:
                inventory = 0
            data["inventory"] = inventory
        except (ValueError, TypeError):
            data["inventory"] = 0
        data["category"] = row.get("category") or row.get("categories")

        imgs = row.get("images")
        if imgs and isinstance(imgs, str):
            # support semicolon/comma separated lists: url1;url2 or url1,url2
            if ";" in imgs:
                data["images"] = [u.strip() for u in imgs.split(";") if u.strip()]
            else:
                data["images"] = [u.strip() for u in imgs.split(",") if u.strip()]
        elif imgs and isinstance(imgs, (list, tuple)):
            data["images"] = imgs

        variants = row.get("variants")
        if variants and isinstance(variants, str):
            try:
                data["variants"] = json.loads(variants)
            except Exception:
                data["variants"] = None
        elif variants and isinstance(variants, (list, tuple)):
            data["variants"] = variants

        return data

    def import_from_dicts(self, rows: List[Dict[str, Any]]) -> List[Any]:
        created = []
        for r in rows:
            try:
                payload = self._normalize_row(r)
                p = self.prod.create(payload)
                created.append(p)
            except Exception:
                # best-effort: ignore and continue
                continue
        return created

    def import_from_csv(self, csv_path: str, delimiter: str = ",") -> List[Any]:
        rows = []
        with open(csv_path, newline='', encoding='utf-8') as fh:
            reader = csv.DictReader(fh, delimiter=delimiter)
            for r in reader:
                rows.append(r)
        return self.import_from_dicts(rows)

    def import_from_json(self, json_path: str) -> List[Any]:
        with open(json_path, encoding='utf-8') as fh:
            data = json.load(fh)
        if isinstance(data, list):
            return self.import_from_dicts(data)
        return []

    def import_from_url(self, url: str, provider: str = "aliexpress") -> Any:
        """Import a single product from an external URL."""
        # 1. Parse ID from URL (naive implementation)
        # AliExpress example: https://www.aliexpress.com/item/100500123456.html
        external_id = "unknown"
        if "aliexpress" in url:
            import re
            match = re.search(r'/item/(\d+)\.html', url)
            if match:
                external_id = match.group(1)
            else:
                 # fallback: just hash or use part of url
                 external_id = "mock-123" if "mock" in url else "unknown"
        elif "mock" in url or "test" in url:
             external_id = "mock-test"
        
        # 2. Connector
        from app.services.dropshipping.aliexpress_connector import AliExpressConnector
        connector = AliExpressConnector({}) # Empty config for now
        
        # 3. Fetch Data
        raw_data = connector.sync_product(external_id)
        
        if raw_data.get("status") == "pending_api_auth":
            # Just for demo, if it failed auth but we want to show 'something'
            return {"status": "error", "msg": raw_data["msg"]}
            
        # 4. Normalize
        # Map connector dict to product payload
        payload = {
            "name": raw_data.get("name", "Imported Product"),
            "description": raw_data.get("description", ""),
            "price": raw_data.get("price", 0.0),
            "category": raw_data.get("category", "Uncategorized"),
            "inventory": raw_data.get("stock", 0),
            "images": raw_data.get("images", []),
            "attributes": raw_data.get("attributes", {})
        }
        
        # 5. Create
        return self.prod.create(payload)
