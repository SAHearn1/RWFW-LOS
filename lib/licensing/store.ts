import type { LicenseTenant, LicenseType, TeacherAssignmentRecord, TrialConfig } from "./types";

const TENANTS_KEY = "rootwork.licensing.tenants";
const TEACHERS_KEY = "rootwork.licensing.teachers";

function loadFromStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage unavailable — degrade silently
  }
}

// --- License Tenant Store ---

export function readAllTenants(): LicenseTenant[] {
  return loadFromStorage<LicenseTenant>(TENANTS_KEY);
}

export function upsertTenant(tenant: LicenseTenant): void {
  const all = readAllTenants();
  const idx = all.findIndex((t) => t.id === tenant.id);
  if (idx === -1) {
    all.push(tenant);
  } else {
    all[idx] = tenant;
  }
  saveToStorage(TENANTS_KEY, all);
}

export function deleteTenant(id: string): void {
  const all = readAllTenants().filter((t) => t.id !== id);
  saveToStorage(TENANTS_KEY, all);
}

export function getTenantById(id: string): LicenseTenant | null {
  return readAllTenants().find((t) => t.id === id) ?? null;
}

export function createTrial(config: TrialConfig, createdBySuperAdminId: string): LicenseTenant {
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + config.durationDays);

  const tenant: LicenseTenant = {
    id: `tenant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: config.institutionName,
    type: "trial" as LicenseType,
    status: "active",
    startsAtIso: now.toISOString(),
    expiresAtIso: expires.toISOString(),
    seatCount: config.seatCount,
    localAdminUserId: null,
    contactEmail: config.contactEmail,
    notes: config.notes,
    createdAtIso: now.toISOString(),
    createdBySuperAdminId,
  };
  upsertTenant(tenant);
  return tenant;
}

export function syncTenantStatuses(): void {
  const now = new Date().toISOString();
  const all = readAllTenants().map((t) => {
    if (t.status === "active" && t.expiresAtIso && t.expiresAtIso < now) {
      return { ...t, status: "expired" as const };
    }
    return t;
  });
  saveToStorage(TENANTS_KEY, all);
}

// --- Teacher Assignment Store ---

export function readAllTeacherAssignments(): TeacherAssignmentRecord[] {
  return loadFromStorage<TeacherAssignmentRecord>(TEACHERS_KEY);
}

export function upsertTeacherAssignment(record: TeacherAssignmentRecord): void {
  const all = readAllTeacherAssignments();
  const idx = all.findIndex((r) => r.userId === record.userId);
  if (idx === -1) {
    all.push(record);
  } else {
    all[idx] = record;
  }
  saveToStorage(TEACHERS_KEY, all);
}

export function revokeTeacherAssignment(userId: string): void {
  const all = readAllTeacherAssignments().filter((r) => r.userId !== userId);
  saveToStorage(TEACHERS_KEY, all);
}
