import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import * as auth from "../services/authService";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(async (username, password) => {
    const data = await auth.login(username, password);
    setAccessToken(data.access_token);
    if (data.user) {
      setUser({ ...data.user, permissions: data.user.permissions || [] });
    }

    if (data.access_token) {
      setCsrfToken(data.csrf_token);
      if (data.csrf_token) {
        api.defaults.headers.common["X-CSRF-Token"] = data.csrf_token;
      }
    }
    if (data.access_token) {
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${data.access_token}`;
      // If server didn't include the `user` object in the login response,
      // attempt to fetch `/auth/me` immediately so the app has the user's
      // profile (role, id) available for ProtectedRoute/header rendering.
      if (!data.user) {
        try {
          const resp = await api.get("/auth/me");
          if (resp && resp.data) setUser({ ...resp.data, permissions: resp.data.permissions || [] });
        } catch (e) {
          // ignore -- user will remain null until a subsequent refresh/login
          console.warn("Failed to fetch /auth/me after login", e);
        }
      }
      try {
        // attempt to sync cart with server after successful login
        const cartService = await import("../services/cartService");
        cartService.syncOnLogin().catch((e) => {
          // ignore sync failures but log for debugging
          console.warn("Cart sync on login failed", e);
        });
      } catch (e) {
        console.warn("Cart sync module load failed", e);
      }
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    (async () => {
      try {
        // Tell server to revoke tokens / clear refresh cookie (best-effort)
        await auth.logout(csrfToken);
      } catch (e) {
        // ignore server-side logout failures
        console.warn("Logout request failed", e);
      }

      // Clear client state
      api.defaults.headers.common["Authorization"] = "";
      setAccessToken(null);
      setCsrfToken(null);
      setUser(null);

      // push local cart to server on logout (best-effort)
      try {
        const m = await import("../services/cartService");
        m.pushOnLogout().catch(() => {});
      } catch (e) {
        // ignore
      }
    })();
  }, [csrfToken]);

  useEffect(() => {
    // try an initial refresh using the refresh cookie (set by server) — this will
    // set access token and CSRF header if available
    (async () => {
      try {
        const r = await auth.refreshAccessToken();
        if (r && r.access_token) {
          setAccessToken(r.access_token);
          if (r.csrf_token) setCsrfToken(r.csrf_token);
          if (r.csrf_token) {
            api.defaults.headers.common["X-CSRF-Token"] = r.csrf_token;
          }
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${r.access_token}`;
          // If refresh returned user object include it; otherwise fetch /auth/me
          if (r.user) {
            setUser({ ...r.user, permissions: r.user.permissions || [] });
          } else {
            try {
              const me = await api.get("/auth/me");
              if (me && me.data) setUser({ ...me.data, permissions: me.data.permissions || [] });
            } catch (e) {
              // ignore; user will remain null until explicit login
            }
          }
        }
      } catch (e) {
        // ignore - user may be anonymous or token expired
        // This prevents "400: refresh_token required" from being a visible issue
        // during initial load for guests.
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const updateAuth = useCallback((data) => {
    if (data.access_token) {
      setAccessToken(data.access_token);
      setCsrfToken(data.csrf_token);
      if (data.csrf_token) {
        api.defaults.headers.common["X-CSRF-Token"] = data.csrf_token;
      }
      api.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
    }
    if (data.user) {
      setUser({ ...data.user, permissions: data.user.permissions || [] });
    }
  }, []);

  const isAuthenticated = useMemo(() => !!accessToken, [accessToken]);
  const isAdmin = useMemo(() => !!(user && user.role === "admin"), [user]);

  const hasPermission = useCallback((perm) => {
    if (user?.role === "admin") return true; // Admin has all permissions
    return (user?.permissions || []).includes(perm);
  }, [user]);

  const value = useMemo(
    () => ({
      accessToken,
      csrfToken,
      user,
      login,
      logout,
      updateAuth,
      isAuthenticated,
      isAdmin,
      hasPermission,
      isLoading
    }),
    [accessToken, csrfToken, user, login, logout, updateAuth, isAuthenticated, isAdmin, hasPermission, isLoading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
