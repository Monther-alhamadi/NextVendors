import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../common/ToastProvider";
import { listWidgets, createWidget, updateWidget, deleteWidget, toggleWidget } from "../../services/adminService";
import { PlusCircle, Trash2, Edit2, X, Save, LayoutTemplate, GripVertical, Eye, EyeOff } from "lucide-react";
import styles from "./DynamicBanners.module.css";

const EMPTY_FORM = {
  title: "",
  type: "banner_carousel",
  page: "home",
  device: "all",
  position: 0,
  is_active: true,
  content: { image_url: "", link_url: "", alt_text: "", subtitle: "" },
};

const DEVICE_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "desktop", label: "سطح المكتب فقط" },
  { value: "mobile", label: "الجوال فقط" },
];

const PAGE_OPTIONS = [
  { value: "home", label: "الصفحة الرئيسية" },
  { value: "products", label: "صفحة المنتجات" },
  { value: "all", label: "جميع الصفحات" },
];

export default function DynamicBanners() {
  const { t } = useTranslation();
  const toast = useToast();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listWidgets();
      const allWidgets = Array.isArray(data) ? data : [];
      // Filter to only banner-type widgets
      setBanners(allWidgets.filter(w => w.type === "banner_carousel" || w.type === "banner" || w.type === "slider"));
    } catch {
      toast.push({ message: t("common.error", "حدث خطأ أثناء التحميل"), type: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => { loadBanners(); }, [loadBanners]);

  function openCreate() {
    setEditingBanner(null);
    setForm({ ...EMPTY_FORM, position: banners.length });
    setShowModal(true);
  }

  function openEdit(banner) {
    setEditingBanner(banner);
    setForm({
      title: banner.title || "",
      type: banner.type || "banner_carousel",
      page: banner.page || "home",
      device: banner.device || "all",
      position: banner.position ?? 0,
      is_active: banner.is_active ?? true,
      content: banner.content || { image_url: "", link_url: "", alt_text: "", subtitle: "" },
    });
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setEditingBanner(null); }

  function setContentField(key, value) {
    setForm(f => ({ ...f, content: { ...f.content, [key]: value } }));
  }

  async function handleSave() {
    if (!form.content.image_url?.trim() && !form.title?.trim()) {
      toast.push({ message: "الرجاء إدخال عنوان ورابط الصورة على الأقل", type: "warning" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        type: "banner_carousel",
        page: form.page,
        device: form.device,
        position: parseInt(form.position) || 0,
        is_active: form.is_active,
        content: form.content,
      };
      if (editingBanner) {
        await updateWidget(editingBanner.id, payload);
        toast.push({ message: "تم تحديث البانر بنجاح", type: "success" });
      } else {
        await createWidget(payload);
        toast.push({ message: "تم إنشاء البانر بنجاح", type: "success" });
      }
      closeModal();
      await loadBanners();
    } catch (e) {
      toast.push({ message: e.response?.data?.detail || t("common.error"), type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteWidget(id);
      toast.push({ message: "تم حذف البانر", type: "success" });
      setDeleteConfirm(null);
      loadBanners();
    } catch {
      toast.push({ message: t("common.error"), type: "error" });
    }
  }

  async function handleToggle(banner) {
    try {
      await updateWidget(banner.id, { is_active: !banner.is_active });
      loadBanners();
    } catch {
      toast.push({ message: t("common.error"), type: "error" });
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><LayoutTemplate size={24} /></div>
          <div>
            <h1 className={styles.title}>{t("admin.dynamic_banners", "إدارة البانرات الديناميكية")}</h1>
            <p className={styles.subtitle}>{t("admin.banners_subtitle", "تحكم في البانرات المعروضة في الصفحات المختلفة")}</p>
          </div>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <PlusCircle size={16} />
          {t("admin.new_banner", "إنشاء بانر جديد")}
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>جارٍ تحميل البانرات...</div>
      ) : banners.length === 0 ? (
        <div className={styles.emptyState}>
          <LayoutTemplate size={48} opacity={0.25} />
          <p>لا توجد بانرات بعد. أنشئ بانرك الأول!</p>
          <button className={styles.btnPrimary} onClick={openCreate}><PlusCircle size={16} /> إنشاء بانر</button>
        </div>
      ) : (
        <div className={styles.bannerGrid}>
          {banners
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map(banner => (
            <div key={banner.id} className={`${styles.bannerCard} ${!banner.is_active ? styles.inactive : ""}`}>
              <div className={styles.cardImageWrapper}>
                {banner.content?.image_url ? (
                  <img src={banner.content.image_url} alt={banner.content?.alt_text || banner.title} className={styles.cardImage} />
                ) : (
                  <div className={styles.imagePlaceholder}><LayoutTemplate size={32} opacity={0.3} /></div>
                )}
                <div className={styles.cardOverlay}>
                  <span className={styles.positionBadge}>#{banner.position ?? 0}</span>
                  <span className={`${styles.statusDot} ${banner.is_active ? styles.active : styles.offDot}`} />
                </div>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{banner.title || "بانر بدون عنوان"}</h3>
                <div className={styles.cardMeta}>
                  <span>{PAGE_OPTIONS.find(p => p.value === banner.page)?.label || banner.page}</span>
                  <span>•</span>
                  <span>{DEVICE_OPTIONS.find(d => d.value === banner.device)?.label || banner.device}</span>
                </div>
                {banner.content?.link_url && (
                  <a href={banner.content.link_url} target="_blank" rel="noreferrer" className={styles.linkPreview}>
                    {banner.content.link_url.substring(0, 40)}...
                  </a>
                )}
              </div>
              <div className={styles.cardActions}>
                <button className={styles.actionToggle} onClick={() => handleToggle(banner)} title={banner.is_active ? "إخفاء" : "إظهار"}>
                  {banner.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button className={styles.actionEdit} onClick={() => openEdit(banner)} title="تعديل">
                  <Edit2 size={15} />
                </button>
                <button className={styles.actionDelete} onClick={() => setDeleteConfirm(banner.id)} title="حذف">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingBanner ? "تعديل البانر" : "إنشاء بانر جديد"}</h2>
              <button className={styles.modalClose} onClick={closeModal}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>عنوان البانر</label>
                <input className={styles.input} placeholder="مثال: عرض الصيف" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>الصفحة المستهدفة</label>
                  <select className={styles.input} value={form.page} onChange={e => setForm(f => ({ ...f, page: e.target.value }))}>
                    {PAGE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>الجهاز المستهدف</label>
                  <select className={styles.input} value={form.device} onChange={e => setForm(f => ({ ...f, device: e.target.value }))}>
                    {DEVICE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label>رابط صورة البانر *</label>
                <input className={styles.input} placeholder="https://..." value={form.content.image_url} onChange={e => setContentField("image_url", e.target.value)} />
              </div>
              {form.content.image_url && (
                <div className={styles.imagePreview}>
                  <img src={form.content.image_url} alt="preview" onError={e => { e.target.style.display="none"; }} />
                </div>
              )}
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>رابط الضغط (اختياري)</label>
                  <input className={styles.input} placeholder="https://..." value={form.content.link_url} onChange={e => setContentField("link_url", e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label>رقم الترتيب</label>
                  <input className={styles.input} type="number" min={0} value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
                </div>
              </div>
              <div className={styles.field}>
                <label>نص بديل للصورة (SEO)</label>
                <input className={styles.input} placeholder="وصف الصورة..." value={form.content.alt_text} onChange={e => setContentField("alt_text", e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>نص ترويجي (اختياري)</label>
                <input className={styles.input} placeholder="وفر حتى 50%..." value={form.content.subtitle} onChange={e => setContentField("subtitle", e.target.value)} />
              </div>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span>تفعيل البانر فوراً</span>
              </label>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={closeModal}>إلغاء</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                <Save size={16} />{saving ? "جارٍ الحفظ..." : "حفظ البانر"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <Trash2 size={32} color="#ef4444" />
            <h3>تأكيد الحذف</h3>
            <p>هل أنت متأكد من حذف هذا البانر؟</p>
            <div className={styles.confirmActions}>
              <button className={styles.btnSecondary} onClick={() => setDeleteConfirm(null)}>إلغاء</button>
              <button className={styles.btnDanger} onClick={() => handleDelete(deleteConfirm)}>حذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
