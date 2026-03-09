import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download, ShoppingBag, Box, CheckCircle, XCircle, Search, Eye, Filter } from "lucide-react";
import api from "../services/api";
import PageContainer from "../components/PageContainer";
import Skeleton from "../components/common/Skeleton";
import { useToast } from "../components/common/ToastProvider";
import styles from "./AdminOrders.module.css";

export default function AdminOrders() {
  const { t } = useTranslation();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    user_id: "",
    vendor_id: "",
    date_from: "",
    date_to: ""
  });

  useEffect(() => {
    // Debounce or load directly
    const timer = setTimeout(() => loadOrders(), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  async function loadOrders() {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.user_id) queryParams.append("user_id", filters.user_id);
      if (filters.vendor_id) queryParams.append("vendor_id", filters.vendor_id);
      if (filters.date_from) queryParams.append("date_from", filters.date_from);
      if (filters.date_to) queryParams.append("date_to", filters.date_to);

      const res = await api.get(`/admin/orders/?${queryParams.toString()}`);
      setOrders(res.data || []);
    } catch (e) {
      toast.push({ message: t("common.error_loading_data", "فشل تحميل الطلبات"), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedOrders.length === 0) return;
    try {
      await api.post("/admin/orders/bulk-status", {
        order_ids: selectedOrders,
        status: newStatus
      });
      toast.push({ message: t("admin.bulk_update_success", "تم التحديث بنجاح"), type: "success" });
      setSelectedOrders([]);
      loadOrders();
    } catch (e) {
      toast.push({ message: t("common.error", "حدث خطأ"), type: "error" });
    }
  };

  const toggleSelectOrder = (id) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "Customer", "Date", "Status", "Total"];
    const rows = orders.map(o => [
      o.id,
      o.user_id,
      new Date(o.created_at).toLocaleDateString(),
      o.status,
      o.total_amount
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const getStatusClass = (status) => {
      switch(status?.toLowerCase()) {
          case 'pending': return styles.statusPending;
          case 'paid': return styles.statusPaid;
          case 'shipped': return styles.statusShipped;
          case 'completed': return styles.statusCompleted;
          case 'cancelled': return styles.statusCancelled;
          default: return styles.statusPending;
      }
  };

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t("admin.manage_orders", "إدارة الطلبات المتقدمة")}</h1>
          <p className={styles.pageSubtitle}>{t("admin.orders_overview_desc", "متابعة مسار معالجة الطلبات وإدارتها")}</p>
        </div>
        <div>
            <button onClick={exportToCSV} className={styles.primaryBtn}>
                <Download size={18} />
                {t("admin.export_csv", "تصدير لملف CSV")}
            </button>
        </div>
      </div>

      <div className={styles.filtersGrid}>
        <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t("common.status", "الحالة")}</label>
            <select 
                className={styles.filterSelect}
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
                <option value="">{t("common.all", "الكل")}</option>
                <option value="pending">{t('orders.status_pending', 'قيد الانتظار')}</option>
                <option value="paid">{t('admin.paid', 'مدفوع')}</option>
                <option value="shipped">{t('orders.status_shipped', 'مشحون')}</option>
                <option value="completed">{t('orders.status_completed', 'مكتمل')}</option>
                <option value="cancelled">{t('orders.status_cancelled', 'ملغى')}</option>
            </select>
        </div>
        <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t("admin.customer_id", "رقم العميل")}</label>
            <input 
                type="number" 
                className={styles.filterInput}
                placeholder="ID..."
                value={filters.user_id}
                onChange={(e) => setFilters({...filters, user_id: e.target.value})}
            />
        </div>
        <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t("admin.vendor_id", "رقم التاجر")}</label>
            <input 
                type="number" 
                className={styles.filterInput}
                placeholder="ID..."
                value={filters.vendor_id}
                onChange={(e) => setFilters({...filters, vendor_id: e.target.value})}
            />
        </div>
        <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t("common.from", "من تاريخ")}</label>
            <input 
                type="date" 
                className={styles.filterInput}
                value={filters.date_from}
                onChange={(e) => setFilters({...filters, date_from: e.target.value})}
            />
        </div>
        <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t("common.to", "إلى تاريخ")}</label>
            <input 
                type="date" 
                className={styles.filterInput}
                value={filters.date_to}
                onChange={(e) => setFilters({...filters, date_to: e.target.value})}
            />
        </div>
      </div>

      {selectedOrders.length > 0 && (
          <div className={styles.bulkActions}>
              <div className={styles.bulkCount}>
                  <div className={styles.countBadge}>{selectedOrders.length}</div>
                  <span>{t("admin.orders_selected", "طلبات محددة")}</span>
              </div>
              <div className={styles.bulkButtons}>
                  <button className={`${styles.btnSm} ${styles.btnShipped}`} onClick={() => handleBulkStatusUpdate("shipped")}>
                      <Box size={14} style={{display:'inline', marginRight:'4px'}}/> تحديث كمشحون
                  </button>
                  <button className={`${styles.btnSm} ${styles.btnCompleted}`} onClick={() => handleBulkStatusUpdate("completed")}>
                      <CheckCircle size={14} style={{display:'inline', marginRight:'4px'}}/> تحديث كمكتمل
                  </button>
                  <button className={`${styles.btnSm} ${styles.btnCancelled}`} onClick={() => handleBulkStatusUpdate("cancelled")}>
                      <XCircle size={14} style={{display:'inline', marginRight:'4px'}}/> إلغاء الطلبات
                  </button>
              </div>
          </div>
      )}

      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1,2,3,4].map(i => <Skeleton key={i} height="60px" className="rounded-md" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
             <ShoppingBag size={48} className={styles.emptyIcon} />
             <p>{t("admin.no_orders_found", "لم يتم العثور على أي طلبات تطابق بحثك.")}</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.dataGrid}>
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}>
                            <input 
                                type="checkbox" 
                                className={styles.checkbox}
                                checked={selectedOrders.length === orders.length && orders.length > 0}
                                onChange={toggleSelectAll}
                            />
                        </th>
                        <th>{t("common.id", "رقم الطلب")}</th>
                        <th>{t("common.customer", "العميل")}</th>
                        <th>{t("common.date", "التاريخ")}</th>
                        <th>{t("common.total", "الإجمالي")}</th>
                        <th>{t("common.status", "الحالة")}</th>
                        <th style={{ textAlign: 'left' }}>{t("common.actions", "الإجراءات")}</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td>
                                <input 
                                    type="checkbox" 
                                    className={styles.checkbox}
                                    checked={selectedOrders.includes(order.id)}
                                    onChange={() => toggleSelectOrder(order.id)}
                                />
                            </td>
                            <td>
                                <span className={styles.orderId}>#{order.id}</span>
                            </td>
                            <td>
                                <div className={styles.userInfo}>
                                    <span className={styles.userName}>مستخدم #{order.user_id}</span>
                                    {order.vendor_id && <span className={styles.userMeta}>تاجر #{order.vendor_id}</span>}
                                </div>
                            </td>
                            <td>
                                <span className={styles.date}>{new Date(order.created_at).toLocaleDateString()}</span>
                            </td>
                            <td>
                                <span className={styles.totalAmount}>{order.total_amount?.toFixed(2)} {t('common.currency', 'ر.س')}</span>
                            </td>
                            <td>
                                <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                                    {t(`orders.status_${order.status}`, order.status)}
                                </span>
                            </td>
                            <td style={{ textAlign: 'left' }}>
                                <Link to={`/admin/orders/${order.id}`} className={styles.actionLink}>
                                    <Eye size={16} />
                                    {t("common.view", "عرض التفاصيل")}
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
