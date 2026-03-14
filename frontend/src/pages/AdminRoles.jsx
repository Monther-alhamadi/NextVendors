import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getRoles, getPermissions, createRole, updateRole, deleteRole } from "../services/rbacService";
import styles from "./AdminRoles.module.css";
import { Check, X, Plus, Trash2, Edit2, ShieldAlert } from "lucide-react";

export default function AdminRoles() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  
  // Matrix toggling states
  const [savingId, setSavingId] = useState(null);

  const fetchRBAC = async () => {
    try {
      setLoading(true);
      const [resRoles, resPerms] = await Promise.all([getRoles(), getPermissions()]);
      setRoles(resRoles);
      setPermissions(resPerms);
    } catch (err) {
      console.error(err);
      setError(t("admin.roles.fetch_error", "Failed to load RBAC data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRBAC();
  }, []);

  const handleTogglePermission = async (role, permSlug) => {
    if (role.name === "admin") {
      alert("Admin role has all permissions by default. You cannot modify it.");
      return;
    }

    try {
      setSavingId(role.id);
      const isEnabled = role.permissions.includes(permSlug);
      let newPermissions;
      
      if (isEnabled) {
        newPermissions = role.permissions.filter(p => p !== permSlug);
      } else {
        newPermissions = [...role.permissions, permSlug];
      }
      
      await updateRole(role.id, { name: role.name, permissions: newPermissions });
      
      // Update local state optimistic
      setRoles(prev => prev.map(r => r.id === role.id ? { ...r, permissions: newPermissions } : r));
    } catch (err) {
      alert("Failed to update permission.");
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    try {
      setSavingId("new");
      const newRole = await createRole({ name: newRoleName, description: "", permissions: [] });
      setRoles(prev => [...prev, { id: newRole.role_id, name: newRole.name, permissions: [] }]);
      setNewRoleName("");
      setIsModalOpen(false);
    } catch (err) {
      alert("Failed to create role. Name might be taken.");
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteRole = async (roleId, roleName) => {
    if (["admin", "vendor", "customer"].includes(roleName)) {
      alert("Cannot delete fundamental system roles.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the role '${roleName}'?`)) return;
    
    try {
      setSavingId(roleId);
      await deleteRole(roleId);
      setRoles(prev => prev.filter(r => r.id !== roleId));
    } catch (err) {
      alert("Failed to delete role.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="page-loading">{t("common.loading", "Loading...")}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("admin.roles.title", "إدارة الصلاحيات والأدوار")}</h1>
          <p className={styles.subtitle}>{t('auto_42bfc0', t('auto_42bfc0', 'تحكم دقيق بصلاحيات الموظفين والتجار عبر نظام RBAC المتقدم'))}</p>
        </div>
        <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>{t("admin.roles.create", "إنشاء دور جديد")}</span>
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.matrixWrapper}>
        <table className={styles.matrixTable}>
          <thead>
            <tr>
              <th className={styles.permCol}>{t("admin.roles.permission", "الصلاحية / الوظيفة")}</th>
              {roles.map(role => (
                <th key={role.id} className={styles.roleCol}>
                  <div className={styles.roleHeader}>
                    <span>{role.name}</span>
                    {!["admin", "vendor", "customer"].includes(role.name) && (
                      <button 
                        className={styles.deleteRoleBtn}
                        onClick={() => handleDeleteRole(role.id, role.name)}
                        title="Delete Role"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm) => (
              <tr key={perm.id}>
                <td className={styles.permName}>
                  <strong>{perm.name}</strong>
                  <span className={styles.permSlug}>{perm.slug}</span>
                </td>
                
                {roles.map(role => {
                  const hasPerm = role.permissions.includes(perm.slug);
                  const isAdmin = role.name === "admin";
                  const isSaving = savingId === role.id;
                  
                  return (
                    <td key={`${role.id}-${perm.id}`} className={styles.togglesCell}>
                      <button 
                        className={`${styles.toggleBtn} ${hasPerm || isAdmin ? styles.active : ''} ${isAdmin ? styles.disabled : ''}`}
                        onClick={() => handleTogglePermission(role, perm.slug)}
                        disabled={isAdmin || isSaving}
                      >
                        {hasPerm || isAdmin ? <Check size={16} /> : <X size={16} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{t("admin.roles.create_title", "إضافة دور وظيفي جديد")}</h2>
            <form onSubmit={handleCreateRole}>
              <div className={styles.formGroup}>
                <label>{t('auto_0247a9', t('auto_0247a9', 'اسم الدور (مثال: support_agent)'))}</label>
                <input 
                  type="text" 
                  value={newRoleName} 
                  onChange={(e) => setNewRoleName(e.target.value)} 
                  autoFocus
                  required 
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>{t('auto_be4b2a', t('auto_be4b2a', 'الغاء'))}</button>
                <button type="submit" className={styles.saveBtn} disabled={savingId === "new"}>{t('auto_50c642', t('auto_50c642', 'حفظ ومتابعة'))}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
