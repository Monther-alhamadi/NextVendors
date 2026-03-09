import api from "./api";

export async function listVendorCoupons() {
  const resp = await api.get("/vendor/affiliate-coupons");
  return resp.data;
}

export async function createVendorCoupon(data) {
  const resp = await api.post("/vendor/affiliate-coupons", data);
  return resp.data;
}

export async function deleteVendorCoupon(id) {
  const resp = await api.delete(`/vendor/affiliate-coupons/${id}`);
  return resp.data;
}
