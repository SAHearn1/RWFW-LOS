"use client";

import { useEffect, useState } from "react";

import type { UserRecord } from "@/lib/licensing/types";

const ROLE_BADGE: Record<string, string> = {
  student_independent: "bg-sky-100 text-sky-800",
  student_enrolled: "bg-blue-100 text-blue-800",
  adult_learner: "bg-teal-100 text-teal-800",
  teacher: "bg-amber-100 text-amber-800",
  professional_development: "bg-purple-100 text-purple-800",
  admin: "bg-slate-200 text-slate-700",
  super_admin: "bg-red-100 text-red-800",
};

export default function UserRoster() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 data-tour="page-title" className="text-xl font-semibold text-slate-800">
            User Roster
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            All platform accounts. Role changes are applied via Teacher Assignment.
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
