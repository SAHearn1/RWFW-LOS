"use client";

import { useState, useEffect } from "react";
import {
  readAllTenants,
  createTrial,
  upsertTenant,
  deleteTenant,
  syncTenantStatuses,
} from "@/lib/licensing/store";
import type { LicenseTenant, LicenseType } from "@/lib/licensing/types";

const TYPE_BADGE: Record<LicenseType, string> = {
  trial: "bg-amber-100 text-amber-800",
  institutional: "bg-sky-100 text-sky-800",
  enterprise: "bg-purple-100 text-purple-800",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-700",
  suspended: "bg-slate-200 text-slate-600",
};

function buildTrialForm() {
  return { institutionName: "", contactEmail: "", durationDays: "30", seatCount: "50", notes: "" };
}

function buildLicenseForm() {
  return { name: "", type: "institutional" as LicenseType, seatCount: "100", expiresAtIso: "", contactEmail: "", notes: "" };
}

export default function LicenseManager() {
  const [tenants, setTenants] = useState<LicenseTenant[]>([]);
  const [tab, setTab] = useState<"list" | "trial" | "license">("list");
  const [trialForm, setTrialForm] = useState(buildTrialForm());
  const [licenseForm, setLicenseForm] = useState(buildLicenseForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    syncTenantStatuses();
    setTenants(readAllTenants());
  }, []);

  function handleCreateTrial() {
    setError("");
    setSuccess("");
    if (!trialForm.institutionName.trim() || !trialForm.contactEmail.trim()) {
      setError("Institution name and contact email are required.");
      return;
    }
    createTrial(
      {
        institutionName: trialForm.institutionName.trim(),
        contactEmail: trialForm.contactEmail.trim(),
        durationDays: parseInt(trialForm.durationDays, 10) || 30,
        seatCount: parseInt(trialForm.seatCount, 10) || 50,
        notes: trialForm.notes.trim(),
      },
      "super_admin_session"
    );
    setTenants(readAllTenants());
    setTrialForm(buildTrialForm());
    setSuccess(`Trial created for ${trialForm.institutionName}.`);
    setTab("list");
  }

  function handleCreateLicense() {
    setError("");
    setSuccess("");
    if (!licenseForm.name.trim() || !licenseForm.contactEmail.trim()) {
      setError("Institution name and contact email are required.");
      return;
    }
    const now = new Date().toISOString();
    const tenant: LicenseTenant = {
      id: `tenant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: licenseForm.name.trim(),
      type: licenseForm.type,
      status: "active",
      startsAtIso: now,
      expiresAtIso: licenseForm.expiresAtIso.trim() || null,
      seatCount: parseInt(licenseForm.seatCount, 10) || 100,
      localAdminUserId: null,
      contactEmail: licenseForm.contactEmail.trim(),
      notes: licenseForm.notes.trim(),
      createdAtIso: now,
      createdBySuperAdminId: "super_admin_session",
    };
    upsertTenant(tenant);
    setTenants(readAllTenants());
    setLicenseForm(buildLicenseForm());
    setSuccess(`License created for ${tenant.name}.`);
    setTab("list");
  }

  function handleSuspend(id: string) {
    const t = tenants.find((x) => x.id === id);
    if (!t) return;
    upsertTenant({ ...t, status: "suspended" });
    setTenants(readAllTenants());
  }

  function handleDelete(id: string) {
    deleteTenant(id);
    setTenants(readAllTenants());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 data-tour="page-title" className="text-xl font-semibold text-slate-800">
          License Manager
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create trial periods, issue institutional or enterprise licenses, and manage seat allocations.
        </p>
      </div>

      <div className="flex gap-2">
        {(["list", "trial", "license"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(""); setSuccess(""); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t === "list" ? "All Licenses" : t === "trial" ? "+ New Trial" : "+ New License"}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      {tab === "list" && (
        <>
          {tenants.length === 0 ? (
            <p className="text-sm text-slate-400">No licenses created yet. Use &quot;+ New Trial&quot; or &quot;+ New License&quot; to add one.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Institution</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Seats</th>
                    <th className="px-4 py-3 text-left">Expires</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[t.type]}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[t.status] ?? ""}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{t.seatCount}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {t.expiresAtIso ? t.expiresAtIso.slice(0, 10) : "Perpetual"}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        {t.status === "active" && (
                          <button
                            onClick={() => handleSuspend(t.id)}
                            className="rounded px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "trial" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-amber-900">New Trial Account</h2>
          <p className="mt-1 text-xs text-amber-700">Trial accounts expire automatically after the specified duration.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-amber-800">Institution Name *</label>
              <input
                className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Lincoln Middle School"
                value={trialForm.institutionName}
                onChange={(e) => setTrialForm({ ...trialForm, institutionName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-amber-800">Contact Email *</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="principal@lincoln.edu"
                value={trialForm.contactEmail}
                onChange={(e) => setTrialForm({ ...trialForm, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-amber-800">Duration (days)</label>
              <input
                type="number"
                min={1}
                max={365}
                className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={trialForm.durationDays}
                onChange={(e) => setTrialForm({ ...trialForm, durationDays: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-amber-800">Seat Count</label>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={trialForm.seatCount}
                onChange={(e) => setTrialForm({ ...trialForm, seatCount: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-amber-800">Notes</label>
              <input
                className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="e.g. referred by district pilot program"
                value={trialForm.notes}
                onChange={(e) => setTrialForm({ ...trialForm, notes: e.target.value })}
              />
            </div>
          </div>
          <button
            onClick={handleCreateTrial}
            className="mt-4 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Create Trial
          </button>
        </div>
      )}

      {tab === "license" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">New Institutional / Enterprise License</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600">Institution Name *</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Westside School District"
                value={licenseForm.name}
                onChange={(e) => setLicenseForm({ ...licenseForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">License Type</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={licenseForm.type}
                onChange={(e) => setLicenseForm({ ...licenseForm, type: e.target.value as LicenseType })}
              >
                <option value="institutional">Institutional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Contact Email *</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="admin@district.gov"
                value={licenseForm.contactEmail}
                onChange={(e) => setLicenseForm({ ...licenseForm, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Seat Count</label>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={licenseForm.seatCount}
                onChange={(e) => setLicenseForm({ ...licenseForm, seatCount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Expiry Date (leave blank = perpetual)</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={licenseForm.expiresAtIso}
                onChange={(e) => setLicenseForm({ ...licenseForm, expiresAtIso: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Notes</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="e.g. annual renewal, PO #4521"
                value={licenseForm.notes}
                onChange={(e) => setLicenseForm({ ...licenseForm, notes: e.target.value })}
              />
            </div>
          </div>
          <button
            onClick={handleCreateLicense}
            className="mt-4 rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >
            Create License
          </button>
        </div>
      )}
    </div>
  );
}
