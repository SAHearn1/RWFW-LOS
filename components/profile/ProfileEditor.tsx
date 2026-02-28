"use client";

import { useState } from "react";

type ProfileEditorProps = {
  initialDisplayName: string;
};

export default function ProfileEditor({ initialDisplayName }: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [saved, setSaved] = useState(initialDisplayName);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = displayName.trim() !== saved;

  async function handleSave() {
    if (!displayName.trim()) {
      setStatus({ type: "error", message: "Display name cannot be empty." });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      const payload = (await response.json()) as { displayName?: string; error?: string };
      if (!response.ok) {
        setStatus({ type: "error", message: payload.error ?? `Update failed (${response.status})` });
        return;
      }
      setSaved(payload.displayName ?? displayName.trim());
      setStatus({ type: "success", message: "Display name updated." });
    } catch {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
      <h2 className="font-semibold text-slate-900">Edit Profile</h2>
      <div className="space-y-3">
        <div>
          <label htmlFor="display-name" className="block text-xs font-medium text-slate-700">
            Display Name
          </label>
          <input
            id="display-name"
            type="text"
            className="mt-1 w-full max-w-sm rounded border border-slate-300 px-3 py-2 text-sm"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setStatus(null); }}
            disabled={saving}
          />
        </div>
        {status && (
          <p className={`text-xs ${status.type === "success" ? "text-green-700" : "text-red-600"}`}>
            {status.message}
          </p>
        )}
        <button
          type="button"
          onClick={() => { void handleSave(); }}
          disabled={saving || !dirty}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
