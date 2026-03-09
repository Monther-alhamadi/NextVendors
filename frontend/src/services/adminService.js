import api from "./api";

export async function listAudit({
  limit = 25,
  offset = 0,
  user_id = null,
} = {}) {
  const params = { limit, offset };
  if (user_id) params.user_id = user_id;
  const resp = await api.get("/audit/", { params });
  return resp.data;
}

export async function getEcosystemHealth() {
  const resp = await api.get("/analytics/ecosystem");
  return resp.data;
}

export async function getLogs({ limit = 100, level, q } = {}) {
  const params = {};
  if (limit != null) params.limit = limit;
  if (level) params.level = level;
  if (q) params.q = q;
  const resp = await api.get(`/admin/logs/recent`, { params });
  return resp.data;
}

export async function listUsers(params = {}) {
  const resp = await api.get(`/admin/users/`, { params });
  return resp.data;
}

export async function deleteUser(id) {
  const resp = await api.delete(`/admin/users/${id}`);
  return resp.data;
}

export async function activateUser(id) {
  const resp = await api.put(`/admin/users/${id}/activate`);
  return resp.data;
}

export async function deactivateUser(id) {
  const resp = await api.put(`/admin/users/${id}/deactivate`);
  return resp.data;
}
export async function suspendUser(id) {
  const resp = await api.put(`/admin/users/${id}/suspend`);
  return resp.data;
}

// === GOVERNANCE & UI ENGINE ===

export async function listWidgets(activeOnly = false) {
  const resp = await api.get("/admin/widgets", { params: { active_only: activeOnly }});
  return resp.data.widgets || resp.data; // Flexible fallback for flat arrays vs objects
}

export async function createWidget(payload) {
  const resp = await api.post("/admin/widgets", payload);
  return resp.data;
}

export async function updateWidget(id, payload) {
  const resp = await api.put(`/admin/widgets/${id}`, payload);
  return resp.data;
}

export async function deleteWidget(id) {
  const resp = await api.delete(`/admin/widgets/${id}`);
  return resp.data;
}

export async function toggleWidget(widgetId, isActive) {
  const resp = await api.patch(`/admin/widgets/${widgetId}/toggle`, null, { 
      params: { is_active: isActive }
  });
  return resp.data;
}

export async function listAds() {
  const resp = await api.get("/admin/ads");
  return resp.data;
}

export async function createAd(payload) {
  const resp = await api.post("/admin/ads", payload);
  return resp.data;
}

export async function updateAd(id, payload) {
  const resp = await api.put(`/admin/ads/${id}`, payload);
  return resp.data;
}

export async function deleteAd(id) {
  const resp = await api.delete(`/admin/ads/${id}`);
  return resp.data;
}

export async function listSystemSettings() {
  const resp = await api.get("/admin/system-settings");
  return resp.data.settings;
}

export async function updateSystemSetting(key, value, dataType = "string") {
  const resp = await api.patch(`/admin/system-settings/${key}`, value, {
      params: { data_type: dataType },
      headers: { "Content-Type": "application/json" }
  });
  return resp.data;
}

export async function unsuspendUser(id) {
  const resp = await api.put(`/admin/users/${id}/unsuspend`);
  return resp.data;
}
