import api from "./api";

export async function getVendorById(id) {
  const resp = await api.get(`/vendors/${id}`);
  return resp.data;
}

export async function listVendors(params = {}) {
  const resp = await api.get("/vendors/", { params });
  return resp.data;
}

// Module 1: Admin Power
export async function getVendorStats() {
    const resp = await api.get("/admin/vendors/stats");
    return resp.data;
}

export async function reviewKYC(vendorId, approved, rejectionReason = null) {
    const resp = await api.post("/admin/vendors/kyc/review", { 
        vendor_id: vendorId, 
        approved, 
        rejection_reason: rejectionReason 
    });
    return resp.data;
}

export async function banVendor(vendorId, ban) {
    const resp = await api.post(`/admin/vendors/${vendorId}/ban`, { ban });
    return resp.data;
}

export async function createVendor(data) {
  const r = await api.post("/vendors/", data);
  return r.data;
}

export async function getVendorProducts(vendorId) {
  const r = await api.get(`/vendors/${vendorId}/products`);
  return r.data;
}

export async function createProduct(data) {
  // Uses the supplier portal endpoint which supports multipart/form-data
  const r = await api.post("/supplier/products", data);
  return r.data;
}

export async function linkProductToVendor(vendorId, productId, data) {
  // data: { cost_price, inventory, sku_vendor, currency }
  const r = await api.post(`/vendors/${vendorId}/products/${productId}`, data);
  return r.data;
}

export async function updateVendorStatus(vendorId, status) {
  const r = await api.put(`/vendors/${vendorId}/status`, null, { params: { status } });
  return r.data;
}

export async function updateMyVendorProfile(data) {
  const r = await api.put("/vendors/me/", data);
  return r.data;
}
export async function updateVendor(vendorId, data) {
  const r = await api.put(`/vendors/${vendorId}`, data);
  return r.data;
}

export async function adminUpdateVendor(vendorId, data) {
  // Use a more permissive update for admin if needed, 
  // currently put /vendors/{id} doesn't exist but we'll add it or use status.
  // Actually let's use a generic update if we add it to backend.
  const r = await api.put(`/vendors/${vendorId}`, data);
  return r.data;
}

export async function listSubscriptionPlans() {
  const r = await api.get("/subscription-plans/");
  return r.data;
}

export async function createSubscriptionPlan(data) {
  const r = await api.post("/subscription-plans/", data);
  return r.data;
}

export async function updateSubscriptionPlan(id, data) {
  const r = await api.put(`/subscription-plans/${id}`, data);
  return r.data;
}

export async function getAdminAds() {
    const res = await api.get("/admin/vendors/ads");
    return res.data;
}

export async function updateAdStatus(adId, status, isPaid = null) {
    const res = await api.put(`/admin/vendors/ads/${adId}/status`, { status, is_paid: isPaid });
    return res.data;
}

export async function getMyCapabilities() {
    const res = await api.get("/supplier-portal/capabilities");
    return res.data;
}

export async function requestVendorAd(data) {
    const res = await api.post("/supplier-portal/ads/request", data);
    return res.data;
}
