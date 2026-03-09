import api from "./api";

export async function getCacheConfig() {
  const resp = await api.get("/admin/cache/config");
  return resp.data;
}

export async function setCacheConfig(cfg = {}) {
  const resp = await api.post("/admin/cache/config", cfg);
  return resp.data;
}

export default { getCacheConfig, setCacheConfig };
