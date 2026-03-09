import api from "./api";

export async function listOrders(limit = 20, offset = 0) {
  const resp = await api.get("/orders/", { params: { limit, offset } });
  return resp.data;
}

export async function getOrder(id) {
  const resp = await api.get(`/orders/${id}`);
  return resp.data;
}

export async function createOrder(order) {
  // Check for affiliate attribution in local storage
  const affiliateId = localStorage.getItem("affiliate_id");
  const payload = { ...order };
  if (affiliateId) {
      payload.affiliate_id = parseInt(affiliateId);
  }
  
  const resp = await api.post("/orders/", payload);
  
  // Clear affiliate tracking after successful order
  if (affiliateId) {
      localStorage.removeItem("affiliate_id");
  }
  return resp.data;
}

export async function createHybridOrder(payload) {
  const resp = await api.post("/orders/hybrid", payload);
  return resp.data;
}

export default { listOrders, getOrder, createOrder, createHybridOrder };
