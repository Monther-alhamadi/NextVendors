import api from "./api";

export async function getTaxRates() {
  const resp = await api.get("/admin/tax-rates");
  return resp.data;
}

export async function createTaxRate(data) {
  const resp = await api.post("/admin/tax-rates", data);
  return resp.data;
}

export async function updateTaxRate(id, data) {
  const resp = await api.patch(`/admin/tax-rates/${id}`, data);
  return resp.data;
}

export async function deleteTaxRate(id) {
  const resp = await api.delete(`/admin/tax-rates/${id}`);
  return resp.data;
}
