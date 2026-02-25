// In-memory role sync registry.
// Populated by Clerk webhook events (user.created, user.updated).
// Production: replace with Vercel KV or DB lookup.

import { parseAppRole } from "./userRole";
import type { AppRole } from "./roles";

const registry = new Map<string, AppRole>();

export function syncRoleFromWebhook(userId: string, rawRole: unknown): void {
  const role = parseAppRole(rawRole);
  if (role) {
    registry.set(userId, role);
  }
}

export function getRoleFromRegistry(userId: string): AppRole | null {
  return registry.get(userId) ?? null;
}

export function registrySize(): number {
  return registry.size;
}
