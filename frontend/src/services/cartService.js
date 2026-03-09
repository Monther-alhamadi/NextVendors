import api from "./api";
import cartStore from "../store/cartStore";

// Client-side cart sync helpers.
// The backend may not implement cart endpoints; these functions
// will attempt to call them and gracefully handle failures.

async function getServerCart() {
  try {
    const resp = await api.get("/cart/");
    return resp.data; // expected: array of { product: {...}, quantity }
  } catch (err) {
    // 404 or network => no server cart available
    return null;
  }
}

async function setServerCart(items) {
  try {
    // Replace server cart with provided items. Expect server to accept
    // an array of items at POST /cart or PUT /cart.
    // backend expects the JSON body to be the array of items, not an object
    // backend expects the JSON body to be the array of items, not an object
    await api.put("/cart/", items);
    return true;
  } catch (err) {
    // failure to persist remotely
    return false;
  }
}

// Merge local (client) cart with server cart. Strategy:
// - if server cart exists, merge quantities by product id (server wins for new items?)
// - if no server cart (null), try to push local cart to server
// Returns: { merged: boolean, serverAvailable: boolean }
export async function syncOnLogin() {
  const localItems = cartStore.getItems();
  const server = await getServerCart();
  if (server === null) {
    // No server cart; try to push local cart so future sessions see it
    const pushed = await setServerCart(localItems);
    return { merged: false, serverAvailable: pushed };
  }

  // Merge logic: combine quantities by product.id
  const map = new Map();
  for (const it of server) {
    map.set(it.product.id, { ...it });
  }
  for (const it of localItems) {
    const existing = map.get(it.product.id);
    if (existing) {
      existing.quantity = (existing.quantity || 0) + (it.quantity || 0);
      map.set(it.product.id, existing);
    } else {
      map.set(it.product.id, { ...it });
    }
  }
  const merged = Array.from(map.values());

  // push merged back to server
  const ok = await setServerCart(merged);
  if (ok) {
    // update local store to merged result
    cartStore.replaceItems(merged);
    return { merged: true, serverAvailable: true };
  } else {
    // couldn't persist to server — keep local cart
    return { merged: false, serverAvailable: false };
  }
}

// Optionally push local cart to server on logout
export async function pushOnLogout() {
  const localItems = cartStore.getItems();
  const ok = await setServerCart(localItems);
  return ok;
}

export { getServerCart, setServerCart };

export default {
  getServerCart,
  setServerCart,
  syncOnLogin,
  pushOnLogout,
};
