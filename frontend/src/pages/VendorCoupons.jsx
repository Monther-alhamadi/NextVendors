import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "react-i18next";
import { listVendorCoupons, createVendorCoupon, deleteVendorCoupon } from "../services/couponService";
import { getMySupplierInfo } from "../services/supplierService";
import api from "../services/api";
import { Copy, PlusCircle, Trash2, Tag, Percent } from "lucide-react";
import s from "./VendorCoupons.module.css";

export default function VendorCoupons() {
  const { t } = useTranslation();
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState(null);
  const [creating, setCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    code: "",
    amount: "",
    amount_type: "percentage", 
    affiliate_email: ""
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const info = await getMySupplierInfo().catch(() => null);
      setSupplier(info);

      if (info) {
        const [cData] = await Promise.all([
          listVendorCoupons()
        ]);
        setCoupons(cData || []);
      }
    } catch (e) {
      toast.push({ message: t("common.error", "فشل تحميل البيانات"), type: "error" });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.amount) {
      toast.push({ message: t("vendor.fill_all_fields", "يرجى ملء كافة الحقول"), type: "warning" });
      return;
    }

    setCreating(true);
    try {
      await createVendorCoupon({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.push({ message: t("vendor.coupon_created", "تم إنشاء الكوبون بنجاح"), type: "success" });
      setFormData({ code: "", amount: "", amount_type: "percentage", affiliate_email: "" });
      loadData();
    } catch (e) {
      toast.push({ message: e.response?.data?.detail || t("common.error"), type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("common.confirm_delete", "هل أنت متأكد من الحذف؟"))) return;
    try {
      await deleteVendorCoupon(id);
      toast.push({ message: t("common.deleted", "تم الحذف بنجاح"), type: "success" });
      loadData();
    } catch (e) {
      toast.push({ message: t("common.error"), type: "error" });
    }
  };

  const copyReferralLink = (code) => {
    const url = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast.push({ message: t("vendor.affiliate_link_copied", "تم نسخ رابط الأفلييت"), type: "success" });
  };

  if (loading) {
    return <div className={s.loading}>{t("common.loading", "جارٍ التحميل...")}</div>;
  }

  return (
    <div className={s.container}>
      <header className={s.header}>
        <h1 className={s.title}>{t("vendor.coupons_title", "إدارة الكوبونات والأفلييت")}</h1>
      </header>

      <div className={s.mainGrid}>
        {/* Create Form */}
        <div className={s.formCard}>
          <h2 className={s.cardTitle}>{t("vendor.create_new_coupon", "إنشاء كوبون جديد")}</h2>
          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.fieldGroup}>
              <label>{t("vendor.coupon_code", "رمز الكوبون")}</label>
              <input 
                className={s.input} 
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                placeholder="EX: SUMMER20"
              />
            </div>
            
            <div className={s.row}>
              <div className={s.fieldGroup}>
                <label>{t("vendor.discount_type", "نوع الخصم")}</label>
                <select 
                  className={s.select}
                  value={formData.amount_type}
                  onChange={e => setFormData({...formData, amount_type: e.target.value})}
                >
                  <option value="percentage">{t("common.percentage", "نسبة مئوية %")}</option>
                  <option value="fixed">{t("common.fixed_amount", "مبلغ ثابت")}</option>
                </select>
              </div>
              <div className={s.fieldGroup}>
                <label>{t("vendor.discount_value", "قيمة الخصم")}</label>
                <input 
                  type="number"
                  className={s.input} 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>

            <div className={s.fieldGroup}>
              <label>{t("vendor.affiliate_email", "بريد المسوق (اختياري)")}</label>
              <input 
                type="email"
                className={s.input} 
                value={formData.affiliate_email} 
                onChange={e => setFormData({...formData, affiliate_email: e.target.value})}
                placeholder="marketer@example.com"
              />
            </div>

            <button type="submit" className={s.submitBtn} disabled={creating}>
              <PlusCircle size={18} /> {creating ? t("common.saving", "جاري الحفظ...") : t("vendor.add_coupon", "إضافة الكوبون")}
            </button>
          </form>
        </div>

        {/* Coupons Table */}
        <div className={s.tableCard}>
          <h2 className={s.cardTitle}>{t("vendor.active_coupons", "الكوبونات النشطة")}</h2>
          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>{t("vendor.coupon_code", "الرمز")}</th>
                  <th>{t("vendor.discount", "الخصم")}</th>
                  <th>{t("vendor.affiliate", "المسوق")}</th>
                  <th style={{textAlign: 'right'}}>{t("vendor.uses", "الاستخدامات")}</th>
                  <th>{t("common.actions", "الإجراءات")}</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={s.emptyCell}>{t("vendor.no_coupons", "لا يوجد كوبونات حالياً")}</td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id}>
                      <td className={s.codeCell}><Tag size={14} /> {c.code}</td>
                      <td>
                        <span className={s.amountBadge}>
                          {c.amount_type === 'percentage' ? `${c.amount}%` : `${c.amount} ${t('common.currency')}`}
                        </span>
                      </td>
                      <td>{c.affiliate_email || c.marketer_name || '-'}</td>
                      <td style={{textAlign: 'right', fontWeight: 600}}>{c.used_count || 0}</td>
                      <td>
                        <div className={s.actions}>
                          <button 
                            className={s.copyBtn} 
                            onClick={() => copyReferralLink(c.code)}
                            title={t("common.copy_link", "نسخ رابط المسوق")}
                          >
                            <Copy size={14} />
                          </button>
                          <button 
                            className={s.deleteBtn} 
                            onClick={() => handleDelete(c.id)}
                            title={t("common.delete", "حذف")}
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
