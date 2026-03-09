import React, { useState, useEffect } from 'react';
import { Image, Star, Grid3X3, Layers, Save, X } from 'lucide-react';
import styles from './WidgetConfigForm.module.css';

const WIDGET_ICONS = {
  HeroWidget: { icon: Image, color: '#6366f1', label: 'البنر الرئيسي' },
  SliderWidget: { icon: Layers, color: '#10b981', label: 'شريط المنتجات' },
  FeaturesWidget: { icon: Star, color: '#f59e0b', label: 'مميزات المتجر' },
  GridWidget: { icon: Grid3X3, color: '#8b5cf6', label: 'شبكة تصنيفات' },
};

export default function WidgetConfigForm({ widget, onSave, onCancel }) {
  const [localConfig, setLocalConfig] = useState(widget.config || {});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalConfig(widget.config || {});
    setHasChanges(false);
  }, [widget]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localConfig);
    setHasChanges(false);
  };

  const meta = WIDGET_ICONS[widget.type] || { icon: Layers, color: '#64748b', label: widget.type };
  const IconComp = meta.icon;

  return (
    <div className={styles.form}>
      {/* Widget Header */}
      <div className={styles.widgetHeader}>
        <div className={styles.widgetHeaderIcon} style={{ '--wc': meta.color }}>
          <IconComp size={20} />
        </div>
        <div className={styles.widgetHeaderInfo}>
          <h3 className={styles.widgetTitle}>{meta.label}</h3>
          <span className={styles.widgetMeta}>
            ID: {widget.id} • الترتيب: {widget.position}
            {hasChanges && <span className={styles.unsavedDot} />}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>المحتوى</h4>

        {/* Dynamic Title */}
        {('title' in localConfig || widget.type === "HeroWidget" || widget.type === "SliderWidget" || widget.type === "GridWidget") && (
          <div className={styles.field}>
            <label className={styles.label}>العنوان الرئيسي</label>
            <input
              name="title"
              value={localConfig.title || ""}
              onChange={handleChange}
              className={styles.input}
              placeholder="أدخل العنوان..."
            />
          </div>
        )}

        {/* Dynamic Subtitle */}
        {('subtitle' in localConfig || widget.type === "HeroWidget") && (
          <div className={styles.field}>
            <label className={styles.label}>النص الفرعي</label>
            <textarea
              name="subtitle"
              value={localConfig.subtitle || ""}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="أدخل الوصف..."
              rows={3}
            />
          </div>
        )}
      </div>

      {/* Hero-specific Fields */}
      {widget.type === "HeroWidget" && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>الزر والروابط</h4>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>نص الزر</label>
              <input
                name="button_text"
                value={localConfig.button_text || ""}
                onChange={handleChange}
                className={styles.input}
                placeholder="تسوق الآن"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>رابط الزر</label>
              <input
                name="button_link"
                value={localConfig.button_link || ""}
                onChange={handleChange}
                className={styles.input}
                placeholder="/products"
                dir="ltr"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>رابط صورة الخلفية</label>
            <input
              name="image_url"
              value={localConfig.image_url || ""}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://example.com/image.jpg"
              dir="ltr"
            />
          </div>
        </div>
      )}

      {/* Slider-specific Fields */}
      {widget.type === "SliderWidget" && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>إعدادات العرض</h4>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>فلتر التصنيف (اختياري)</label>
              <input
                name="categoryId"
                value={localConfig.categoryId || ""}
                onChange={handleChange}
                className={styles.input}
                placeholder="اتركه فارغاً لعرض الكل"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>عدد المنتجات</label>
              <input
                name="limit"
                type="number"
                value={localConfig.limit || 10}
                onChange={handleChange}
                className={styles.input}
                min={1}
                max={50}
              />
            </div>
          </div>
        </div>
      )}

      {/* Features Widget Note */}
      {widget.type === "FeaturesWidget" && (
        <div className={styles.noteBox}>
          <span>💡</span>
          <p>إدارة عناصر المميزات ستكون متاحة في الإصدار القادم من المحرر المتقدم.</p>
        </div>
      )}

      {/* Theming Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>المظهر والتصميم</h4>
        <div className={styles.field}>
          <label className={styles.label}>لون الخلفية</label>
          <div className={styles.colorField}>
            <input
              name="bg_color"
              type="color"
              value={localConfig.bg_color || "#ffffff"}
              onChange={handleChange}
              className={styles.colorInput}
            />
            <span className={styles.colorValue}>{localConfig.bg_color || "#ffffff"}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        {onCancel && (
          <button className={styles.cancelBtn} onClick={onCancel}>
            <X size={14} /> إلغاء
          </button>
        )}
        <button
          className={`${styles.saveBtn} ${hasChanges ? styles.saveBtnActive : ''}`}
          onClick={handleSave}
        >
          <Save size={14} /> حفظ الخصائص
        </button>
      </div>
    </div>
  );
}
