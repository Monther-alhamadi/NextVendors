import api from "./api";

export async function getVendorPlans() {
  const resp = await api.get("/vendor-plans/");
  return resp.data;
}

export async function createVendorPlan(data) {
  const resp = await api.post("/vendor-plans/", data);
  return resp.data;
}

export async function updateVendorPlan(id, data) {
  const resp = await api.put(`/vendor-plans/${id}`, data);
  return resp.data;
}

export async function deleteVendorPlan(id) {
  const resp = await api.delete(`/vendor-plans/${id}`);
  return resp.data;
}

export async function subscribeToPlan(id) {
  const resp = await api.post(`/supplier/subscribe/${id}`);
  return resp.data;
}
