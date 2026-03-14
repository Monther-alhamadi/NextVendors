import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus, GripVertical, Trash2, Edit3, Settings, Monitor, CheckCircle2,
  RotateCcw, Eye, EyeOff, Layers, LayoutTemplate, Image, Star,
  Grid3X3, ExternalLink, ChevronDown, Sparkles, Save
} from "lucide-react";
import {
  listAdminPages, getAdminPage, createPage, addWidget,
  updateWidget, deleteWidget, reorderWidgets
} from "../services/cmsService";
import { useToast } from "../components/common/ToastProvider";
import PageContainer from "../components/PageContainer";
import styles from "./AdminStoreBuilder.module.css";
import WidgetConfigForm from "../components/cms/WidgetConfigForm";

/**
 * Returns the catalog of available widgets with their default configs and meta.
 */
const getWidgetCatalog = (t) => [
  {
    type: 'HeroWidget',
    label: t('cms.widgets.hero_label', 'البنر الرئيسي'),
    labelEn: 'Hero Banner',
    icon: Image,
    color: '#6366f1',
    description: t('cms.widgets.hero_desc', 'بنر كبير بخلفية وعنوان رئيسي وزر'),
    default: { 
      title: t('cms.widgets.hero_default_title', 'مرحباً بك'), 
      subtitle: '', 
      button_text: t('common.shop_now', 'تسوق الآن'), 
      bg_color: '#0a0d2e' 
    }
  },
  {
    type: 'SliderWidget',
    label: t('cms.widgets.slider_label', 'شريط المنتجات'),
    labelEn: 'Product Carousel',
    icon: Layers,
    color: '#10b981',
    description: t('cms.widgets.slider_desc', 'عرض دائري لأحدث المنتجات أو تصنيف معين'),
    default: { 
      title: t('cms.widgets.slider_default_title', 'أحدث المنتجات'), 
      categoryId: null, 
      limit: 10, 
      bg_color: '#f8fafc' 
    }
  },
  {
    type: 'FeaturesWidget',
    label: t('cms.widgets.features_label', 'مميزات المتجر'),
    labelEn: 'Store Features',
    icon: Star,
    color: '#f59e0b',
    description: t('cms.widgets.features_desc', 'عرض أيقونات المميزات مثل التوصيل والجودة'),
    default: { 
      title: t('cms.widgets.features_default_title', 'لماذا تتسوق معنا؟'), 
      items: [], 
      bg_color: '#ffffff' 
    }
  },
  {
    type: 'GridWidget',
    label: t('cms.widgets.grid_label', 'شبكة تصنيفات'),
    labelEn: 'Category Grid',
    icon: Grid3X3,
    color: '#8b5cf6',
    description: t('cms.widgets.grid_desc', 'شبكة بصرية لتصنيفات المتجر'),
    default: { 
      title: t('cms.widgets.grid_default_title', 'تسوق حسب القسم'), 
      bg_color: '#f8fafc' 
    }
  },
];

const getWidgetMeta = (type, catalog) => {
  return catalog.find(w => w.type === type) || {
    label: type, icon: LayoutTemplate, color: "#64748b", description: ""
  };
};

