"use client";

import { useState, useEffect } from "react";
import { readAllTenants, upsertTenant, syncTenantStatuses } from "@/lib/licensing/store";
import type { LicenseTenant } from "@/lib/licensing/types";

export default function InstitutionPanel() {
  const [tenants, setTenants] = useState<LicenseTenant[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [adminInput, setAdminInput] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    syncTenantStatuses();
    setTenants(readAllTenants());
  }, []);

  function handleDelegateAdmin(tenantId: string) {
    const t = tenants.find((x) => x.id === tenantId);
    if (!t) return;
    upsertTenant({ ...t, localAdminUserId: adminInput.trim() || null });
    setTenants(readAllTenants());
    setEditing(null);
    setAdminInput("");
    setSuccess(`Local admin updated for ${t.name}.`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 data-tour="page-title" className="text-xl font-semibold text-slate-800">
          Institutions
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage institution accounts and delegate local admin access. Local admins can manage their
          own institution&apos;s learner and staff accounts.
        </p>
      </div>

      {success && <p className="text-sm text-green-700">{success}</p>}

      {tenants.length === 0 ? (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-400">No institutions on record.</p>
          <p className="mt-1 text-xs text-slate-400">
            Create a trial or license in License Manager to add institutions here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tenants.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">{t.name}</h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {t.type} &middot; {t.status} &middot; {t.seatCount} seats
                    {t.expiresAtIso ? ` · expires ${t.expiresAtIso.slice(0, 10)}` : " · perpetual"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Contact: {t.contactEmail}</p>
                </div>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    t.status === "active"
                      ? "bg-green-100 text-green-800"
                      : t.status === "expired"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {t.status}
                </span>
              </div>

              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Delegated Local Admin</p>
                {editing === t.id ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="Clerk user ID (usr_...) or leave blank to remove"
                      value={adminInput}
                      onChange={(e) => setAdminInput(e.target.value)}
                    />
                    <button
                      onClick={() => handleDelegateAdmin(t.id)}
                      className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditing(null); setAdminInput(""); }}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      {t.localAdminUserId ? (
                        <span className="font-mono text-xs">{t.localAdminUserId}</span>
                      ) : (
                        <span className="text-slate-400">None assigned</span>
                      )}
                    </p>
                    <button
                      onClick={() => { setEditing(t.id); setAdminInput(t.localAdminUserId ?? ""); }}
                      className="text-xs text-slate-500 underline hover:text-slate-700"
                    >
                      {t.localAdminUserId ? "Change" : "Assign"}
                    </button>
                  </div>
                )}
              </div>

              {t.notes && (
                <p className="mt-3 text-xs text-slate-400">Notes: {t.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Delegation Rules</p>
        <ul className="mt-2 space-y-1 text-xs text-slate-500">
          <li>• Local Admins can add/remove learner and staff accounts within their institution only.</li>
          <li>• Local Admins <strong>cannot</strong> assign the Teacher role — that authority remains with Super Admin.</li>
          <li>• Removing a Local Admin assignment does not delete the user account.</li>
        </ul>
      </div>
    </div>
  );
}
