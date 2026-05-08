import { router } from "expo-router";
import type { UserRole } from "../types";

/**
 * Return the home route path for a set of roles.
 * Safe to use inside <Redirect href={...} /> (no side effects).
 */
export function getHomeRoute(roles: UserRole[] | string[]): string {
  if (!roles || roles.length === 0) return "/(auth)/login";

  if (roles.includes("SUPER_ADMIN") || roles.includes("SUPERADMIN") || roles.includes("TENANT_ADMIN")) {
    return "/(app)/(admin)/tenants";
  } else if (roles.includes("COMMUNITY_ADMIN")) {
    // Community Admin → Admin panel (community-scoped view, not FM operational panel)
    return "/(app)/(admin)/overview";
  } else if (roles.includes("FM")) {
    return "/(app)/(fm)/dashboard";
  } else if (roles.includes("TECHNICIAN")) {
    return "/(app)/(technician)/tasks";
  } else if (roles.includes("GUARD")) {
    return "/(app)/(guard)/gate";
  } else if (roles.includes("RESIDENT")) {
    return "/(app)/(resident)/home";
  } else {
    // If no supported roles, fallback to login to avoid infinite redirect loops
    return "/(auth)/login";
  }
}

/**
 * After successful login, navigate to the correct home screen based on role.
 * Defined by phases-index.md Role → Home Screen Mapping table.
 */
export function routeByRole(roles: UserRole[]): void {
  router.replace(getHomeRoute(roles) as any);
}
