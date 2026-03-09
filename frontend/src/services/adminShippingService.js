import api from "./api";

export async function getShippingProviders() {
  const resp = await api.get("/admin/shipping/providers");
  return resp.data;
}

export async function createShippingProvider(data) {
  const resp = await api.post("/admin/shipping/providers", data);
  return resp.data;
}

export async function getShippingZones() {
  const resp = await api.get("/admin/shipping/zones");
  return resp.data;
}

export async function createShippingZone(data) {
  const resp = await api.post("/admin/shipping/zones", data);
  return resp.data;
}

export async function updateShippingZone(id, data) {
  const resp = await api.put(`/admin/shipping/zones/${id}`, data);
  return resp.data;
}

export async function deleteShippingZone(id) {
  const resp = await api.delete(`/admin/shipping/zones/${id}`);
  return resp.data;
}
