class CartStore {
  constructor() {
    // try to restore from localStorage so cart survives reloads
    try {
      const raw = localStorage.getItem("cart");
      this.items = raw ? JSON.parse(raw) : [];
    } catch (e) {
      this.items = [];
    }
    this.total = 0;
    this.calculateTotal();
  }

  addItem(product, quantity = 1) {
    const found = this.items.find((i) => i.product.id === product.id);
    if (found) {
      found.quantity += quantity;
    } else {
      this.items.push({ product, quantity });
    }
    this.calculateTotal();
    this._persist();
    this._emit();
  }

  removeItem(productId) {
    this.items = this.items.filter((i) => i.product.id !== productId);
    this.calculateTotal();
    this._persist();
    this._emit();
  }

  updateQuantity(productId, quantity) {
    const found = this.items.find((i) => i.product.id === productId);
    if (found) {
      found.quantity = quantity;
    }
    this.calculateTotal();
    this._persist();
    this._emit();
  }

  calculateTotal() {
    // Avoid recalculating if items haven't changed since the last calculation.
    // Use a lightweight signature composed of id, quantity and price.
    const sig = (this.items || [])
      .map(
        (it) => `${it.product?.id || ""}:${it.quantity}:${it.product?.price}`
      )
      .join("|");
    if (this._lastItemsSig === sig) return;
    this._lastItemsSig = sig;
    this.total = this.items.reduce(
      (acc, it) => acc + (it.product?.price || 0) * it.quantity,
      0
    );
  }

  clearCart() {
    this.items = [];
    this.total = 0;
    this._persist();
    this._emit();
  }

  // persist the cart to localStorage
  _persist() {
    try {
      localStorage.setItem("cart", JSON.stringify(this.items));
    } catch (e) {
      // ignore storage errors (e.g., quota), but keep app working
      // in advanced setups we could fall back to server-side persistence
      // or surface an error to the user
      console.warn("Failed to persist cart", e);
    }
  }

  // replace the in-memory items (used when restoring from server)
  replaceItems(items) {
    this.items = Array.isArray(items) ? items : [];
    this.calculateTotal();
    this._persist();
    this._emit();
  }

  getItems() {
    return this.items;
  }

  // simple pub/sub so components can react to store updates
  subscribe(callback) {
    this._listeners = this._listeners || new Set();
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _emit() {
    if (!this._listeners) return;
    for (const cb of this._listeners) cb();
  }
}

const cartStore = new CartStore();
export default cartStore;
