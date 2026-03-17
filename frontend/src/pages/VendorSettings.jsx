import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "react-i18next";
import { getMySupplierInfo } from "../services/supplierService";
import { updateMyVendorProfile, getMyCapabilities } from "../services/vendorService";
import { Store, Save, Lock } from "lucide-react";
import s from "./VendorSettings.module.css";

export default function VendorSettings() {
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [capabilities, setCapabilities] = useState(null);
  const [formData, setFormData] = useState({
      name: "",
      description: "",
      logo_url: "",
      contact_email: "",
      phone: "",
      whatsapp_number: "",
      allow_direct_orders: false,
      preferred_settlement_method: "platform",
      theme_color: "",
      background_image_url: "",
      announcement_text: "",
      store_ads: "",
      currency_display: "SAR"
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
        const [info, caps] = await Promise.all([
          getMySupplierInfo(),
          getMyCapabilities().catch(() => null)
        ]);
        
        if (caps) setCapabilities(caps);

        if (info) {
            setFormData({
                name: info.name || "",
                description: info.description || "",
                logo_url: info.logo_url || "",
                contact_email: info.contact_email || "",
                phone: info.phone || "",
                whatsapp_number: info.whatsapp_number || "",
                allow_direct_orders: info.allow_direct_orders || false,
                preferred_settlement_method: info.preferred_settlement_method || "platform",
                theme_color: info.theme_color || "",
                background_image_url: info.background_image_url || "",
                announcement_text: info.announcement_text || "",
                store_ads: info.store_ads || "",
                currency_display: info.currency_display || "SAR"
            });
        }
    } catch (e) {
        console.error(e);
        toast.push({ message: t("common.error"), type: "error" });
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
        <h1 className={s.title}>{t("vendor.store_settings")}</h1>
        <p className={s.subtitle}>{t("vendor.appearance_desc")}</p>
      </div>
      
      <div className={s.formWrap}>
        <form onSubmit={handleSubmit}>
            <div className={s.formSection}>
                <div className={s.inputGroup}>
                    <label>{t("vendor.store_name")} <span style={{color:'red'}}>*</span></label>
                    <input 
                        required
                        className={s.input}
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>

                <div className={s.inputGroup}>
                    <label>{t("vendor.description_label")}</label>
                    <textarea 
                        className={s.textarea}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder={t("vendor.description_placeholder")}
                    />
                </div>

                <div className={s.inputGroup}>
                    <label>{t("vendor.logo_url_label")}</label>
                    <input 
                        className={s.input}
                        value={formData.logo_url}
                        onChange={e => setFormData({...formData, logo_url: e.target.value})}
                        placeholder="https://example.com/logo.png"
                    />
                    {formData.logo_url && (
                        <div className={s.logoPreview}>
                            <img src={formData.logo_url} alt="Logo Preview" onError={(e) => { e.target.style.display='none'; }} />
                        </div>
                    )}
                </div>

                <div className={s.dualInputs}>
                    <div className={s.inputGroup}>
                        <label>{t("common.email")}</label>
                        <input 
                            type="email"
                            className={s.input}
                            value={formData.contact_email}
                            onChange={e => setFormData({...formData, contact_email: e.target.value})}
                            placeholder="store@example.com"
                        />
                    </div>
                    <div className={s.inputGroup}>
                        <label>{t("common.phone")}</label>
                        <input 
                            type="tel"
                            className={s.input}
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            placeholder="+966xxxxxxxxx"
                        />
                    </div>
                </div>
            </div>

            <div className={s.formSection} style={{ position: 'relative', minHeight: '300px' }}>
                <h3 className={s.sectionTitle}>{t("vendor.hybrid_commerce")}</h3>
                <p className={s.sectionDesc}>{t("vendor.hybrid_desc")}</p>
                
                {capabilities && capabilities.allow_whatsapp_checkout === false && (
                    <div style={{ position: 'absolute', top: '70px', left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.85)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', backdropFilter: 'blur(2px)' }}>
                        <Lock size={40} color="var(--primary-color)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                        <h4 style={{ margin: 0, color: 'var(--text-color)', fontSize: '1.2rem' }}>{t("vendor.elite_feature")}</h4>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{t("vendor.elite_desc")}</p>
                        <Link to="/vendor/plans" style={{ background: 'var(--primary-color)', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>{t("vendor.upgrade_now")}</Link>
                    </div>
                )}
                
                <div className={s.inputGroup}>
                    <label>{t("vendor.whatsapp")}</label>
                    <input 
                        type="tel"
                        className={s.input}
                        value={formData.whatsapp_number}
                        onChange={e => setFormData({...formData, whatsapp_number: e.target.value})}
                        placeholder="+966xxxxxxxxx"
                    />
                </div>

                <div className={s.toggleGroup}>
                    <label className={s.toggleLabel}>
                        <div className={s.toggleSwitch}>
                            <input 
                                type="checkbox"
                                checked={formData.allow_direct_orders}
                                onChange={e => setFormData({...formData, allow_direct_orders: e.target.checked})}
                            />
                            <span className={s.slider}></span>
                        </div>
                        <div>
                            <strong>{t("vendor.allow_direct")}</strong>
                            <p className={s.toggleHint}>{t("vendor.allow_direct_hint")}</p>
                        </div>
                    </label>
                </div>

                <div className={s.inputGroup}>
                    <label>{t("vendor.settlement_method")}</label>
                    <select 
                        className={s.input}
                        value={formData.preferred_settlement_method}
                        onChange={e => setFormData({...formData, preferred_settlement_method: e.target.value})}
                    >
                        <option value="platform">{t("vendor.settle_platform")}</option>
                        <option value="post_billing">{t("vendor.settle_invoice")}</option>
                        <option value="subscription">{t("vendor.settle_sub")}</option>
                    </select>
                </div>
            </div>

            <div className={s.formSection} style={{ position: 'relative', minHeight: '350px' }}>
                <h3 className={s.sectionTitle}>{t("vendor.store_appearance")}</h3>
                <p className={s.sectionDesc}>{t("vendor.appearance_desc")}</p>
                
                {capabilities && capabilities.can_customize_store === false && (
                    <div style={{ position: 'absolute', top: '70px', left: 0, right: 0, bottom: 0, background: 'rgba(255, 255, 255, 0.85)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', backdropFilter: 'blur(2px)' }}>
                        <Lock size={40} color="var(--primary-color)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                        <h4 style={{ margin: 0, color: 'var(--text-color)', fontSize: '1.2rem' }}>{t("vendor.elite_appearance_title")}</h4>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{t("vendor.elite_appearance_desc")}</p>
                        <Link to="/vendor/plans" style={{ background: 'var(--primary-color)', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>{t("vendor.upgrade_now")}</Link>
                    </div>
                )}
                
                <div className={s.inputGroup}>
                    <label>{t("vendor.theme_color")}</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input 
                            type="color"
                            style={{ height: '40px', width: '60px', padding: '0', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}
                            value={formData.theme_color || "#2563eb"}
                            onChange={e => setFormData({...formData, theme_color: e.target.value})}
                        />
                        <span style={{ fontFamily: 'monospace', color: '#666' }}>{formData.theme_color || "#2563eb"}</span>
                    </div>
                </div>

                <div className={s.inputGroup}>
                    <label>{t("vendor.background_url")}</label>
                    <input 
                        className={s.input}
                        value={formData.background_image_url || ""}
                        onChange={e => setFormData({...formData, background_image_url: e.target.value})}
                        placeholder="https://example.com/bg.jpg"
                    />
                </div>

                <div className={s.inputGroup}>
                    <label>{t("vendor.announcement_text")}</label>
                    <input 
                        className={s.input}
                        value={formData.announcement_text || ""}
                        onChange={e => setFormData({...formData, announcement_text: e.target.value})}
                        placeholder={t("vendor.announcement_placeholder")}
                    />
                </div>

                <div className={s.dualInputs}>
                    <div className={s.inputGroup}>
                        <label>{t("vendor.currency_display")}</label>
                        <select 
                            className={s.input}
                            value={formData.currency_display || "SAR"}
                            onChange={e => setFormData({...formData, currency_display: e.target.value})}
                        >
                            <option value="SAR">SAR - {t("currency.sar")}</option>
                            <option value="USD">USD - {t("currency.usd")}</option>
                            <option value="AED">AED - {t("currency.aed")}</option>
                            <option value="KWD">KWD - {t("currency.kwd")}</option>
                            <option value="EGP">EGP - {t("currency.egp")}</option>
                        </select>
                    </div>
                </div>
                
                <div className={s.inputGroup}>
                    <label>{t("vendor.store_ads")}</label>
                    <textarea 
                        className={s.textarea}
                        value={formData.store_ads || ""}
                        onChange={e => setFormData({...formData, store_ads: e.target.value})}
                        placeholder='["https://example.com/ad1.jpg", "https://example.com/ad2.jpg"]'
                        style={{direction: 'ltr', textAlign: 'left'}}
                    />
                    <small style={{color: '#666', marginTop: '4px', display: 'block'}}>{t("vendor.store_ads_hint")}</small>
                </div>
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
