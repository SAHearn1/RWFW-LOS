"use client";

import { useEffect, useState } from "react";

import type { UserRecord } from "@/lib/licensing/types";
import { APP_ROLES } from "@/lib/auth/roles";

const ROLE_BADGE: Record<string, string> = {
  student_independent: "bg-sky-100 text-sky-800",
  student_enrolled: "bg-blue-100 text-blue-800",
  adult_learner: "bg-teal-100 text-teal-800",
  teacher: "bg-amber-100 text-amber-800",
  professional_development: "bg-purple-100 text-purple-800",
  admin: "bg-slate-200 text-slate-700",
  super_admin: "bg-red-100 text-red-800",
};

// Roles that require an orgId — mirrors roles.ts ORG_REQUIRED_ROLES
const ORG_REQUIRED = new Set([
  "student_enrolled",
  "teacher",
  "professional_development",
  "admin",
  "super_admin",
]);

type EditState = {
  userId: string;
  role: string;
  orgId: string;
  saving: boolean;
  result: { type: "success" | "error"; message: string } | null;
};

export default function UserRoster() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const response = await fetch("/api/super-admin/users");
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          if (!cancelled) {
            setError(data.error ?? `API error ${response.status}`);
          }
          return;
        }
        const data = (await response.json()) as { users: UserRecord[]; total: number };
        if (!cancelled) {
          setUsers(data.users);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load users.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  function startEdit(u: UserRecord) {
    setEditing({ userId: u.userId, role: u.role, orgId: u.orgId ?? "", saving: false, result: null });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setEditing((prev) => prev ? { ...prev, saving: true, result: null } : null);

    const body: Record<string, unknown> = { userId: editing.userId, role: editing.role };
    if (ORG_REQUIRED.has(editing.role)) {
      body.orgId = editing.orgId.trim() || null;
    }

    try {
      const response = await fetch("/api/super-admin/assign-role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setEditing((prev) => prev ? { ...prev, saving: false, result: { type: "error", message: payload.error ?? `Error ${response.status}` } } : null);
        return;
      }

      // Update local list optimistically
      const newOrgId = editing.orgId.trim() || null;
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === editing.userId ? { ...u, role: editing.role, orgId: newOrgId } : u
        )
      );
      setEditing(null);
    } catch (err) {
      setEditing((prev) =>
        prev ? { ...prev, saving: false, result: { type: "error", message: err instanceof Error ? err.message : "Network error." } } : null
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 data-tour="page-title" className="text-xl font-semibold text-slate-800">
            User Roster
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            All platform accounts. Click &quot;Edit Role&quot; to change a user&apos;s role assignment.
          </p>
        </div>
        {!loading && !error && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">Loading users…</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-700">Failed to load users</p>
          <p className="mt-1 text-xs text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">No users found in this environment.</p>
        </div>
      )}

      {/* Inline role editor */}
      {editing && (
        <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-md">
          <h2 className="font-semibold text-slate-900">Edit Role</h2>
          <p className="mt-1 font-mono text-xs text-slate-500">{editing.userId}</p>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="edit-role" className="block text-xs font-medium text-slate-700">New Role</label>
              <select
                id="edit-role"
                className="mt-1 w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
                value={editing.role}
                onChange={(e) => setEditing((prev) => prev ? { ...prev, role: e.target.value, result: null } : null)}
                disabled={editing.saving}
              >
                {APP_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {ORG_REQUIRED.has(editing.role) && (
              <div>
                <label htmlFor="edit-orgid" className="block text-xs font-medium text-slate-700">
                  Organization ID (required for this role)
                </label>
                <input
                  id="edit-orgid"
                  type="text"
                  className="mt-1 w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm font-mono"
                  placeholder="org_..."
                  value={editing.orgId}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, orgId: e.target.value, result: null } : null)}
                  disabled={editing.saving}
                />
              </div>
            )}
            {editing.result && (
              <p className={`text-xs ${editing.result.type === "success" ? "text-green-700" : "text-red-600"}`}>
                {editing.result.message}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { void saveEdit(); }}
                disabled={editing.saving}
                className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {editing.saving ? "Saving…" : "Save Role"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={editing.saving}
                className="rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">Name</th>
                <th scope="col" className="px-4 py-3 text-left">Email</th>
                <th scope="col" className="px-4 py-3 text-left">Role</th>
                <th scope="col" className="px-4 py-3 text-left">Org</th>
                <th scope="col" className="px-4 py-3 text-left">Tenant</th>
                <th scope="col" className="px-4 py-3 text-left">Joined</th>
                <th scope="col" className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.userId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.fullName}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        ROLE_BADGE[u.role] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.orgId ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{u.tenantId ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{u.createdAtIso.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => startEdit(u)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Edit Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
