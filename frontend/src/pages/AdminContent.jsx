import React, { useState, useEffect } from "react";
import PageContainer from "../components/PageContainer";
import { useTranslation } from "react-i18next";
import { ArrowUp, ArrowDown, Trash2, Plus, Edit2, Layout, Image as ImageIcon, Tag, MousePointerClick } from "lucide-react";
import governanceService from "../services/governanceService";
import { useToast } from "../components/common/ToastProvider";
import Skeleton from "../components/common/Skeleton";
import styles from "./AdminContent.module.css";

export default function AdminContent() {
  const { t } = useTranslation();
  const toast = useToast();
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadWidgets();
  }, []);

  async function loadWidgets() {
    try {
      const data = await governanceService.getActiveWidgets();
      const sorted = (data || []).sort((a, b) => a.sort_order - b.sort_order);
      setWidgets(sorted);
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error_loading_data', 'Failed to load content'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function toggleVisibility(widget) {
    try {
      const updated = { ...widget, is_active: !widget.is_active };
      // Optimistic update
      setWidgets(widgets.map(w => w.id === widget.id ? updated : w));
      
      await governanceService.updateWidget(widget.id, { is_active: updated.is_active });
      toast.push({ message: t('admin.widget_updated', 'Widget updated via CMS'), type: 'success' });
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error', 'Update Failed'), type: 'error' });
      loadWidgets(); // Revert on error
    }
  }

  async function moveWidget(index, direction) {
    if ((direction === -1 && index === 0) || (direction === 1 && index === widgets.length - 1)) return;

    const newWidgets = [...widgets];
    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[index + direction];
    newWidgets[index + direction] = temp;

    // Update sort_order for swapped items
    newWidgets[index].sort_order = index;
    newWidgets[index + direction].sort_order = index + direction;

    setWidgets(newWidgets);

    try {
      await Promise.all([
        governanceService.updateWidget(newWidgets[index].id, { sort_order: index }),
        governanceService.updateWidget(newWidgets[index + direction].id, { sort_order: index + direction })
      ]);
      toast.push({ message: t('admin.order_saved', 'Content Order Updated'), type: 'success' });
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error_saving_order', 'Failed to save order'), type: 'error' });
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'banner': return <ImageIcon size={24} color="#3b82f6" />;
      case 'flash_sale': return <Tag size={24} color="#ef4444" />;
      case 'featured_vendors': return <Layout size={24} color="#8b5cf6" />;
      default: return <Layout size={24} color="#64748b" />;
    }
  };

  const filteredWidgets = activeTab === 'all' ? widgets : widgets.filter(w => w.type === activeTab);

  if (loading) return <PageContainer><div style={{padding:'4rem'}}><Skeleton height="400px" /></div></PageContainer>;

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('admin.content_management', 'إدارة المحتوى (CMS)')}</h1>
          <p className={styles.pageSubtitle}>{t('admin.content_desc', 'إدارة وتخصيص واجهة المنصة وترتيب العناصر للمستخدمين')}</p>
        </div>
        <button className={styles.addBtn}>
          <Plus size={18} />
          {t('admin.add_widget', 'إضافة عنصر')}
        </button>
      </div>

      <div className={styles.tabsContainer}>
        {['all', 'banner', 'flash_sale', 'featured_vendors'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
          >
            {t(`admin.widget_${tab}`, tab.replace('_', ' '))}
          </button>
        ))}
      </div>

      <div className={styles.widgetsList}>
        {filteredWidgets.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} style={{display:'flex', justifyContent:'center'}}>
               <MousePointerClick size={48} />
            </div>
            <p className={styles.emptyText}>{t('admin.no_widgets', 'لا توجد عناصر واجهة في هذا التبويب.')}</p>
          </div>
        ) : (
          filteredWidgets.map((widget, index) => (
            <div key={widget.id} className={`${styles.widgetCard} ${!widget.is_active ? styles.inactive : ''}`}>
              <div className={styles.dragHandle}>
                  <button 
                    onClick={() => moveWidget(index, -1)} 
                    disabled={index === 0}
                    className={styles.dragBtn}
                    title={t('admin.move_up', 'تحريك لأعلى')}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button 
                    onClick={() => moveWidget(index, 1)} 
                    disabled={index === widgets.length - 1}
                    className={styles.dragBtn}
                    title={t('admin.move_down', 'تحريك لأسفل')}
                  >
                    <ArrowDown size={14} />
                  </button>
              </div>
              
              <div className={styles.iconBox}>
                {getIcon(widget.type)}
              </div>
              
              <div className={styles.contentBox}>
                <h3 className={styles.widgetTitle}>{widget.title}</h3>
                <div className={styles.metaRow}>
                  <span className={styles.typeBadge}>{widget.type.replace('_', ' ')}</span>
                  {widget.settings?.layout && <span>• {widget.settings.layout}</span>}
                </div>
              </div>

              <div className={styles.controlsBox}>
                <div className={styles.statusToggle}>
                  <span className={`${styles.statusLabel} ${widget.is_active ? styles.active : styles.inactive}`}>
                    {widget.is_active ? t('common.active', 'نشط') : t('common.hidden', 'مخفي')}
                  </span>
                  <button 
                    onClick={() => toggleVisibility(widget)}
                    className={`${styles.toggleSwitch} ${widget.is_active ? styles.on : styles.off}`}
                    title={t('admin.toggle_visibility', 'تبديل الظهور')}
                  >
                    <span className={styles.toggleHandle} />
                  </button>
                </div>
                
                <div className={styles.actionsGroup}>
                  <button className={`${styles.actionBtn} ${styles.edit}`} title={t('common.edit', 'تعديل')}>
                    <Edit2 size={18} />
                  </button>
                  <button className={`${styles.actionBtn} ${styles.delete}`} title={t('common.delete', 'حذف')}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </PageContainer>
  );
}
