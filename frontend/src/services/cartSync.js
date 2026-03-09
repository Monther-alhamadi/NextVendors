import cartStore from "../store/cartStore";
import api from "./api";
import { debounce } from "../utils/debounce";
// `cartService` is dynamically imported when needed to avoid bundling it
// into the main chunk (it can be relatively large). This keeps initial
// bundles smaller and prevents Vite dynamic/static import conflicts.

// Debounced push interval (ms)
const PUSH_DEBOUNCE_MS = 1000;

async function _maybePush(items) {
  try {
    // Only push when user appears authenticated (Authorization header set)
    const auth = api.defaults.headers.common["Authorization"];
    if (!auth) return; // not authenticated — skip

    // Convert items to server format: array of { product: { id, ... }, quantity }
    // Dynamically import cartService so the module is not forced into the main bundle.
    // backend expects the JSON body to be the array of items, not an object
    await api.put("/cart/", items);
    // The original `setServerCart` returned a boolean `ok`.
    // Assuming the `api.put` call succeeding implies `ok`, we can remove the `setServerCart` dependency.
    // The `return true;` in the instruction seems to be a remnant or a misunderstanding,
    // as _maybePush doesn't explicitly return a value.
    // The `ok = await setServerCart(items);` part after `return true;` was syntactically incorrect.
    // The `if (!ok)` block is also removed as `api.put` throws on error, which is caught by the outer try/catch.
  } catch (e) {
    console.warn("Cart sync error", e);
  }
}

const debouncedPush = debounce(_maybePush, PUSH_DEBOUNCE_MS);

export function startCartSync() {
  // Subscribe to cartStore changes and debounce pushes to server
  return cartStore.subscribe(() => {
    try {
      const items = cartStore.getItems();
      debouncedPush(items);
    } catch (e) {
      console.warn("cartSync subscription error", e);
    }
  });
}

export default { startCartSync };
