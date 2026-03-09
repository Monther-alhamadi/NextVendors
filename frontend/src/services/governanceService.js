import api from "./api";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC endpoints — no authentication required
// These use /public/* paths added in admin_content.py
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch page layout widgets for any page (no auth needed).
 * Returns an ordered array of active sections that the frontend should render.
 * @param {string} page - "home" | "products" | "all"
 */
export async function getPageLayout(page = "home") {
    try {
        const response = await api.get(`/public/page-layout/${page}`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (e) {
        console.warn("Failed to fetch page layout", e?.response?.status);
        return [];
    }
}

/**
 * Fetch active widgets for the homepage (backwards-compatible).
 * Alias for getPageLayout("home").
 */
export async function getActiveWidgets() {
    return getPageLayout("home");
}

/**
 * Fetch active ads for a specific placement zone (no auth needed).
 * @param {string} zone - "homepage_top" | "sidebar" | "product_list" | "checkout_bottom"
 */
export async function getAdsForZone(zone) {
    try {
        const response = await api.get(`/public/ads/${zone}`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (e) {
        return [];
    }
}

/**
 * Fetch active vendor ads from the new global advertising system.
 */
export async function getPublicVendorAds() {
    try {
        const response = await api.get(`/public/vendor-ads`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (e) {
        return [];
    }
}

/**
 * Fetch theme/branding settings (no auth needed).
 * Returns flat key-value: { primary_color, store_name, store_logo, ... }
 */
export async function getTheme() {
    try {
        const response = await api.get("/public/theme");
        return response.data || {};
    } catch (e) {
        return {};
    }
}

/**
 * Fetch global system settings (currency, contact info, etc.).
 */
export async function getSystemSettings() {
    try {
        const response = await api.get("/admin/settings");
        return response.data;
    } catch (e) {
        console.warn("Failed to fetch settings", e?.response?.status);
        return {};
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN endpoints — require admin authentication
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all widgets for admin management.
 * @param {string|null} page - filter by page (optional)
 */
export async function adminGetWidgets(page = null) {
    const url = page ? `/admin/widgets?page=${page}` : "/admin/widgets";
    const response = await api.get(url);
    return Array.isArray(response.data) ? response.data : [];
}

/**
 * Create a new widget.
 */
export async function adminCreateWidget(data) {
    const response = await api.post("/admin/widgets", data);
    return response.data;
}

/**
 * Update a widget by ID.
 */
export async function updateWidget(id, data) {
    const response = await api.put(`/admin/widgets/${id}`, data);
    return response.data;
}

/**
 * Reorder widgets via drag-and-drop.
 * @param {Array<{id: number, position: number}>} order
 */
export async function reorderWidgets(order) {
    const response = await api.put("/admin/widgets/reorder", order);
    return response.data;
}

/**
 * Delete a widget.
 */
export async function adminDeleteWidget(id) {
    const response = await api.delete(`/admin/widgets/${id}`);
    return response.data;
}

/**
 * Fetch all ad placements for admin management.
 */
export async function adminGetAds() {
    const response = await api.get("/admin/ads");
    return Array.isArray(response.data) ? response.data : [];
}

/**
 * Create a new ad placement.
 */
export async function adminCreateAd(data) {
    const response = await api.post("/admin/ads", data);
    return response.data;
}

/**
 * Update an ad placement.
 */
export async function adminUpdateAd(id, data) {
    const response = await api.put(`/admin/ads/${id}`, data);
    return response.data;
}

/**
 * Delete an ad placement.
 */
export async function adminDeleteAd(id) {
    const response = await api.delete(`/admin/ads/${id}`);
    return response.data;
}

/**
 * Fetch current theme settings (admin view).
 */
export async function adminGetTheme() {
    const response = await api.get("/admin/theme");
    return response.data || {};
}

/**
 * Update theme settings.
 * @param {Object} settings - flat key-value dict
 */
export async function adminUpdateTheme(settings) {
    const response = await api.put("/admin/theme", settings);
    return response.data;
}

/**
 * Check if a vendor has access to a specific feature based on their plan.
 */
export async function checkFeatureAccess(feature, vendorId = null) {
    const url = vendorId
        ? `/vendor/features/${feature}?vendor_id=${vendorId}`
        : `/vendor/features/${feature}`;
    try {
        const response = await api.get(url);
        return response.data;
    } catch (e) {
        return { access: false, message: "Error checking access" };
    }
}

export default {
    // Public
    getPageLayout,
    getActiveWidgets,
    getAdsForZone,
    getPublicVendorAds,
    getTheme,
    getSystemSettings,
    // Admin — Widgets
    adminGetWidgets,
    adminCreateWidget,
    updateWidget,
    reorderWidgets,
    adminDeleteWidget,
    // Admin — Ads
    adminGetAds,
    adminCreateAd,
    adminUpdateAd,
    adminDeleteAd,
    // Admin — Theme
    adminGetTheme,
    adminUpdateTheme,
    // Misc
    checkFeatureAccess,
};
