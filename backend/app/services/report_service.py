import io


def generate_order_pdf(db, order_id: int) -> bytes:
    """Generate a simple PDF for an order. Returns PDF bytes.

    This function tries to import `reportlab` lazily so the project can
    continue to run if the optional dependency is not installed. If
    `reportlab` is missing a RuntimeError is raised with an actionable
    message.
    """
    try:
        from reportlab.pdfgen.canvas import Canvas
        from reportlab.lib.pagesizes import letter
    except Exception as exc:  # pragma: no cover - optional dependency
        raise RuntimeError(
            "Optional dependency 'reportlab' not installed. Install with 'pip install reportlab'"
        ) from exc

    # load order and items
    from app.models.order import Order

    try:
        order = db.get(Order, order_id)
    except Exception:
        order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise ValueError("Order not found")

    buf = io.BytesIO()
    c = Canvas(buf, pagesize=letter)
    c.setFont("Helvetica", 12)
    c.drawString(50, 750, f"Order ID: {order.id}")
    c.drawString(50, 735, f"Status: {getattr(order, 'status', '')}")
    c.drawString(50, 720, f"Total: {getattr(order, 'total_amount', 0.0)}")

    y = 700
    c.drawString(50, y, "Items:")
    y -= 15
    for item in getattr(order, "items", []) or []:
        prod_name = (
            getattr(item.get_product(), "name", f"Product {item.product_id}")
            if hasattr(item, "get_product")
            else f"Product {item.product_id}"
        )
        line = f" - {prod_name} x{getattr(item, 'quantity', 1)} @ {getattr(item, 'unit_price', 0.0)}"
        c.drawString(60, y, line)
        y -= 15
        if y < 50:
            c.showPage()
            y = 750

    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()
