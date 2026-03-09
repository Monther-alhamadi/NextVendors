import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search, Shield, ShieldAlert,
  UserCheck, UserX, AlertOctagon, Trash2, UsersIcon
} from "lucide-react";
import {
  listUsers,
  deleteUser,
  activateUser,
  deactivateUser,
  suspendUser,
  unsuspendUser,
} from "../services/adminService";
import { assignUserRoles, getRoles } from "../services/rbacService";
import { useToast } from "../components/common/ToastProvider";
import { useConfirm } from "../components/common/ConfirmProvider";
import PageContainer from "../components/PageContainer";
import Skeleton from "../components/common/Skeleton";
import styles from "./AdminUsers.module.css";

export default function AdminUsers() {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // RBAC Assignment Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await listUsers();
      setUsers(data || []);
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error', 'حدث خطأ في جلب المستخدمين'), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const lowerSearch = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(lowerSearch) ||
      u.email?.toLowerCase().includes(lowerSearch)
    );
  });

  async function handleDelete(id) {
    const ok = await confirm(t('admin.confirm_delete_user', 'هل أنت متأكد من الحذف النهائي للمستخدم؟'));
    if (!ok) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.push({ message: t('admin.user_deleted', 'تم حذف المستخدم بنجاح'), type: "success" });
    } catch (err) {
      toast.push({ message: t('common.error', 'تعذر الحذف'), type: "error" });
    }
  }

  async function handleActivate(id) {
    try {
      await activateUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: true } : u)));
      toast.push({ message: t('admin.user_activated', 'تم تفعيل حساب المستخدم'), type: "success" });
    } catch (err) {
      toast.push({ message: t('common.error', 'حدث خطأ'), type: "error" });
    }
  }

  async function handleDeactivate(id) {
    try {
      await deactivateUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: false } : u)));
      toast.push({ message: t('admin.user_deactivated', 'تم إيقاف حساب المستخدم'), type: "success" });
    } catch (err) {
      toast.push({ message: t('common.error', 'حدث خطأ'), type: "error" });
    }
  }

  async function handleSuspend(id) {
    try {
      await suspendUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_suspended: true } : u)));
      toast.push({ message: t('admin.user_suspended', 'تم تجميد حساب المستخدم للحماية'), type: "warning" });
    } catch (err) {
      toast.push({ message: t('common.error', 'حدث خطأ'), type: "error" });
    }
  }

  async function handleUnsuspend(id) {
    try {
      await unsuspendUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_suspended: false } : u)));
      toast.push({ message: t('admin.user_unsuspended', 'تم فك التجميد عن الحساب'), type: "success" });
    } catch (err) {
      toast.push({ message: t('common.error', 'حدث خطأ'), type: "error" });
    }
  }

  async function openRoleModal(user) {
    setSelectedUser(user);
    if (availableRoles.length === 0) {
      try {
        const rolesData = await getRoles();
        setAvailableRoles(rolesData);
      } catch (e) {
        toast.push({ message: "فشل تحميل الأدوار", type: "error" });
        return;
      }
    }
    // A single role fallback logic to array mapping for existing users
    const initialRoles = user.roles ? user.roles.map(r => r.name) : [user.role];
    setUserRoles(initialRoles);
    setIsRoleModalOpen(true);
  }

  const handleRoleToggle = (roleName) => {
    setUserRoles(prev => 
      prev.includes(roleName) 
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    );
  };

  const handleSaveRoles = async () => {
    try {
      await assignUserRoles(selectedUser.id, userRoles);
      toast.push({ message: "تم تحديث أدوار المستخدم بنجاح", type: "success" });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: userRoles[0] || 'member', roles: userRoles.map(name => ({name})) } : u));
      setIsRoleModalOpen(false);
    } catch (e) {
      toast.push({ message: "حدث خطأ أثناء تعيين الصلاحيات", type: "error" });
    }
  };

  const getRoleClass = (role) => {
    switch(role?.toLowerCase()) {
      case 'admin': return styles.roleAdmin;
      case 'vendor': return styles.roleVendor;
      default: return styles.roleMember;
    }
  };

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
           <h1 className={styles.pageTitle}>{t('admin.users_title', 'قاعدة بيانات المستخدمين (CRM)')}</h1>
           <p className={styles.pageSubtitle}>{t('admin.users_subtitle', 'إدارة الحسابات والصلاحيات والحماية النظامية')}</p>
        </div>
        <div className={styles.headerActions}>
           <div className={styles.searchBox}>
             <Search size={18} color="var(--text-muted)" />
             <input
               className={styles.searchInput}
               placeholder={t('admin.search_users', 'ابحث باسم المستخدم أو الإيميل...')}
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1,2,3,4,5].map(i => <Skeleton key={i} height="60px" className="rounded-md" />)}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
             <UsersIcon size={48} className={styles.emptyIcon} />
             <p>{t('admin.no_users', 'لا يوجد مستخدمون لعرضهم.')}</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.dataGrid}>
              <thead>
                <tr>
                  <th>{t('auth.username', 'المستخدم')}</th>
                  <th>{t('admin.role', 'الصلاحيات')}</th>
                  <th>{t('admin.status', 'حالة الحساب')}</th>
                  <th style={{ textAlign: 'left' }}>{t('common.actions', 'الإجراءات')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>
                            {u.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>{u.username}</span>
                          <span className={styles.userEmail}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.roleBadge} ${getRoleClass(u.role)}`}>
                        {u.role === 'admin' ? (
                          <><Shield size={12} style={{display:'inline', marginRight:'2px'}}/> {t('profile.admin', 'مشرف')}</>
                        ) : u.role === 'vendor' ? (
                          <>{t('admin.vendor', 'تاجر')}</>
                        ) : (
                          <>{t('profile.member', 'عضو')}</>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className={styles.statusCol}>
                        <span className={`${styles.statusBadge} ${u.is_active ? styles.statusActive : styles.statusInactive}`}>
                          {u.is_active ? t('admin.active', 'نشط') : t('admin.inactive', 'غير نشط')}
                        </span>
                        {u.is_suspended && (
                          <span className={`${styles.statusBadge} ${styles.statusSuspended}`}>
                            <ShieldAlert size={10} style={{display:'inline', marginRight:'2px'}}/> {t('admin.suspended', 'موقوف أمنياً')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                        <button
                          className={`${styles.iconBtn} ${styles.actionRoleBtn}`}
                          onClick={() => openRoleModal(u)}
                          title="تعديل الصلاحيات والأدوار (RBAC)"
                          style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                        >
                          <ShieldAlert size={16} />
                        </button>

                        {u.is_active ? (
                          <button
                            className={styles.iconBtn}
                            onClick={() => handleDeactivate(u.id)}
                            title={t('admin.deactivate', 'إلغاء التنشيط')}
                          >
                            <UserX size={16} />
                          </button>
                        ) : (
                          <button
                            className={`${styles.iconBtn} ${styles.actionActivateBtn}`}
                            onClick={() => handleActivate(u.id)}
                            title={t('admin.activate', 'تنشيط')}
                          >
                            <UserCheck size={16} />
                          </button>
                        )}

                        {u.is_suspended ? (
                          <button
                            className={`${styles.iconBtn} ${styles.actionWarningBtn}`}
                            onClick={() => handleUnsuspend(u.id)}
                            title={t('admin.unsuspend', 'فك التعليق الأمني')}
                          >
                            <Shield size={16} />
                          </button>
                        ) : (
                          <button
                            className={styles.iconBtn}
                            onClick={() => handleSuspend(u.id)}
                            title={t('admin.suspend', 'تعليق أمني للحساب')}
                          >
                            <AlertOctagon size={16} />
                          </button>
                        )}
                        
                        <button
                          className={`${styles.iconBtn} ${styles.actionSuspendBtn}`}
                          onClick={() => handleDelete(u.id)}
                          title={t('admin.delete', 'حذف نهائي')}
                          disabled={u.role === "admin"}
                          style={{ opacity: u.role === 'admin' ? 0.3 : 1, cursor: u.role === 'admin' ? 'not-allowed' : 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isRoleModalOpen && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>تعيين الأدوار والصلاحيات</h2>
            <p style={{marginBottom: '1rem', color: 'var(--text-muted)'}}>
              المستخدم: <strong>{selectedUser.username}</strong>
            </p>
            <div className={styles.rolesList}>
              {availableRoles.map(role => (
                <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={userRoles.includes(role.name)}
                    onChange={() => handleRoleToggle(role.name)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>{role.name}</span>
                </label>
              ))}
            </div>
            <div className={styles.modalActions} style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsRoleModalOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>الغاء</button>
              <button onClick={handleSaveRoles} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>حفظ التعديلات</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
