import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Plus } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/common/ToastProvider';
import styles from './AdminProductEdit.module.css';

export default function AdminProductSuppliers({ product, onUpdate }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [vendors, setVendors] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [vendorSku, setVendorSku] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!product?.id) return;
    (async () => {
      try {
        const [vRes, lRes] = await Promise.all([
          api.get('/admin/vendors'),
          api.get(`/products/${product.id}/supplier-links`).catch(() => ({ data: [] })),
        ]);
        setVendors(Array.isArray(vRes.data) ? vRes.data : vRes.data?.items || []);
        setLinks(Array.isArray(lRes.data) ? lRes.data : []);
      } catch (e) {
        console.error('Failed to load supplier data', e);
      }
    })();
  }, [product?.id]);

  async function handleLink() {
    if (!selectedVendor) {
      toast.push({ message: t('product.select_vendor_msg', 'Select a vendor'), type: 'warning' });
      return;
    }
    setLinking(true);
    try {
      await api.post(`/products/${product.id}/supplier-links`, {
        supplier_id: parseInt(selectedVendor),
        cost_price: costPrice ? parseFloat(costPrice) : null,
        sku_vendor: vendorSku || null,
      });
      toast.push({ message: t('product.linked_vendor_success', 'Vendor linked'), type: 'success' });
      setSelectedVendor('');
      setCostPrice('');
      setVendorSku('');
      onUpdate && onUpdate();
    } catch (e) {
      toast.push({ message: t('product.link_vendor_failed', 'Link failed'), type: 'error' });
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className={styles.supplierSection}>
      <h3 className={styles.supplierTitle}>
        <Link2 size={16} /> {t('product.suppliers_dropshipping', 'Suppliers (Dropshipping)')}
      </h3>

      {links.length > 0 ? (
        <div className={styles.supplierList}>
          {links.map(l => (
            <div key={l.id} className={styles.supplierItem}>
              <span>{l.supplier_name || `Supplier #${l.supplier_id}`}</span>
              <span className={styles.supplierMeta}>
                {l.cost_price != null && `$${l.cost_price}`} {l.sku_vendor && `• SKU: ${l.sku_vendor}`}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.supplierEmpty}>{t('product.no_suppliers_linked', 'No suppliers linked')}</p>
      )}

      <div className={styles.linkForm}>
        <select value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)} className={styles.input}>
          <option value="">{t('product.select_vendor', '-- Select Vendor --')}</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name || v.store_name}</option>)}
        </select>
        <input
          className={styles.input}
          placeholder={t('product.cost_price_usd', 'Cost Price ($)')}
          type="number"
          step="0.01"
          value={costPrice}
          onChange={e => setCostPrice(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder={t('product.vendor_sku', 'Vendor SKU')}
          value={vendorSku}
          onChange={e => setVendorSku(e.target.value)}
        />
        <button type="button" onClick={handleLink} disabled={linking} className={styles.linkBtn}>
          <Plus size={14} /> {linking ? t('product.linking', 'Linking...') : t('product.add_link', 'Add Link')}
        </button>
      </div>
    </div>
  );
}
