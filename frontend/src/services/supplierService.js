import api from "./api";

const BASE = "/supplier";

export async function getMySupplierInfo() {
  const r = await api.get(`${BASE}/me`);
  return r.data;
}

export async function getSupplierStats() {
  const r = await api.get(`${BASE}/stats`);
  return r.data;
}

export async function getMyProducts() {
  const r = await api.get(`${BASE}/products`);
  return r.data;
}

export async function updateMyProductStock(productId, data) {
  // data: { inventory, cost_price }
  const r = await api.put(`${BASE}/products/${productId}`, data);
  return r.data;
}

export async function getMyWallet() {
  const r = await api.get(`${BASE}/wallet`);
  return r.data;
}

export async function getMyOrders() {
  const r = await api.get(`${BASE}/orders`);
  return r.data;
}

export async function updateOrderFulfillment(orderId, data) {
  // data: { status, tracking_number }
  const r = await api.put(`${BASE}/orders/${orderId}`, data);
  return r.data;
}

export async function getVendorReviews() {
  const r = await api.get(`/reviews/vendor`);
  return r.data;
}

export async function replyToReview(reviewId, text) {
  const r = await api.patch(`/reviews/${reviewId}/reply`, { vendor_reply: text });
  return r.data;
}
