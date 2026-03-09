import axios from "axios";

function _getCookie(name) {
  if (typeof document === "undefined") return null;
  const v = document.cookie.match("(?:^|;)\\s*" + name + "=([^;]+)");
  return v ? decodeURIComponent(v[1]) : null;
}

const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true, // include cookies (refresh_token)
});

// Automatically attach `X-CSRF-Token` header from cookie for requests that
// include credentials. This centralizes the double-submit CSRF logic so
// individual services don't need to remember to add the header.
api.interceptors.request.use((config) => {
  try {
    const token = _getCookie("csrf_token");
    if (token && !(config.headers && config.headers["X-CSRF-Token"])) {
      if (!config.headers) config.headers = {};
      config.headers["X-CSRF-Token"] = token;
    }
  } catch (e) {
    // ignore failures - fall back to not sending the header
  }
  return config;
});

export default api;
