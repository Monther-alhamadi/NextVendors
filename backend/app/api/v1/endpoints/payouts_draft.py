
@router.get("/my-balance")
def get_my_vendor_balance(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("supplier"))
):
    """Vendor: Get my own wallet balance and stats."""
    # Assuming user has a linked supplier record. 
    # Current implementation of `require_role("supplier")` returns a User object.
    # We need to find the supplier record associated with this user.
    
    # Check if user.suppliers is populated (backref)
    if not current_user.suppliers:
         # Fallback or error
         return {
             "balance": 0.0,
             "pending": 0.0,
             "total_payouts": 0.0,
             "last_payout": None
         }
    
    # Assuming one user can own one supplier for now, or we take the first one
    supplier = current_user.suppliers[0]
    
    # Calculate Balance
    balance = db.query(func.sum(VendorLedger.amount)).filter(VendorLedger.supplier_id == supplier.id).scalar() or 0.0
    
    # Calculate Pending (Orders not yet Paid to vendor? Or just balance logic?)
    # For now, let's say "Pending" tracks "FulfillmentOrders" that are not "completed"? 
    # Or maybe we just stick to Ledger balance for "Available".
    
    # Let's get "Total Payouts"
    total_payouts = db.query(func.sum(VendorLedger.amount))\
        .filter(VendorLedger.supplier_id == supplier.id)\
        .filter(VendorLedger.transaction_type == "PAYOUT")\
        .scalar() or 0.0
        
    return {
        "supplier_id": supplier.id,
        "name": supplier.name,
        "balance": balance,
        "total_payouts": abs(total_payouts) # Payouts are negative in ledger
    }
