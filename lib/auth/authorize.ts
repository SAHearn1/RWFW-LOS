/**
 * Centralized authorization helper for API route handlers.
 *
 * All API routes should call authorize() before accessing data. This ensures:
 *   - Role check against the declared allowed roles
 *   - Audit log entry on every denial (catches privilege escalation attempts)
 *   - Consistent 401/403 response shape with trace ID propagation
 *
 * Usage:
 *   const authResult = authorize(user, ["admin", "super_admin"], { traceId, route: "/api/..." });
 *   if (!authResult.ok) return authResult.response;
 *   const { role, userId, orgId } = authResult;
 */

import type { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { recordAuditEvent } from "@/lib/observability/audit";
import { TRACE_HEADER } from "@/lib/observability/trace";
import type { AppRole } from "./roles";
import { parseAppRole } from "./userRole";

// Derive the Clerk user type from the currentUser return type to avoid
// depending on @clerk/backend internal exports.
type ClerkUser = Awaited<ReturnType<typeof currentUser>>;

export type AuthorizeOptions = {
  /** Trace ID for request correlation */
  traceId: string;
  /** Route path for audit log (e.g. "/api/governance/operability") */
  route: string;
  /** When true, a non-null orgId must be provided for authorization to pass */
  requireOrg?: boolean;
  /** Optional orgId — pass when available from auth() or the Clerk session */
  orgId?: string | null;
};

export type AuthorizeOk = {
  ok: true;
  role: AppRole;
  userId: string;
  orgId: string | undefined;
};

export type AuthorizeDenied = {
  ok: false;
  reason: "unauthenticated" | "no_role" | "role_not_allowed" | "org_required";
  response: Response;
};

export type AuthorizeResult = AuthorizeOk | AuthorizeDenied;

/**
 * Authorize an API route request.
 *
 * @param user       - Clerk user from currentUser(). Pass null if unauthenticated.
 * @param allowedRoles - Roles permitted for this operation.
 * @param options    - Trace, route label, and optional org requirement.
 *
 * @returns AuthorizeOk with resolved role/userId/orgId, or AuthorizeDenied with
 *          a ready-to-return Response on failure.
 */
export function authorize(
  user: ClerkUser,
  allowedRoles: readonly AppRole[],
  options: AuthorizeOptions
): AuthorizeResult {
  const { traceId, route } = options;
  const orgId = options.orgId ?? undefined;

  if (!user) {
    recordAuditEvent({
      traceId,
      eventType: "api.auth.denied",
      role: "unauthenticated",
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: { route, reason: "unauthenticated" }
    });

    return {
      ok: false,
      reason: "unauthenticated",
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401, headers: { [TRACE_HEADER]: traceId } }
      )
    };
  }

  const role = parseAppRole(user.publicMetadata?.role);

  if (!role) {
    recordAuditEvent({
      traceId,
      eventType: "api.auth.denied",
      role: "none",
      actorId: user.id,
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: { route, reason: "no_valid_role" }
    });

    return {
      ok: false,
      reason: "no_role",
      response: NextResponse.json(
        { error: "No valid role assigned to this account." },
        { status: 403, headers: { [TRACE_HEADER]: traceId } }
      )
    };
  }

  if (!allowedRoles.includes(role)) {
    recordAuditEvent({
      traceId,
      eventType: "api.auth.denied",
      role,
      actorId: user.id,
      orgId,
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: { route, reason: "role_not_allowed", allowedRoles: [...allowedRoles] }
    });

    return {
      ok: false,
      reason: "role_not_allowed",
      response: NextResponse.json(
        { error: `Role '${role}' is not permitted for this endpoint.` },
        { status: 403, headers: { [TRACE_HEADER]: traceId } }
      )
    };
  }

  if (options.requireOrg && !orgId) {
    recordAuditEvent({
      traceId,
      eventType: "api.auth.denied",
      role,
      actorId: user.id,
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: { route, reason: "org_required" }
    });

    return {
      ok: false,
      reason: "org_required",
      response: NextResponse.json(
        { error: "Organization membership required for this endpoint." },
        { status: 403, headers: { [TRACE_HEADER]: traceId } }
      )
    };
  }

  return { ok: true, role, userId: user.id, orgId };
}
