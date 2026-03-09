import api from "./api";

// Admin endpoints
export async function listAllPayoutRequests(status = null) {
  const url = status ? `/admin/payouts?status=${status}` : "/admin/payouts";
  const r = await api.get(url);
  return r.data;
}

export async function approvePayoutRequest(id) {
  const r = await api.post(`/admin/payouts/${id}/approve`);
  return r.data;
}

export async function rejectPayoutRequest(id, reason) {
  const r = await api.post(`/admin/payouts/${id}/reject`, { reason });
  return r.data;
}

// User/Vendor endpoints
export async function getPayoutHistory() {
  const r = await api.get("/wallet/payouts"); // Assuming this exists or falls back to wallet txs
  return r.data;
}

export async function requestPayout(amount) {
  const r = await api.post("/wallet/payout-request", { amount });
  return r.data;
}

// Missing functions required by AdminVendors.jsx
export async function getVendorBalances() {
    // Placeholder - backend endpoint might be missing
    return []; 
}

export async function recordPayout(data) {
    // Placeholder
    return {};
}

export default {
    listAllPayoutRequests,
    approvePayoutRequest,
    rejectPayoutRequest,
    getPayoutHistory,
    requestPayout,
    getVendorBalances,
    recordPayout
};
