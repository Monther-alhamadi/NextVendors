import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Search, Plus, MoreVertical, Edit2, Trash2, CheckCircle, 
  XOctagon, Package, Filter, Download 
} from "lucide-react";
import { adminGetPendingProducts, listProducts, deleteProduct, adminReviewProduct } from "../services/productService";
import { useToast } from "../components/common/ToastProvider";
import { useConfirm } from "../components/common/ConfirmProvider";
import PageContainer from "../components/PageContainer";
import Skeleton from "../components/common/Skeleton";
import styles from "./AdminProducts.module.css";

export default function AdminProducts() {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  
  const [activeTab, setActiveTab] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadProducts();
  }, [activeTab]);

  async function loadProducts() {
    setLoading(true);
    try {
      let data = [];
      if (activeTab === 'pending') {
          data = await adminGetPendingProducts().catch(() => []);
      } else {
          const res = await listProducts("", 100).catch(() => ({ products: [] }));
          data = res?.products || res || [];
      }
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error_loading_data'), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name?.toLowerCase().includes(lowerQuery) || 
      p.id?.toString().includes(lowerQuery) ||
      p.store?.name?.toLowerCase().includes(lowerQuery)
    );
  }, [products, searchQuery]);

  async function handleDelete(id) {
    const ok = await confirm(t('admin.confirm_delete_product'));
    if (!ok) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.push({ message: t('common.delete_success'), type: "success" });
    } catch (err) {
      toast.push({ message: t('common.error'), type: "error" });
    }
  }

  async function handleModeration(id, status, reason = null) {
      try {
          await adminReviewProduct(id, status, reason);
          toast.push({ message: t('common.save_success'), type: "success" });
          setRejectModal(null);
          setRejectReason("");
          loadProducts(); 
      } catch (e) {
          toast.push({ message: t('common.error'), type: "error" });
      }
  }

  const getStatusBadge = (product) => {
    if (activeTab === 'pending') {
      return <span className={`${styles.statusBadge} ${styles.statusPending}`}>{t('admin.status_in_review')}</span>;
    }
    if (product.moderation_status === 'rejected') {
      return (
        <div>
          <span className={`${styles.statusBadge} ${styles.statusRejected}`}>{t("admin.status_rejected")}</span>
          {product.rejection_reason && <span className={styles.rejectedReason}>{product.rejection_reason}</span>}
        </div>
      );
    }
    if (product.status === 'active' || product.status === 'published') {
      return <span className={`${styles.statusBadge} ${styles.statusActive}`}>{t('admin.status_active')}</span>;
    }
    return <span className={`${styles.statusBadge} ${styles.statusDraft}`}>{t('product.status_draft')}</span>;
  };

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
           <h1 className={styles.pageTitle}>{t('admin.manage_products')}</h1>
           <p className={styles.pageSubtitle}>{t("admin.products_desc_2")}</p>
        </div>
        <Link to="/admin/products/new" className={styles.primaryBtn}>
          <Plus size={18} />
          {t('admin.create_product')}
        </Link>
      </div>

      <div className={styles.tabsContainer}>
          <button
             onClick={() => setActiveTab("all")}
             className={`${styles.tabBtn} ${activeTab === "all" ? styles.active : ''}`}
          >
              <Package size={16} />
              {t('admin.all_products')}
          </button>
          <button
             onClick={() => setActiveTab("pending")}
             className={`${styles.tabBtn} ${activeTab === "pending" ? styles.active : ''}`}
          >
              <Filter size={16} />
              {t('admin.pending_approval')} 
              {products.length > 0 && activeTab === "pending" && <span className={styles.badge}>{products.length}</span>}
          </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.toolbar} style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
           <div className={styles.searchBox}>
               <Search size={18} color="var(--text-muted)" />
               <input 
                  type="text" 
                  className={styles.searchInput}
                  placeholder={t('admin.search_products')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
           </div>
           <div className={styles.filters}>
              <button className={styles.filterBtn}>
                 <Download size={16} /> {t("admin.export")}
              </button>
           </div>
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1,2,3,4,5].map(i => <Skeleton key={i} height="60px" className="rounded-md" />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={styles.emptyState}>
               <Package size={48} className={styles.emptyIcon} />
               <p>{t('common.no_products')}</p>
            </div>
          ) : (
            <table className={styles.dataGrid}>
              <thead>
                <tr>
                  <th>{t('admin.col_product')}</th>
                  <th>{t("admin.col_store_vendor")}</th>
                  <th>{t("product.price")}</th>
                  <th>{t("common.status")}</th>
                  <th style={{ textAlign: 'left' }}>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.productCell}>
                          <img 
                            src={p.images?.[0]?.url || "/placeholder.png"} 
                            className={styles.productImg} 
                            alt={p.name}
                            onError={(e) => { e.target.src = '/placeholder.png' }}
                          />
                          <div className={styles.productInfo}>
                              <div className={styles.productName}>{p.name}</div>
                              <div className={styles.productMeta}>ID: {p.id}</div>
                          </div>
                      </div>
                    </td>
                    <td>
                        {p.store ? (
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.store.name}</span>
                        ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                    </td>
                    <td>
                        <span className={styles.price}>{p.price?.toLocaleString()} {t('common.currency')}</span>
                    </td>
                    <td>
                        {getStatusBadge(p)}
                    </td>
                    <td>
                       <div className={styles.actions}>
                           {activeTab === 'pending' ? (
                               <>
                                  <button onClick={() => handleModeration(p.id, "approved")} className={`${styles.iconBtn} ${styles.approveBtn}`} title={t("admin.action_approve_direct")}>
                                      <CheckCircle size={18} />
                                  </button>
                                  <button onClick={() => setRejectModal(p)} className={`${styles.iconBtn} ${styles.deleteBtn}`} title={t("admin.action_reject")}>
                                      <XOctagon size={18} />
                                  </button>
                               </>
                           ) : (
                               <>
                                  <Link to={`/admin/products/${p.id}`} className={`${styles.iconBtn} ${styles.editBtn}`} title={t("admin.action_edit_deep")}>
                                      <Edit2 size={18} />
                                  </Link>
                                  <button onClick={() => handleDelete(p.id)} className={`${styles.iconBtn} ${styles.deleteBtn}`} title={t("admin.action_delete_full")}>
                                      <Trash2 size={18} />
                                  </button>
                               </>
                           )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {rejectModal && (
          <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                  <h3 className={styles.modalTitle}>{t("admin.reject_product")} {rejectModal.name}</h3>
                  <textarea 
                     className={styles.modalInput}
                     value={rejectReason}
                     onChange={e => setRejectReason(e.target.value)}
                     placeholder={t("admin.reject_reason_ph")}
                     autoFocus
                  />
                  <div className={styles.modalActions}>
                      <button className={styles.cancelBtn} onClick={() => setRejectModal(null)}>{t("common.cancel")}</button>
                      <button className={styles.confirmRejectBtn} onClick={() => handleModeration(rejectModal.id, "rejected", rejectReason)}>{t("admin.confirm_reject")}</button>
                  </div>
              </div>
          </div>
      )}
    </PageContainer>
  );
}
