import { useAuth } from "../store/authStore";

/**
 * usePermissions - Custom hook for Granular Permissions & Subscriptions checks.
 * Muxes the Vendor's base subscription plan limits with any vendor-specific overrides
 * provided in `vendor.capabilities`.
 */
export function usePermissions() {
  const { vendor, isVendor } = useAuth();

  // If not a vendor, they have no vendor permissions
  if (!isVendor || !vendor) {
    return {
      can: () => false,
      getLimit: () => 0,
    };
  }

  // Capabilities dict comes from backend Supplier.capabilities property
  const caps = vendor.capabilities || {};

  /**
   * Check if the vendor has a specific capability enabled.
   * e.g. can("customize_store") or can("access_advanced_analytics")
   */
  const can = (featureName) => {
    // If featureName exists in capabilities, return its truthy/falsy value
    if (caps[`can_${featureName}`] !== undefined) {
      return !!caps[`can_${featureName}`];
    }
    // E.g. allow_whatsapp_checkout without 'can_' prefix
    if (caps[featureName] !== undefined) {
      return !!caps[featureName];
    }
    return false;
  };

  /**
   * Get a numeric limit for a specific metric.
   * e.g. getLimit("max_products") -> 50
   */
  const getLimit = (metricName) => {
    if (caps[metricName] !== undefined) {
      return Number(caps[metricName]);
    }
    return 0; // Default fallback
  };

  return {
    can,
    getLimit,
    capabilities: caps,
  };
}
