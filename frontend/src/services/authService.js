import api from "./api";

function _getCookie(name) {
  if (typeof document === "undefined") return null;
  const v = document.cookie.match("(?:^|;)\\s*" + name + "=([^;]+)");
  return v ? decodeURIComponent(v[1]) : null;
}

// login returns access_token in body and sets refresh cookie; also returns csrf_token for dev
export async function login(username, password) {
  const resp = await api.post(
    "/auth/login",
    new URLSearchParams({ username, password }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );
  return resp.data;
}

export async function googleLogin(credential) {
  const resp = await api.post("/auth/google", { credential });
  return resp.data;
}

// refresh uses cookie + CSRF header
export async function refreshAccessToken(csrfToken) {
  const headers = {};
  const token = csrfToken || _getCookie("csrf_token");
  if (token) headers["X-CSRF-Token"] = token;
  const resp = await api.post("/auth/token", {}, { headers });
  return resp.data;
}

export async function logout(csrfToken) {
  const headers = {};
  const token = csrfToken || _getCookie("csrf_token");
  if (token) headers["X-CSRF-Token"] = token;
  return api.post("/auth/logout", {}, { headers });
}

// register expects JSON body with username, email, password
export async function register(username, email, password) {
  const resp = await api.post("/auth/register", {
     username,
     email,
     password
  });
  return resp.data;
}

export async function verifyEmail(email, code) {
  const resp = await api.post("/auth/verify-email", { email, code });
  return resp.data;
}

export async function resendOtp(email) {
  const resp = await api.post("/auth/resend-otp", { email });
  return resp.data;
}

export async function updateEmail(old_email, new_email) {
  const resp = await api.post("/auth/update-email", { old_email, new_email });
  return resp.data;
}

export async function forgotPassword(email) {
  const resp = await api.post("/auth/forgot", { email });
  return resp.data;
}

export async function verifyResetOtp(email, code) {
  const resp = await api.post("/auth/verify-reset-otp", { email, code });
  return resp.data;
}

export async function resetPassword(token, password) {
  const resp = await api.post("/auth/reset", { token, password });
  return resp.data;
}

export function isAuthenticated() {
  if (typeof document === "undefined") return false;
  // Simple check for access token cookie or local usage
  return !!_getCookie("access_token") || !!localStorage.getItem("auth_storage");
}
