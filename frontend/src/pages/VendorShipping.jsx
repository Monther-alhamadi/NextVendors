import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "react-i18next";
import { getMySupplierInfo } from "../services/supplierService";
import { updateMyVendorProfile } from "../services/vendorService";
import { MapPin, Truck, RefreshCw, Save } from "lucide-react";
import s from "./VendorShipping.module.css";

export default function VendorShipping() {
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
      address: "",
      shipping_policy: "",
      return_policy: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
        const info = await getMySupplierInfo();
        if (info) {
            setFormData({
                address: info.address || "",
                shipping_policy: info.shipping_policy || "",
                return_policy: info.return_policy || ""
            });
        }
    } catch (e) {
        console.error(e);
        toast.push({ message: t("common.error_loading_data"), type: "error" });
    } finally {
        setLoading(false);
    }
  }

  async function handleSubmit(e) {
      e.preventDefault();
      setSaving(true);
      try {
          await updateMyVendorProfile(formData);
          toast.push({ message: t("common.save_success"), type: "success" });
      } catch (e) {
          toast.push({ message: e.response?.data?.detail || t("common.error"), type: "error" });
      } finally {
          setSaving(false);
      }
  }

  if (loading) {
    return (
      <div className={s.page} style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>{t("vendor.shipping_policies")}</h1>
        <p className={s.subtitle}>{t("vendor.shipping_policies_desc")}</p>
      </div>
      
      <div className={s.formWrap}>
        <form onSubmit={handleSubmit}>
            <div className={s.formContent}>
                <section className={s.formSection}>
                    <div className={s.sectionHeader}>
                        <div className={s.iconWrap}><MapPin size={24} /></div>
                        <div>
                            <h2 className={s.sectionTitle}>{t("vendor.pickup_address")}</h2>
                            <p className={s.sectionDesc}>{t("vendor.pickup_address_desc")}</p>
                        </div>
                    </div>
                    <textarea 
                        className={s.textarea}
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        placeholder={t("vendor.pickup_address_placeholder")}
                    />
                </section>

                <section className={s.formSection}>
                    <div className={s.sectionHeader}>
                        <div className={s.iconWrap}><Truck size={24} /></div>
                        <div>
                            <h2 className={s.sectionTitle}>{t("vendor.shipping_policy_label")}</h2>
                            <p className={s.sectionDesc}>{t("vendor.shipping_policy_desc")}</p>
                        </div>
                    </div>
                    <textarea 
                        className={`${s.textarea} ${s.textareaLarge}`}
                        value={formData.shipping_policy}
                        onChange={e => setFormData({...formData, shipping_policy: e.target.value})}
                        placeholder={t("vendor.shipping_policy_placeholder")}
                    />
                </section>

                <section className={s.formSection}>
                    <div className={s.sectionHeader}>
                        <div className={s.iconWrap}><RefreshCw size={24} /></div>
                        <div>
                            <h2 className={s.sectionTitle}>{t("vendor.return_policy_label")}</h2>
                            <p className={s.sectionDesc}>{t("vendor.return_policy_desc")}</p>
                        </div>
                    </div>
                    <textarea 
                        className={`${s.textarea} ${s.textareaLarge}`}
                        value={formData.return_policy}
                        onChange={e => setFormData({...formData, return_policy: e.target.value})}
                        placeholder={t("vendor.return_policy_placeholder")}
                    />
                </section>
            </div>

            <div className={s.formActions}>
                <button type="submit" disabled={saving} className={s.submitBtn}>
                    {saving ? (
                      <div className="spinner-small"></div>
                    ) : (
                      <>
                        <Save size={18} />
                        {t("common.save")}
                      </>
                    )}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
