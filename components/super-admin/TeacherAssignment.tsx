"use client";

import { useState } from "react";
import { readAllTeacherAssignments, upsertTeacherAssignment, revokeTeacherAssignment } from "@/lib/licensing/store";
import type { TeacherAssignmentRecord } from "@/lib/licensing/types";

function buildEmptyForm() {
  return { userId: "", email: "", fullName: "", orgId: "", tenantId: "", notes: "" };
}

export default function TeacherAssignment() {
  const [assignments, setAssignments] = useState<TeacherAssignmentRecord[]>(() =>
    readAllTeacherAssignments()
  );
  const [form, setForm] = useState(buildEmptyForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleAssign() {
    setError("");
    setSuccess("");
    if (!form.userId.trim() || !form.email.trim() || !form.orgId.trim()) {
      setError("User ID, email, and org are required.");
      return;
    }
    const record: TeacherAssignmentRecord = {
      id: `ta_${Date.now()}`,
      userId: form.userId.trim(),
      email: form.email.trim(),
      fullName: form.fullName.trim(),
      orgId: form.orgId.trim(),
      tenantId: form.tenantId.trim() || null,
      assignedBySuperId: "super_admin_session",
      assignedAtIso: new Date().toISOString(),
      notes: form.notes.trim(),
    };
    upsertTeacherAssignment(record);
    setAssignments(readAllTeacherAssignments());
    setForm(buildEmptyForm());
    setSuccess(`Teacher role assigned to ${record.email}.`);
  }

  function handleRevoke(userId: string) {
    revokeTeacherAssignment(userId);
    setAssignments(readAllTeacherAssignments());
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 data-tour="page-title" className="text-xl font-semibold text-slate-800">
          Teacher Assignment
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Only Super Admins may grant the Teacher role. Assign educators below and link them to their institution.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-amber-900">Assign Teacher Role</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-amber-800">Clerk User ID *</label>
            <input
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="usr_..."
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-amber-800">Email *</label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="teacher@school.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-amber-800">Full Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Jane Smith"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-amber-800">Org ID *</label>
            <input
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="org_lincoln"
              value={form.orgId}
              onChange={(e) => setForm({ ...form, orgId: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-amber-800">Tenant ID (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="tenant_001"
              value={form.tenantId}
              onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-amber-800">Notes</label>
            <input
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. trial cohort, district pilot"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        {success && <p className="mt-3 text-xs text-green-700">{success}</p>}

        <button
          onClick={handleAssign}
          className="mt-4 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          Assign Teacher Role
        </button>

        <p className="mt-3 text-xs text-amber-700">
          Note: This stores the assignment locally. To apply the Clerk role change, connect the Clerk Management API.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-800">Current Teacher Assignments</h2>
        {assignments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No teacher assignments recorded yet.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Org</th>
                  <th className="px-4 py-3 text-left">Assigned</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => (
                  <tr key={a.userId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{a.fullName || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{a.email}</td>
                    <td className="px-4 py-3 text-slate-500">{a.orgId}</td>
                    <td className="px-4 py-3 text-slate-400">{a.assignedAtIso.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRevoke(a.userId)}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
