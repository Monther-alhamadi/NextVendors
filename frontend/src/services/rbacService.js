import api from "./api";

export async function getPermissions() {
  const result = await api.get("/admin/rbac/permissions");
  return result.data;
}

export async function getRoles() {
  const result = await api.get("/admin/rbac/roles");
  return result.data;
}

export async function createRole(roleData) {
  // roleData: { name, description, permissions: [] }
  const result = await api.post("/admin/rbac/roles", roleData);
  return result.data;
}

export async function updateRole(roleId, roleData) {
  const result = await api.put(`/admin/rbac/roles/${roleId}`, roleData);
  return result.data;
}

export async function deleteRole(roleId) {
  const result = await api.delete(`/admin/rbac/roles/${roleId}`);
  return result.data;
}

export async function assignUserRoles(userId, roles) {
  // roles: ["admin", "support"]
  const result = await api.put(`/admin/rbac/users/${userId}/roles`, { roles });
  return result.data;
}
