import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../common/ToastProvider";
import { listWidgets, createWidget, updateWidget, deleteWidget } from "../../services/adminService";
import { PlusCircle, Trash2, Edit2, X, Save, Grid, Eye, EyeOff, Star } from "lucide-react";
import styles from "./CategoryShowcase.module.css";

const EMPTY_FORM = {
  title: "",
  type: "categories_bar",
  page: "home",
  device: "all",
  position: 0,
  is_active: true,
  content: { category_ids: [], max_items: 8, show_labels: true, highlight_color: "#6366f1" },
};

export default function CategoryShowcase() {
  const { t } = useTranslation();
  const toast = useToast();
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const WIDGET_TYPES = [
    { value: "categories_bar", label: t('admin.showcase.types.categories', 'شريط الأقسام') },
    { value: "product_grid", label: t('admin.showcase.types.grid', 'شبكة المنتجات المميزة') },
    { value: "flash_sale", label: t('admin.showcase.types.flash', 'تخفيضات فلاش') },
    { value: "custom_html", label: t('admin.showcase.types.html', 'محتوى HTML مخصص') },
  ];

  const PAGE_OPTIONS = [
    { value: "home", label: t('common.home', 'الصفحة الرئيسية') },
    { value: "products", label: t('nav.products', 'صفحة المنتجات') },
    { value: "all", label: t('common.all', 'جميع الصفحات') },
  ];

  const DEVICE_OPTIONS = [
    { value: "all", label: t('common.all', 'الكل') },
    { value: "desktop", label: t('common.desktop', 'سطح المكتب') },
    { value: "mobile", label: t('common.mobile', 'الجوال') },
  ];

  const loadWidgets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listWidgets();
      const all = Array.isArray(data) ? data : [];
      // Show all widgets except banner types (those are in DynamicBanners)
      setWidgets(all.filter(w => w.type !== "banner_carousel" && w.type !== "slider" && w.type !== "banner"));
    } catch {
      toast.push({ message: t("common.error"), type: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => { loadWidgets(); }, [loadWidgets]);

  function openCreate() {
    setEditingWidget(null);
    setForm({ ...EMPTY_FORM, position: widgets.length });
    setShowModal(true);
  }

  function openEdit(widget) {
    setEditingWidget(widget);
    setForm({
      title: widget.title || "",
      type: widget.type || "categories_bar",
      page: widget.page || "home",
      device: widget.device || "all",
      position: widget.position ?? 0,
      is_active: widget.is_active ?? true,
      content: widget.content || EMPTY_FORM.content,
    });
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setEditingWidget(null); }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.push({ message: t("admin.showcase.title_req", "عنوان الودجت مطلوب"), type: "warning" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        page: form.page,
        device: form.device,
        position: parseInt(form.position) || 0,
        is_active: form.is_active,
        content: form.content,
      };
      if (editingWidget) {
        await updateWidget(editingWidget.id, payload);
        toast.push({ message: t("admin.showcase.update_success"), type: "success" });
      } else {
        await createWidget(payload);
        toast.push({ message: t("admin.showcase.create_success"), type: "success" });
      }
      closeModal();
      await loadWidgets();
    } catch (e) {
      toast.push({ message: e.response?.data?.detail || t("common.error"), type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteWidget(id);
      toast.push({ message: t("admin.showcase.delete_success"), type: "success" });
      setDeleteConfirm(null);
      loadWidgets();
    } catch { toast.push({ message: t("common.error"), type: "error" }); }
  }

  async function handleToggle(widget) {
    try {
      await updateWidget(widget.id, { is_active: !widget.is_active });
      loadWidgets();
    } catch { toast.push({ message: t("common.error"), type: "error" }); }
  }

  const typeLabel = (v) => WIDGET_TYPES.find(t => t.value === v)?.label || v;
  const pageLabel = (v) => PAGE_OPTIONS.find(p => p.value === v)?.label || v;

  // Group widgets by page for organized display
  const grouped = widgets.reduce((acc, w) => {
    const key = w.page || "home";
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {});

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><Grid size={24} /></div>
          <div>
            <h1 className={styles.title}>{t("admin.category_showcase_title", "ودجت الصفحات والأقسام")}</h1>
            <p className={styles.subtitle}>{t("admin.showcase_subtitle", "تحكم في العناصر والأقسام التفاعلية المعروضة في صفحات المتجر")}</p>
          </div>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <PlusCircle size={16} /> {t("admin.showcase.add_widget", "إضافة ودجت جديد")}
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryRow}>
        {WIDGET_TYPES.slice(0, 4).map(wt => {
          const count = widgets.filter(w => w.type === wt.value).length;
          const active = widgets.filter(w => w.type === wt.value && w.is_active).length;
          return (
            <div key={wt.value} className={styles.summaryCard}>
              <div className={styles.summaryIcon}><Star size={16} /></div>
              <div className={styles.summaryLabel}>{wt.label}</div>
              <div className={styles.summaryCount}>{active}<span>/{count}</span></div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className={styles.loading}>{t("common.loading", "جارٍ التحميل...")}</div>
      ) : widgets.length === 0 ? (
        <div className={styles.empty}>
          <Grid size={48} opacity={0.25} />
          <p>{t("admin.showcase.empty", "لا توجد ودجت بعد. ابدأ بإضافة عناصر لصفحاتك!")}</p>
          <button className={styles.btnPrimary} onClick={openCreate}><PlusCircle size={16} /> {t("admin.showcase.add_widget_btn", "إضافة ودجت")}</button>
        </div>
      ) : (
        <div className={styles.sections}>
          {Object.entries(grouped).map(([page, items]) => (
            <div key={page} className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{pageLabel(page)}</h2>
                <span className={styles.sectionCount}>{items.length} {t("admin.showcase.widget_word", "ودجت")}</span>
              </div>
              <div className={styles.widgetList}>
                {items
                  .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                  .map(widget => (
                  <div key={widget.id} className={`${styles.widgetRow} ${!widget.is_active ? styles.inactiveRow : ""}`}>
                    <div className={styles.widgetLeft}>
                      <div className={styles.widgetDrag}><span>⠿</span></div>
                      <div className={`${styles.widgetDot} ${widget.is_active ? styles.activeDot : styles.inactiveDot}`} />
                      <div>
                        <div className={styles.widgetName}>{widget.title}</div>
                        <div className={styles.widgetMeta}>
                          <span className={styles.typePill}>{typeLabel(widget.type)}</span>
                          <span className={styles.metaItem}>{t("common.order", "الترتيب")}: {widget.position ?? 0}</span>
                          <span className={styles.metaItem}>{DEVICE_OPTIONS.find(d => d.value === widget.device)?.label || widget.device}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.widgetActions}>
                      <button className={`${styles.actionBtn} ${styles.toggleBtn}`} onClick={() => handleToggle(widget)} title={widget.is_active ? t("common.hide", "إخفاء") : t("common.show", "إظهار")}>
                        {widget.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span>{widget.is_active ? t("common.active", "نشط") : t("common.hidden", "مخفي")}</span>
                      </button>
                      <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openEdit(widget)}>
                        <Edit2 size={14} /> <span>{t("common.edit", "تعديل")}</span>
                      </button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => setDeleteConfirm(widget.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingWidget ? t('admin.showcase.edit_widget', 'تعديل الودجت') : t("admin.showcase.add_widget", "إضافة ودجت جديد")}</h2>
              <button className={styles.modalClose} onClick={closeModal}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>{t("admin.showcase.widget_title", "عنوان الودجت")} *</label>
                <input className={styles.input} placeholder={t("admin.showcase.title_ph", "مثال: أقسام الصفحة الرئيسية")} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>{t("admin.showcase.widget_type", "نوع الودجت")}</label>
                  <select className={styles.input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {WIDGET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>{t("admin.showcase.target_page", "الصفحة المستهدفة")}</label>
                  <select className={styles.input} value={form.page} onChange={e => setForm(f => ({ ...f, page: e.target.value }))}>
                    {PAGE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>{t("admin.showcase.target_device", "الجهاز المستهدف")}</label>
                  <select className={styles.input} value={form.device} onChange={e => setForm(f => ({ ...f, device: e.target.value }))}>
                    {DEVICE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>{t("admin.showcase.order_num", "رقم الترتيب")}</label>
                  <input className={styles.input} type="number" min={0} value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
                </div>
              </div>
              {(form.type === "categories_bar" || form.type === "product_grid") && (
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>{t("admin.showcase.max_items", "أقصى عدد عناصر")}</label>
                    <input className={styles.input} type="number" min={1} max={24} value={form.content.max_items} onChange={e => setForm(f => ({ ...f, content: { ...f.content, max_items: parseInt(e.target.value) } }))} />
                  </div>
                  <div className={styles.field}>
                    <label>{t("admin.showcase.highlight_color", "ألوان التمييز")}</label>
                    <input className={styles.input} type="color" value={form.content.highlight_color || "#6366f1"} onChange={e => setForm(f => ({ ...f, content: { ...f.content, highlight_color: e.target.value } }))} />
                  </div>
                </div>
              )}
              {form.type === "custom_html" && (
                <div className={styles.field}>
                  <label>{t("admin.showcase.html_code", "كود HTML")}</label>
                  <textarea className={styles.textarea} rows={6} placeholder="<div>...</div>" value={form.content.html || ""} onChange={e => setForm(f => ({ ...f, content: { ...f.content, html: e.target.value } }))} />
                </div>
              )}
              <label className={styles.checkRow}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span>{t("admin.showcase.activate_now", "تفعيل الودجت فوراً")}</span>
              </label>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={closeModal}>{t("common.cancel", "إلغاء")}</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                <Save size={16} />{saving ? t("common.saving", "جارٍ الحفظ...") : t("admin.showcase.save", "حفظ الودجت")}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <Trash2 size={32} color="#ef4444" />
            <h3>{t("common.confirm_delete", "تأكيد الحذف")}</h3>
            <p>{t("admin.showcase.delete_warn", "سيتم حذف هذا الودجت نهائياً من جميع الصفحات.")}</p>
            <div className={styles.confirmActions}>
              <button className={styles.btnSecondary} onClick={() => setDeleteConfirm(null)}>{t("common.cancel", "إلغاء")}</button>
              <button className={styles.btnDanger} onClick={() => handleDelete(deleteConfirm)}>{t("common.delete", "حذف")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
