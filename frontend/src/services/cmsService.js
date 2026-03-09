import api from "./api";

// --- Public Endpoints ---
export async function getPage(slug) {
  const result = await api.get(`/cms/pages/${slug}`);
  return result.data;
}

// --- Admin Endpoints ---
export async function listAdminPages() {
  const result = await api.get("/admin/cms/pages");
  return result.data;
}

export async function getAdminPage(slug) {
  const result = await api.get(`/admin/cms/pages/${slug}`);
  return result.data;
}

export async function createPage(data) {
  const result = await api.post("/admin/cms/pages", data);
  return result.data;
}

export async function addWidget(pageId, widgetData) {
  const result = await api.post(`/admin/cms/pages/${pageId}/widgets`, widgetData);
  return result.data;
}

export async function updateWidget(widgetId, widgetData) {
  const result = await api.put(`/admin/cms/widgets/${widgetId}`, widgetData);
  return result.data;
}

export async function deleteWidget(widgetId) {
  const result = await api.delete(`/admin/cms/widgets/${widgetId}`);
  return result.data;
}

export async function reorderWidgets(pageId, orderedWidgetsArray) {
  const result = await api.put(`/admin/cms/pages/${pageId}/widgets/reorder`, {
    widgets: orderedWidgetsArray
  });
  return result.data;
}
