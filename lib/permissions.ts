export type Permission = 
  | "manage:users"
  | "manage:roles"
  | "manage:plans"
  | "manage:billing"
  | "manage:storage"
  | "manage:uploads"
  | "manage:api"
  | "manage:analytics"
  | "manage:settings"
  | "manage:audit"
  | "manage:organizations";

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    "manage:users",
    "manage:roles",
    "manage:plans",
    "manage:billing",
    "manage:storage",
    "manage:uploads",
    "manage:api",
    "manage:analytics",
    "manage:settings",
    "manage:audit",
    "manage:organizations"
  ],
  ADMIN: [
    "manage:users",
    "manage:plans",
    "manage:storage",
    "manage:uploads",
    "manage:analytics",
  ],
  SUPPORT: [
    "manage:users",
    "manage:uploads"
  ],
  MODERATOR: [
    "manage:uploads"
  ],
  BILLING_MANAGER: [
    "manage:plans",
    "manage:billing"
  ],
  READ_ONLY: [
    // Read actions could be split, but for simplicity we rely on page-level access vs action-level access
  ],
  USER: []
};

/**
 * Validates if a user role has the required permission.
 * If the role has custom permissions defined in DB, those should be checked instead.
 */
export function hasPermission(role: string, customPermissions: string | null, requiredPermission: Permission): boolean {
  if (role === "SUPER_ADMIN") return true;
  
  if (customPermissions) {
    try {
      const parsed = JSON.parse(customPermissions) as Permission[];
      return parsed.includes(requiredPermission);
    } catch {
      return false;
    }
  }

  const defaultPerms = ROLE_PERMISSIONS[role] || [];
  return defaultPerms.includes(requiredPermission);
}
