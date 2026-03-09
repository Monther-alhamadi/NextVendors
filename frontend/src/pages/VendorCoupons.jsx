import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "react-i18next";
import { listVendorCoupons, createVendorCoupon, deleteVendorCoupon } from "../services/couponService";
import { getMySupplierInfo } from "../services/supplierService";
import api from "../services/api";
import { Copy, PlusCircle, Trash2, Lock, Share2, Tag, Percent } from "lucide-react";
import s from "./VendorCoupons.module.css";

export default function VendorCoupons() {
  const { t } = useTranslation();
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState(null);
  const [creating, setCreating] = useState(false);
  
  const [formData, setFormData] = useState({
      code: "",
      amount: "",
      amount_type: "percentage", 
      affiliate_email: ""      
  });

  useEffect(() => {
      loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const info = await getMySupplierInfo().catch(() => null);
      setSupplier(info);

      if (info) {
          const [cData, fData] = await Promise.all([
             listVendorCoupons(),
             api.get(`/vendor/features?vendor_id=${info.id}`).then(r => r.data)
          ]);
          setCoupons(cData || []);
          setFeatures(fData || {});
      }
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error', 'حدث خطأ'), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!supplier || !supplier.code) return;
    const url = `${window.location.origin}/?ref=${supplier.code}`;
    navigator.clipboard.writeText(url);
    toast.push({ message: t('vendor.affiliate_link_copied', 'تم نسخ رابط التسويق'), type: "success" });
  };

  async function handleCreate(e) {
      e.preventDefault();
      setCreating(true);
      try {
          await createVendorCoupon({
              ...formData,
              amount: parseFloat(formData.amount)
          });
          toast.push({ message: t('common.save_success', 'تم الحفظ بنجاح'), duration: 3000 });
          setFormData({ code: "", amount: "", amount_type: "percentage", affiliate_email: "" });
          loadData();
      } catch (e) {
          toast.push({ message: e.response?.data?.detail || t('common.error', 'حدث خطأ'), type: "error" });
      } finally {
          setCreating(false);
      }
  }

  async function handleDelete(id) {
      if(!window.confirm(t('common.confirm_action', 'هل أنت متأكد؟'))) return;
      try {
          await deleteVendorCoupon(id);
          setCoupons(coupons.filter(c => c.id !== id));
          toast.push({ message: t('common.delete_success', 'تم الحذف بنجاح'), duration: 2000 });
      } catch (e) {
          toast.push({ message: t('common.error', 'حدث خطأ'), type: "error" });
      }
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
         <h1 className={s.title}>{t('vendor.marketing_tools', 'أدوات التسويق')}</h1>
         <p className={s.subtitle}>إدارة أكواد الخصم ونظام التسويق بالعمولة لمتجرك.</p>
      </div>

      {/* Affiliate Link Section */}
      <div className={s.affiliateHero}>
          <div>
            <h2 className={s.heroTitle}><Share2 size={24} /> {t('vendor.affiliate_link', 'رابط التسويق الخاص بك')}</h2>
            <p className={s.heroDesc}>
              شارك هذا الرابط مع عملائك أو مسوقيك. الزوار القادمون عبر هذا الرابط سيتم ربطهم بمتجرك مباشرة للحصول على عمولات إضافية.
            </p>
          </div>
          <div className={s.linkBox}>
                <span className={s.linkCode}>
                    {supplier && supplier.code 
                        ? `${window.location.origin}/?ref=${supplier.code}` 
                        : "جاري التحميل..."}
                </span>
                <button onClick={copyLink} className={s.copyBtn}>
                    <Copy size={16} />
                    {t('common.copy', 'نسخ')}
                </button>
          </div>
      </div>

      <div className={s.mainGrid}>
          {/* Create Form */}
          <div className={s.card}>
              <h2 className={s.cardTitle}><PlusCircle size={20} /> {t('vendor.create_coupon', 'إنشاء كوبون جديد')}</h2>
              
              {!features.can_create_affiliate_coupons && (
                  <div className={s.lockedOverlay}>
                      <div className={s.lockIconWrap}><Lock size={32} /></div>
                      <h3 className={s.lockedTitle}>{t('vendor.upgrade_required', 'ميزة احترافية')}</h3>
                      <p className={s.lockedDesc}>احصل على نظام مسوقين متكامل عبر الترقية للباقة الاحترافية.</p>
                      <Link to="/vendor/plans" className={s.upgradeBtn}>
                          {t('vendor.upgrade_now', 'ترقية الآن')}
                      </Link>
                  </div>
              )}

              <form onSubmit={handleCreate}>
                  <div className={s.inputGroup}>
                      <label>{t('vendor.coupon_code', 'كود الخصم')} <span style={{color:'red'}}>*</span></label>
                      <input 
                          required
                          className={`${s.input} ${s.uppercase}`}
                          value={formData.code}
                          onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                          placeholder="e.g. VIP2024"
                      />
                  </div>
                  
                  <div className={s.inputGroup}>
                      <label>{t('vendor.affiliate_commission', 'قيمة الخصم/العمولة')} <span style={{color:'red'}}>*</span></label>
                      <div className={s.dualField}>
                          <input 
                              required
                              type="number"
                              className={s.input}
                              value={formData.amount}
                              onChange={e => setFormData({...formData, amount: e.target.value})}
                              placeholder="10"
                          />
                          <select 
                            className={`${s.input} ${s.select}`}
                            value={formData.amount_type}
                            onChange={e => setFormData({...formData, amount_type: e.target.value})}
                          >
                              <option value="percentage">%</option>
                              <option value="fixed">{t('common.currency', 'ر.س')}</option>
                          </select>
                      </div>
                  </div>

                  <div className={s.inputGroup}>
                      <label>{t('vendor.affiliate_email', 'بريد المسوق (اختياري)')}</label>
                      <input 
                          type="email"
                          className={s.input}
                          value={formData.affiliate_email}
                          onChange={e => setFormData({...formData, affiliate_email: e.target.value})}
                          placeholder="marketer@example.com"
                      />
                      <span className={s.hint}>اتركه فارغاً إذا كان الكوبون عاماً لجميع العملاء.</span>
                  </div>
                  
                  <button type="submit" disabled={creating} className={s.submitBtn}>
                      {creating ? 'جاري الإنشاء...' : 'إنشاء الكوبون'}
                  </button>
              </form>
          </div>

          {/* List */}
          <div className={s.card}>
              <h2 className={s.cardTitle}><Tag size={20} /> {t('vendor.active_programs', 'الكوبونات النشطة وبرامج التسويق')}</h2>
              <div className={s.tableWrap}>
                  <table className={s.table}>
                      <thead>
                          <tr>
                              <th>{t('vendor.coupon_code', 'الكود')}</th>
                              <th>{t('vendor.discount', 'الخصم')}</th>
                              <th>{t('vendor.marketer_name', 'البريد/المسوق')}</th>
                              <th style={{textAlign: 'right'}}>{t('vendor.used_count', 'مرات الاستخدام')}</th>
                              <th style={{textAlign: 'center'}}>{t('common.actions', 'إجراءات')}</th>
                          </tr>
                      </thead>
                      <tbody>
                          {loading ? (
                              <tr><td colSpan="5" style={{textAlign: 'center'}}>جاري التحميل...</td></tr>
                          ) : coupons.length === 0 ? (
                              <tr><td colSpan="5" style={{textAlign: 'center', color: 'var(--text-muted)'}}>لا توجد كوبونات نشطة حالياً.</td></tr>
                          ) : (
                              coupons.map(c => (
                                  <tr key={c.id}>
                                      <td><span className={s.codeBadge}>{c.code}</span></td>
                                      <td style={{fontWeight: 700}}>
                                          {c.amount_type === 'fixed' ? `${c.amount} ${t('common.currency', 'ر.س')}` : `${c.amount}%`}
                                      </td>
                                      <td>{c.affiliate_email || c.marketer_name || "-"}</td>
                                      <td style={{textAlign: 'right', fontWeight: 600}}>{c.used_count}</td>
                                      <td>
                                          <div className={s.flexActions}>
                                              <button 
                                                  onClick={() => {
                                                      const url = `${window.location.origin}/?ref=${c.code}`;
                                                      navigator.clipboard.writeText(url);
                                                      toast.push({ message: t('vendor.affiliate_link_copied', 'تم النسخ'), type: "success" });
                                                  }}
                                                  className={s.copyActionBtn}
                                                  title={t('common.copy', 'نسخ الرابط')}
                                              >
                                                  <Copy size={14} />
                                              </button>
                                              <button 
                                                  onClick={() => handleDelete(c.id)}
                                                  className={s.deleteBtn}
                                                  title={t('common.delete', 'حذف')}
                                              >
                                                  <Trash2 size={14} />
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
  );
}
