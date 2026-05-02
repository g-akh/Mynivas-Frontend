import { router } from "expo-router";
import type { UserRole } from "../types";

/**
 * After successful login, navigate to the correct home screen based on role.
 * Defined by phases-index.md Role → Home Screen Mapping table.
 */
export function routeByRole(roles: UserRole[]): void {
  if (roles.includes("SUPER_ADMIN") || roles.includes("TENANT_ADMIN")) {
    router.replace("/(app)/(admin)/tenants" as any);
  } else if (
    roles.includes("COMMUNITY_ADMIN") ||
    roles.includes("FM")
  ) {
    router.replace("/(app)/(fm)/dashboard" as any);
  } else if (roles.includes("TECHNICIAN")) {
    router.replace("/(app)/(technician)/tasks" as any);
  } else if (roles.includes("GUARD")) {
    router.replace("/(app)/(guard)/gate" as any);
  } else {
    router.replace("/(app)/(resident)/home" as any);
  }
}
