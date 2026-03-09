import api from "./api";

/**
 * Track a visit from a referral link.
 * @param {string} code - The referral/coupon code.
 */
export const trackVisit = async (code) => {
  try {
    // New endpoint: GET /api/v1/track/ref/{code}
    const response = await api.get(`/track/ref/${code}`);
    return response.data;
  } catch (error) {
    console.error("Failed to track affiliate visit:", error);
    return null;
  }
};

/**
 * Get comprehensive dashboard stats for an affiliate.
 */
export const getAffiliateDashboard = async () => {
  // New endpoint: GET /api/v1/affiliate/dashboard
  const response = await api.get(`/affiliate/dashboard`);
  return response.data;
};

/**
 * Get stats for the current logged-in user as an affiliate.
 */
export const getMeStats = async () => {
    const response = await api.get(`/affiliate/me/stats`);
    return response.data;
};

/**
 * Create an affiliate account for the current user.
 */
export const registerAsAffiliate = async () => {
    const response = await api.post(`/affiliate/register`);
    return response.data;
};

/**
 * Create a new affiliate coupon (Vendor only).
 */
export const createCoupon = async (data) => {
    const response = await api.post(`/vendor/affiliate-coupons`, data);
    return response.data;
};

export default {
    trackVisit,
    getAffiliateDashboard,
    registerAsAffiliate,
    createCoupon,
    getMeStats
};
