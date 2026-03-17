import axios from "axios";

function _getCookie(name) {
  if (typeof document === "undefined") return null;
  const v = document.cookie.match("(?:^|;)\\s*" + name + "=([^;]+)");
  return v ? decodeURIComponent(v[1]) : null;
}

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || "") + "/api/v1",
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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for automatic silent token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's a 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't intercept refresh token failures themselves to avoid infinite loops
      if (originalRequest.url === '/auth/token') {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const csrfToken = _getCookie("csrf_token");
        const headers = csrfToken ? { "X-CSRF-Token": csrfToken } : {};
        
        // Call the refresh endpoint
        const res = await axios.post(`${api.defaults.baseURL}/auth/token`, {}, { 
          withCredentials: true,
          headers 
        });

        const newToken = res.data.access_token;
        
        // Update local storage with the new token
        const authData = JSON.parse(localStorage.getItem("auth_storage") || "{}");
        authData.state = { ...authData.state, token: newToken };
        localStorage.setItem("auth_storage", JSON.stringify(authData));

        // Let queued requests run
        processQueue(null, newToken);

        // Update the original request's header and execute again
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        return api(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        // If refresh fails, log the user out by clearing storage
        localStorage.removeItem("auth_storage");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
