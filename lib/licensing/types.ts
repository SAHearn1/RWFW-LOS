export type LicenseType = "trial" | "institutional" | "enterprise";
export type LicenseStatus = "active" | "expired" | "suspended";

export interface LicenseTenant {
  id: string;
  name: string;
  type: LicenseType;
  status: LicenseStatus;
  startsAtIso: string;
  expiresAtIso: string | null; // null = perpetual
  seatCount: number;
  localAdminUserId: string | null; // Clerk userId of delegated local admin
  contactEmail: string;
  notes: string;
  createdAtIso: string;
  createdBySuperAdminId: string;
}

export interface TeacherAssignmentRecord {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  orgId: string;
  tenantId: string | null;
  assignedBySuperId: string;
  assignedAtIso: string;
  notes: string;
}

export interface UserRecord {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  orgId: string | null;
  tenantId: string | null;
  createdAtIso: string;
}

export interface TrialConfig {
  institutionName: string;
  contactEmail: string;
  durationDays: number;
  seatCount: number;
  notes: string;
}
