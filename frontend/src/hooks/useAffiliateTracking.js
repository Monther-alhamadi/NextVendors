import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import affiliateService from "../services/affiliateService";
import { useConfig } from "../context/ConfigContext";

/**
 * Hook to track affiliate referrals from URL parameters.
 * Stores the referral code and affiliate ID in a 24-hour Cookie.
 */
export function useAffiliateTracking() {
  const location = useLocation();
  const { setReferral } = useConfig();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get("ref");

    if (refCode) {
      handleTracking(refCode);
    }
  }, [location]);

  async function handleTracking(code) {
    try {
      console.log(`🎯 Affiliate Detected: ${code}`);
      
      const result = await affiliateService.trackVisit(code);
      
      if (result && result.affiliate_id) {
          // Store in cookie for 24 hours
          const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
          document.cookie = `affiliate_id=${result.affiliate_id}; expires=${expiry}; path=/; SameSite=Lax`;
          document.cookie = `affiliate_code=${code}; expires=${expiry}; path=/; SameSite=Lax`;
          
          // Backup in localStorage
          localStorage.setItem('affiliate_code', code);
          localStorage.setItem('affiliate_id', result.affiliate_id);
          localStorage.setItem('affiliate_expiry', expiry);
          
          // Update ConfigProvider state
          setReferral({
              code: code,
              affiliate_id: result.affiliate_id
          });
          
          console.log(`✅ Affiliate tracking active: ${code} (ID: ${result.affiliate_id})`);
          console.log(`📊 Visit tracked - Cookie expires: ${new Date(expiry).toLocaleString()}`);
      } else {
          console.warn(`⚠️ Affiliate code "${code}" not found or inactive`);
      }
    } catch (error) {
      console.error("❌ Affiliate tracking failed:", error);
      console.error("Error details:", error.response?.data || error.message);
    }
  }

  const getActiveAffiliate = () => {
      // Read from cookie
      const getCookie = (name) => {
          const v = document.cookie.match("(?:^|;)\\s*" + name + "=([^;]+)");
          return v ? v[1] : null;
      };
      
      const id = getCookie("affiliate_id");
      const code = getCookie("affiliate_code");
      
      if (!id) return null;
      return { affiliate_id: id, code: code };
  };

  return { getActiveAffiliate };
}
