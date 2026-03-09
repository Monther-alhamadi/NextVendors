import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../common/ToastProvider";
import { listAds, createAd, updateAd, deleteAd } from "../../services/adminService";
import { PlusCircle, Trash2, Edit2, ToggleLeft, ToggleRight, Megaphone, Image, Code2, X, Save } from "lucide-react";
import styles from "./AdminAds.module.css";

const ZONES = [
  { value: "homepage_top", label: "أعلى الصفحة الرئيسية" },
  { value: "homepage_mid", label: "منتصف الصفحة الرئيسية" },
  { value: "product_list", label: "قائمة المنتجات" },
  { value: "sidebar", label: "الشريط الجانبي" },
  { value: "checkout_bottom", label: "أسفل صفحة الدفع" },
];

const AD_TYPES = [
  { value: "image", label: "صورة" },
  { value: "html", label: "كود HTML مخصص" },
];

const EMPTY_FORM = {
  zone: "homepage_top",
  title: "",
  is_active: true,
  content: { type: "image", url: "", link: "", html_code: "" },
  start_at: "",
  end_at: "",
};

export default function AdminAds() {
  const { t } = useTranslation();
  const toast = useToast();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadAds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAds();
      setAds(Array.isArray(data) ? data : []);
    } catch {
      toast.push({ message: t("common.error", "حدث خطأ أثناء تحميل البيانات"), type: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => { loadAds(); }, [loadAds]);

  function openCreate() {
    setEditingAd(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(ad) {
    setEditingAd(ad);
    setForm({
      zone: ad.zone || "homepage_top",
      title: ad.title || "",
      is_active: ad.is_active ?? true,
      content: ad.content || { type: "image", url: "", link: "", html_code: "" },
      start_at: ad.start_at ? ad.start_at.slice(0, 16) : "",
      end_at: ad.end_at ? ad.end_at.slice(0, 16) : "",
    });
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setEditingAd(null); }

  function setContentField(key, value) {
    setForm(f => ({ ...f, content: { ...f.content, [key]: value } }));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.push({ message: "عنوان الإعلان مطلوب", type: "warning" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        zone: form.zone,
        title: form.title,
        is_active: form.is_active,
        content: form.content,
        start_at: form.start_at || null,
        end_at: form.end_at || null,
      };
      if (editingAd) {
        await updateAd(editingAd.id, payload);
        toast.push({ message: "تم تحديث الإعلان بنجاح", type: "success" });
      } else {
        await createAd(payload);
        toast.push({ message: "تم إنشاء الإعلان بنجاح", type: "success" });
      }
      closeModal();
      await loadAds();
    } catch (e) {
      toast.push({ message: e.response?.data?.detail || t("common.error", "حدث خطأ"), type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAd(id);
      toast.push({ message: "تم حذف الإعلان", type: "success" });
      setDeleteConfirm(null);
      loadAds();
    } catch {
      toast.push({ message: t("common.error", "فشل الحذف"), type: "error" });
    }
  }

  async function handleToggle(ad) {
    try {
      await updateAd(ad.id, { is_active: !ad.is_active });
      loadAds();
    } catch {
      toast.push({ message: t("common.error"), type: "error" });
    }
  }

  const zoneLabel = (z) => ZONES.find(x => x.value === z)?.label || z;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><Megaphone size={24} /></div>
          <div>
            <h1 className={styles.title}>{t("admin.ads_management", "إدارة الإعلانات")}</h1>
            <p className={styles.subtitle}>{t("admin.ads_subtitle", "تحكم في الإعلانات المعروضة في مناطق مختلفة من المتجر")}</p>
          </div>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <PlusCircle size={16} />
          {t("admin.new_ad", "إنشاء إعلان جديد")}
        </button>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        {ZONES.map(z => {
          const count = ads.filter(a => a.zone === z.value).length;
          const active = ads.filter(a => a.zone === z.value && a.is_active).length;
          return (
            <div key={z.value} className={styles.statCard}>
              <span className={styles.statLabel}>{z.label}</span>
              <span className={styles.statValue}>{active} / {count}</span>
              <span className={styles.statHint}>نشط / الكل</span>
            </div>
          );
        })}
      </div>

      {/* Ads Table */}
      {loading ? (
        <div className={styles.loadingState}>جارٍ التحميل...</div>
      ) : ads.length === 0 ? (
        <div className={styles.emptyState}>
          <Megaphone size={48} opacity={0.3} />
          <p>لا توجد إعلانات بعد. أنشئ إعلانك الأول!</p>
          <button className={styles.btnPrimary} onClick={openCreate}><PlusCircle size={16} /> إنشاء إعلان</button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>العنوان</th>
                <th>المنطقة</th>
                <th>النوع</th>
                <th>النشاط</th>
                <th>الجدولة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {ads.map(ad => (
                <tr key={ad.id} className={!ad.is_active ? styles.rowInactive : ""}>
                  <td>
                    <div className={styles.adTitle}>{ad.title}</div>
                    <div className={styles.adId}>#{ad.id}</div>
                  </td>
                  <td><span className={styles.zoneBadge}>{zoneLabel(ad.zone)}</span></td>
                  <td>
                    <span className={styles.typeBadge}>
                      {ad.content?.type === "html" ? <Code2 size={12} /> : <Image size={12} />}
                      {ad.content?.type === "html" ? "HTML" : "صورة"}
                    </span>
                  </td>
                  <td>
                    <button className={`${styles.toggleBtn} ${ad.is_active ? styles.on : styles.off}`} onClick={() => handleToggle(ad)}>
                      {ad.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      <span>{ad.is_active ? "نشط" : "معطل"}</span>
                    </button>
                  </td>
                  <td>
                    <div className={styles.schedule}>
                      {ad.start_at ? <span>من: {new Date(ad.start_at).toLocaleDateString("ar-SA")}</span> : <span className={styles.muted}>فوري</span>}
                      {ad.end_at && <span>حتى: {new Date(ad.end_at).toLocaleDateString("ar-SA")}</span>}
                    </div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.btnEdit} onClick={() => openEdit(ad)} title="تعديل"><Edit2 size={15} /></button>
                      <button className={styles.btnDelete} onClick={() => setDeleteConfirm(ad.id)} title="حذف"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingAd ? "تعديل الإعلان" : "إنشاء إعلان جديد"}</h2>
              <button className={styles.modalClose} onClick={closeModal}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fieldGroup}>
                <label>عنوان الإعلان *</label>
                <input className={styles.input} placeholder="مثال: عرض الصيف الكبير" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className={styles.row2}>
                <div className={styles.fieldGroup}>
                  <label>منطقة العرض</label>
                  <select className={styles.input} value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}>
                    {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label>نوع المحتوى</label>
                  <select className={styles.input} value={form.content.type} onChange={e => setContentField("type", e.target.value)}>
                    {AD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {form.content.type === "image" ? (
                <>
                  <div className={styles.fieldGroup}>
                    <label>رابط الصورة (URL)</label>
                    <input className={styles.input} placeholder="https://..." value={form.content.url} onChange={e => setContentField("url", e.target.value)} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>رابط الإعلان (عند الضغط)</label>
                    <input className={styles.input} placeholder="https://..." value={form.content.link} onChange={e => setContentField("link", e.target.value)} />
                  </div>
                  {form.content.url && (
                    <div className={styles.preview}>
                      <p className={styles.previewLabel}>معاينة:</p>
                      <img src={form.content.url} alt="preview" className={styles.previewImg} onError={e => { e.target.style.display = "none"; }} />
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.fieldGroup}>
                  <label>كود HTML</label>
                  <textarea className={styles.textarea} rows={6} placeholder="<div>...</div>" value={form.content.html_code} onChange={e => setContentField("html_code", e.target.value)} />
                </div>
              )}

              <div className={styles.row2}>
                <div className={styles.fieldGroup}>
                  <label>تاريخ البدء (اختياري)</label>
                  <input className={styles.input} type="datetime-local" value={form.start_at} onChange={e => setForm(f => ({ ...f, start_at: e.target.value }))} />
                </div>
                <div className={styles.fieldGroup}>
                  <label>تاريخ الانتهاء (اختياري)</label>
                  <input className={styles.input} type="datetime-local" value={form.end_at} onChange={e => setForm(f => ({ ...f, end_at: e.target.value }))} />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.checkRow}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                  <span>تفعيل الإعلان فوراً</span>
                </label>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={closeModal}>إلغاء</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                <Save size={16} />{saving ? "جارٍ الحفظ..." : "حفظ الإعلان"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmDialog} onClick={e => e.stopPropagation()}>
            <Trash2 size={32} color="var(--color-error, #ef4444)" />
            <h3>تأكيد الحذف</h3>
            <p>هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذه العملية.</p>
            <div className={styles.confirmActions}>
              <button className={styles.btnSecondary} onClick={() => setDeleteConfirm(null)}>إلغاء</button>
              <button className={styles.btnDanger} onClick={() => handleDelete(deleteConfirm)}>حذف نهائياً</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