export default function AdminStoreBuilder() {
  const { t } = useTranslation();
  const WIDGET_CATALOG = getWidgetCatalog(t);
  const toast = useToast();

  // Core state
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [initialWidgets, setInitialWidgets] = useState([]);
  const [editingWidget, setEditingWidget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Drag state
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dropTargetIdx, setDropTargetIdx] = useState(null);
  const dragCounter = useRef(0);

  // Add widget panel
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Unsaved changes tracking (simple position-based check)
  const hasUnsavedChanges = JSON.stringify(widgets.map(w => w.id)) !== JSON.stringify(initialWidgets.map(w => w.id));

  const loadPages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listAdminPages();
      setPages(data);
      if (data.length > 0) {
        handleSelectPage(data[0]);
      } else {
        const home = await createPage({ 
          title: t("common.home_page", "الرئيسية"), 
          slug: "home", 
          is_published: true 
        });
        setPages([home]);
        handleSelectPage(home);
      }
    } catch (e) {
      toast.push({ message: t("admin.builder.err_load_pages", "فشل تحميل الصفحات"), type: "error" });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  async function handleSelectPage(pageInfo) {
    try {
      setLoading(true);
      const detailedPage = await getAdminPage(pageInfo.slug);
      setSelectedPage(detailedPage);
      const sorted = (detailedPage.widgets || []).sort((a, b) => a.position - b.position);
      setWidgets(sorted);
      setInitialWidgets(sorted);
      setEditingWidget(null);
    } catch (e) {
      toast.push({ message: t("admin.builder.err_load_page_data", "فشل تحميل بيانات الصفحة"), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // --- Add Widget ---
  const handleAddWidget = async (widgetType) => {
    const template = WIDGET_CATALOG.find(w => w.type === widgetType);
    if (!selectedPage || !template) return;
    try {
      const newWidget = await addWidget(selectedPage.id, {
        type: widgetType,
        config: template.default,
        is_active: true
      });
      const updated = [...widgets, newWidget];
      setWidgets(updated);
      setInitialWidgets(updated);
      setEditingWidget(newWidget);
      setShowAddPanel(false);
      toast.push({ message: t("admin.builder.widget_added", "تم إضافة المكون بنجاح ✨"), type: "success" });
    } catch (e) {
      toast.push({ message: t("admin.builder.widget_add_err", "خطأ أثناء إضافة المكون"), type: "error" });
    }
  };

  // --- Delete Widget ---
  const handleDeleteWidget = async (e, widgetId) => {
    e.stopPropagation();
    if (!window.confirm(t("admin.builder.del_confirm", "هل أنت متأكد من حذف هذا المكون؟"))) return;
    try {
      await deleteWidget(widgetId);
      const updated = widgets.filter(w => w.id !== widgetId);
      setWidgets(updated);
      setInitialWidgets(updated);
      if (editingWidget?.id === widgetId) setEditingWidget(null);
      toast.push({ message: t("common.deleted", "تم الحذف"), type: "success" });
    } catch (e) {
      toast.push({ message: t("common.delete_failed", "فشل الحذف"), type: "error" });
    }
  };

  // --- Toggle Widget Visibility ---
  const handleToggleActive = async (e, widget) => {
    e.stopPropagation();
    try {
      const updated = await updateWidget(widget.id, {
        ...widget,
        is_active: !widget.is_active
      });
      setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
      setInitialWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
      toast.push({
        message: updated.is_active ? t("admin.builder.widget_activated", "تم تفعيل المكون") : t("admin.builder.widget_hidden", "تم إخفاء المكون"),
        type: "success"
      });
    } catch (e) {
      toast.push({ message: t("admin.builder.status_err", "فشل تعديل الحالة"), type: "error" });
    }
  };

  // --- Save Widget Config ---
  const handleSaveWidgetConfig = async (updatedConfig) => {
    if (!editingWidget) return;
    try {
      const updated = await updateWidget(editingWidget.id, {
        ...editingWidget,
        config: updatedConfig
      });
      setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
      setInitialWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
      setEditingWidget(updated);
      toast.push({ message: t("common.saved", "تم حفظ التعديلات ✓"), type: "success" });
    } catch (e) {
      toast.push({ message: t("common.save_failed", "لم يتم حفظ التعديلات"), type: "error" });
    }
  };

  // --- Reset Changes ---
  const handleReset = async () => {
    setWidgets([...initialWidgets]);
    setEditingWidget(null);
    toast.push({ message: t("admin.builder.order_reset", "تمت إعادة ضبط الترتيب"), type: "info" });
  };

  // --- Save Order ---
  const handleSaveOrder = async () => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      const positionalArray = widgets.map((w, index) => ({ id: w.id, position: index }));
      await reorderWidgets(selectedPage.id, positionalArray);
      setInitialWidgets([...widgets]);
      toast.push({ message: t("admin.builder.order_saved", "تم حفظ الترتيب بنجاح ✓"), type: "success" });
    } catch (err) {
      toast.push({ message: t("admin.builder.order_save_err", "فشل حفظ الترتيب"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // --- Stable Drag & Drop ---
  const handleDragStart = useCallback((e, index) => {
    setDraggedIdx(index);
    dragCounter.current = 0;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    requestAnimationFrame(() => {
      e.target.classList.add(styles.dragging);
    });
  }, []);

  const handleDragEnter = useCallback((e, index) => {
    e.preventDefault();
    dragCounter.current++;
    if (draggedIdx !== null && draggedIdx !== index) {
      setDropTargetIdx(index);
    }
  }, [draggedIdx]);

  const handleDragLeave = useCallback((e) => {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIndex) return;

    const items = [...widgets];
    const [draggedItem] = items.splice(draggedIdx, 1);
    items.splice(targetIndex, 0, draggedItem);

    setWidgets(items);
    setDraggedIdx(null);
    setDropTargetIdx(null);
    dragCounter.current = 0;
  }, [draggedIdx, widgets]);

  const handleDragEnd = useCallback((e) => {
    e.target.classList.remove(styles.dragging);
    setDraggedIdx(null);
    setDropTargetIdx(null);
    dragCounter.current = 0;
  }, []);

  // --- Preview ---
  const handlePreview = () => {
    window.open("/", "_blank");
  };

  if (loading && !selectedPage) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>{t("admin.builder.loading_builder", "جاري تحميل المُنشئ المرئي...")}</p>
      </div>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><Sparkles size={24} /></div>
          <div>
            <h1 className={styles.title}>{t('admin.builder.title', 'منشئ المتجر المرئي')}</h1>
            <p className={styles.subtitle}>{t('admin.builder.subtitle', 'تخصيص كامل لواجهة المتجر بالسحب والإفلات')}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {hasUnsavedChanges && (
            <>
              <button className={styles.resetBtn} onClick={handleReset}>
                <RotateCcw size={15} /> {t('admin.builder.reset', 'إعادة الضبط')}
              </button>
              <button className={styles.saveOrderBtn} onClick={handleSaveOrder} disabled={saving}>
                <Save size={15} /> {saving ? t('common.saving', 'جاري الحفظ...') : t('admin.builder.save_order', 'حفظ الترتيب')}
              </button>
            </>
          )}
          <button className={styles.previewBtn} onClick={handlePreview}>
            <ExternalLink size={15} /> {t('admin.builder.preview', 'معاينة المتجر')}
          </button>
        </div>
      </div>

      <div className={styles.builderLayout}>
        {/* Left/Middle Pane: Canvas */}
        <div className={styles.canvasArea}>
          <div className={styles.canvasToolbar}>
            <div className={styles.pageSelector}>
              <Monitor size={16} />
              <span>{t('admin.builder.page', 'الصفحة:')}</span>
              <select
                value={selectedPage?.id || ""}
                onChange={(e) => {
                  const p = pages.find(x => x.id === parseInt(e.target.value));
                  if (p) handleSelectPage(p);
                }}
              >
                {pages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className={styles.toolbarRight}>
              {selectedPage?.is_published && (
                <span className={styles.statusLive}><CheckCircle2 size={13} /> {t("common.live", "مباشر")}</span>
              )}
              <span className={styles.widgetCount}>
                <Layers size={13} /> {widgets.length} {t('cms.widget_count', 'مكون')}
              </span>
            </div>
          </div>

          {/* Widgets List */}
          <div className={styles.widgetsList}>
            {widgets.length === 0 ? (
              <div className={styles.emptyCanvas}>
                <div className={styles.emptyIconWrap}>
                  <LayoutTemplate size={48} />
                </div>
                <p>{t('admin.builder.empty_page', 'هذه الصفحة فارغة')}</p>
                <span>{t('admin.builder.empty_page_hint', 'أضف مكونات من الزر أدناه لبدء بناء واجهتك')}</span>
              </div>
            ) : (
              widgets.map((widget, index) => {
                const meta = getWidgetMeta(widget.type, WIDGET_CATALOG);
                const IconComp = meta.icon;
                const isDropTarget = dropTargetIdx === index && draggedIdx !== null && draggedIdx !== index;
                const isDragged = draggedIdx === index;

                return (
                  <React.Fragment key={widget.id}>
                    {/* Drop indicator line */}
                    {isDropTarget && draggedIdx > index && (
                      <div className={styles.dropIndicator}>
                        <div className={styles.dropIndicatorDot} />
                        <div className={styles.dropIndicatorLine} />
                        <div className={styles.dropIndicatorDot} />
                      </div>
                    )}

                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setEditingWidget(widget)}
                      className={`${styles.widgetBlock} ${editingWidget?.id === widget.id ? styles.activeBlock : ""} ${isDragged ? styles.dragging : ""} ${!widget.is_active ? styles.inactiveBlock : ""}`}
                    >
                      <div className={styles.dragHandle}><GripVertical size={16} /></div>
                      <div className={styles.widgetIcon} style={{ "--widget-color": meta.color }}>
                        <IconComp size={18} />
                      </div>
                      <div className={styles.blockInfo}>
                        <div className={styles.blockTypeRow}>
                          <span className={styles.blockType}>{meta.label}</span>
                          <span className={styles.blockTypeBadge} style={{ background: meta.color }}>
                            {meta.labelEn || widget.type}
                          </span>
                        </div>
                        <span className={styles.blockSummary}>
                          {widget.config?.title || t("common.untitled", "بدون عنوان")}
                        </span>
                      </div>
                      <div className={styles.blockActions}>
                        <button
                          className={styles.visibilityBtn}
                          onClick={(e) => handleToggleActive(e, widget)}
                          title={widget.is_active ? t('common.hide', 'إخفاء') : t('common.show', 'إظهار')}
                        >
                          {widget.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button className={styles.editBtn} onClick={() => setEditingWidget(widget)}>
                          <Edit3 size={14} />
                        </button>
                        <button className={styles.deleteBtn} onClick={(e) => handleDeleteWidget(e, widget.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Drop indicator line after */}
                    {isDropTarget && draggedIdx < index && (
                      <div className={styles.dropIndicator}>
                        <div className={styles.dropIndicatorDot} />
                        <div className={styles.dropIndicatorLine} />
                        <div className={styles.dropIndicatorDot} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Add Widget Button */}
          <div className={styles.addWidgetBar}>
            <button className={styles.addWidgetTrigger} onClick={() => setShowAddPanel(!showAddPanel)}>
              <Plus size={18} /> {t('admin.builder.add_widget', 'إضافة مكون جديد')}
              <ChevronDown size={14} className={showAddPanel ? styles.chevronOpen : ""} />
            </button>

            {showAddPanel && (
              <div className={styles.widgetCatalog}>
                {WIDGET_CATALOG.map(w => {
                  const IconComp = w.icon;
                  return (
                    <button
                      key={w.type}
                      className={styles.catalogItem}
                      onClick={() => handleAddWidget(w.type)}
                    >
                      <div className={styles.catalogIcon} style={{ "--cat-color": w.color }}>
                        <IconComp size={20} />
                      </div>
                      <div className={styles.catalogInfo}>
                        <span className={styles.catalogLabel}>{w.label}</span>
                        <span className={styles.catalogDesc}>{w.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Inspector */}
        <div className={styles.inspectorArea}>
          <div className={styles.inspectorHeader}>
            <Settings size={18} />
            <h2>{t("admin.builder.widget_settings", "إعدادات المكون")}</h2>
          </div>
          <div className={styles.inspectorBody}>
            {editingWidget ? (
              <WidgetConfigForm
                widget={editingWidget}
                onSave={handleSaveWidgetConfig}
                onCancel={() => setEditingWidget(null)}
              />
            ) : (
              <div className={styles.inspectorEmpty}>
                <div className={styles.inspectorEmptyIcon}><Edit3 size={32} /></div>
                <p>{t('admin.builder.select_widget', 'اختر مكوناً من الواجهة')}</p>
                <span>{t('admin.builder.select_widget_hint', 'انقر على أي مكون لتعديل خصائصه ومظهره')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
