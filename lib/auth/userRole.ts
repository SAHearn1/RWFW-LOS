import { APP_ROLES, type AppRole } from "./roles";

export function parseAppRole(value: unknown): AppRole | null {
  if (typeof value !== "string") {
    return null;
  }

  return APP_ROLES.includes(value as AppRole) ? (value as AppRole) : null;
}
