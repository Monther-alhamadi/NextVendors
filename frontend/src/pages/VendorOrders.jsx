import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMyOrders, updateOrderFulfillment } from "../services/supplierService";
import { useToast } from "../components/common/ToastProvider";
import Skeleton from "../components/common/Skeleton";
import { PackageOpen, Truck, CheckCircle, Clock, LayoutGrid, List, MapPin } from "lucide-react";
import s from "./VendorOrders.module.css";

export default function VendorOrders() {
  const { t } = useTranslation();
  const toast = useToast();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" or "list"

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await getMyOrders();
      setOrders(data || []);
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error', 'حدث خطأ'), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(foId, newStatus, tracking = null) {
    if (!window.confirm(`تأكيد تغيير الحالة إلى ${t(`orders.status_${newStatus}`, newStatus)}?`)) return;
    setUpdating(foId);
    try {
      await updateOrderFulfillment(foId, { status: newStatus, tracking_number: tracking });
      toast.push({ message: t('common.save_success', 'تم الحفظ بنجاح'), type: "success" });
      setOrders(orders.map(o => 
         o.id === foId ? { ...o, status: newStatus, tracking_number: tracking || o.tracking_number } : o
      ));
    } catch (e) {
      toast.push({ message: t('common.error', 'حدث خطأ'), type: "error" });
    } finally {
      setUpdating(null);
    }
  }

  // Calculate stats for columns
  const getColOrders = (status) => orders.filter(o => o.status === status);
  const pending = getColOrders('pending');
  const processing = getColOrders('processing');
  const shipped = getColOrders('shipped');
  const completed = getColOrders('completed');

  const getStatusConfig = (status) => {
    switch(status) {
      case 'pending': return { icon: <Clock size={18} />, colorClass: s.colPending, label: 'قيد الانتظار' };
      case 'processing': return { icon: <PackageOpen size={18} />, colorClass: s.colProcessing, label: 'قيد التجهيز' };
      case 'shipped': return { icon: <Truck size={18} />, colorClass: s.colShipped, label: 'تم الشحن' };
      case 'completed': return { icon: <CheckCircle size={18} />, colorClass: s.colCompleted, label: 'مكتمل' };
      default: return { icon: <Clock size={18} />, colorClass: s.colPending, label: status };
    }
  };

  const OrderCard = ({ order }) => (
    <div className={s.orderCard}>
      <div className={s.cardHead}>
        <span className={s.orderId}>#{order.order_id || order.id}</span>
        <span className={s.orderDate}>{new Date(order.created_at).toLocaleDateString()}</span>
      </div>

      <div className={s.customerInfo}>
        <div className={s.customerAvatar}>
           {order.shipping_address?.full_name?.charAt(0) || 'C'}
        </div>
        <div className={s.customerDetails}>
           <span className={s.customerName}>{order.shipping_address?.full_name || 'عميل'}</span>
           <span className={s.customerCity}>
             <MapPin size={10} />
             {order.shipping_address?.city || 'غير محدد'}
           </span>
        </div>
      </div>

      <div className={s.orderItems}>
        {order.items?.map((item, idx) => (
          <div key={idx} className={s.itemRow}>
            <span className={s.itemQty}>{item.quantity}x</span>
            <span className={s.itemName}>{item.product_name}</span>
          </div>
        ))}
      </div>

      <div className={s.cardActions}>
         {order.status === 'pending' && (
            <button 
              className={`${s.actionBtn} ${s.primary}`}
              onClick={() => handleStatusChange(order.id, 'processing')}
              disabled={updating === order.id}
            >
              {updating === order.id ? '...' : 'تجهيز الطلب'}
            </button>
         )}
         {order.status === 'processing' && (
            <button 
              className={`${s.actionBtn} ${s.primary}`}
              onClick={() => {
                  const track = prompt('أدخل رقم التتبع (اختياري)');
                  handleStatusChange(order.id, 'shipped', track);
              }}
              disabled={updating === order.id}
            >
              {updating === order.id ? '...' : 'شحن'}
            </button>
         )}
         {order.status === 'shipped' && (
            <button 
              className={`${s.actionBtn} ${s.primary}`}
              onClick={() => handleStatusChange(order.id, 'completed')}
              disabled={updating === order.id}
            >
              {updating === order.id ? '...' : 'اكتمال'}
            </button>
         )}
         {order.status === 'completed' && (
            <div style={{ color: 'var(--clr-green-600)', fontSize: '10px', fontWeight: 800, textAlign: 'center', width: '100%' }}>
              ✅ متوفر لدى العميل
            </div>
         )}
      </div>
    </div>
  );

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>{t('vendor.orders', 'الطلبات')}</h1>
          <p className={s.subtitle}>نظام إدارة الطلبات من التجهيز إلى الشحن.</p>
        </div>
        
        <div className={s.viewTabs}>
          <button 
            className={`${s.viewTab} ${viewMode === 'kanban' ? s.active : ''}`}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid size={16} /> لوحة كانبان
          </button>
          <button 
            className={`${s.viewTab} ${viewMode === 'list' ? s.active : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={16} /> القائمة
          </button>
        </div>
      </div>

      {loading ? (
         <div style={{ textAlign: 'center', padding: '4rem' }}>
           <div className="spinner"></div>
         </div>
      ) : viewMode === 'kanban' ? (
        <div className={s.kanbanBoard}>
          {['pending', 'processing', 'shipped', 'completed'].map(status => {
            const list = getColOrders(status);
            const config = getStatusConfig(status);
            return (
              <div key={status} className={`${s.kanbanColumn} ${config.colorClass}`}>
                <div className={s.columnHeader}>
                  <div className={s.colTitleWrap}>
                    <div className={s.colIcon}>{config.icon}</div>
                    <span className={s.colTitle}>{config.label}</span>
                  </div>
                  <span className={s.colCount}>{list.length}</span>
                </div>
                <div className={s.cardsList}>
                   {list.map(order => (
                      <OrderCard key={order.id} order={order} />
                   ))}
                   {list.length === 0 && (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        لا يوجد طلبات هنا
                      </div>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={s.listViewWrap}>
           <table className={s.table}>
              <thead>
                <tr>
                   <th>رقم الطلب</th>
                   <th>التاريخ</th>
                   <th>العميل</th>
                   <th>المنتجات</th>
                   <th>الحالة</th>
                   <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>#{order.order_id || order.id}</td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.shipping_address?.full_name || 'عميل'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.shipping_address?.city}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                         {order.items?.map((it, idx) => (
                           <div key={idx} style={{ fontSize: '12px' }}>
                             <strong style={{ color: 'var(--primary)' }}>{it.quantity}x</strong> {it.product_name}
                           </div>
                         ))}
                      </div>
                    </td>
                    <td>
                      <span className={`${s.statusBadge} ${
                        order.status === 'pending' ? s.statusPending :
                        order.status === 'processing' ? s.statusProcessing :
                        order.status === 'shipped' ? s.statusShipped : s.statusCompleted
                      }`}>
                         {getStatusConfig(order.status).label}
                      </span>
                    </td>
                    <td>
                       {order.status === 'pending' && (
                          <button className={s.listActionBtn} onClick={() => handleStatusChange(order.id, 'processing')}>تجهيز</button>
                       )}
                       {order.status === 'processing' && (
                          <button className={s.listActionBtn} onClick={() => handleStatusChange(order.id, 'shipped')}>شحن</button>
                       )}
                       {order.status === 'shipped' && (
                          <button className={s.listActionBtn} onClick={() => handleStatusChange(order.id, 'completed')}>مكتمل</button>
                       )}
                       {order.status === 'completed' && <span>-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
}
