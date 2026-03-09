import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './AdminProductEdit.module.css';

export default function AdminProductFormFields({
  name, setName, price, setPrice, inventory, setInventory,
  category, setCategory, description, setDescription,
  suggestions, errors, setErrors, saving, id, onDelete
}) {
  const { t } = useTranslation();

  function clearError(field) {
    if (errors?.[field]) {
      setErrors && setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>{t('product.basic_info', 'Basic Info')}</h2>

      <div className={styles.formGroup}>
        <label className={styles.label}>{t('product.name', 'Product Name')}</label>
        <input
          name="name"
          className={`${styles.input} ${errors?.name ? styles.inputError : ''}`}
          value={name}
          onChange={e => { setName(e.target.value); clearError('name'); }}
          placeholder={t('product.name', 'Product Name')}
        />
        {errors?.name && <span className={styles.errorText}>{errors.name}</span>}
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>{t('product.price', 'Price')}</label>
          <input
            name="price"
            type="number"
            step="0.01"
            className={`${styles.input} ${errors?.price ? styles.inputError : ''}`}
            value={price}
            onChange={e => { setPrice(e.target.value); clearError('price'); }}
          />
          {errors?.price && <span className={styles.errorText}>{errors.price}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>{t('product.stock', 'Inventory')}</label>
          <input
            name="inventory"
            type="number"
            className={`${styles.input} ${errors?.inventory ? styles.inputError : ''}`}
            value={inventory}
            onChange={e => { setInventory(e.target.value); clearError('inventory'); }}
          />
          {errors?.inventory && <span className={styles.errorText}>{errors.inventory}</span>}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>{t('product.category', 'Category')}</label>
        <input
          className={styles.input}
          value={category}
          onChange={e => setCategory(e.target.value)}
          list="cat-suggestions"
          placeholder={t('filter.placeholder_category', 'e.g. Electronics')}
        />
        {suggestions?.length > 0 && (
          <datalist id="cat-suggestions">
            {suggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        )}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>{t('product.description', 'Description')}</label>
        <textarea
          className={styles.textarea}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? t('common.loading', 'Saving...') : t('common.save', 'Save')}
        </button>
        {id && id !== 'new' && (
          <button type="button" className={styles.deleteBtn} onClick={onDelete}>
            {t('common.confirm_delete', 'Delete')}
          </button>
        )}
      </div>
    </div>
  );
}
