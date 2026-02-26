"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

export default function JoinCohortPanel() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/invite-codes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; role?: string };

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to join. Please check the code and try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Role has changed — do a full page reload so the layout re-fetches the new role.
      setTimeout(() => router.push("/app"), 1500);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
        Joined successfully! Redirecting to your new dashboard…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-rootwork-gold" />
        <p className="text-sm font-semibold text-slate-700">Join a Classroom</p>
      </div>
      <p className="text-xs text-slate-500">
        Enter the invite code from your teacher to join their classroom and update your learner role.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
          placeholder="e.g. RWFW-AB3D4EFG"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase tracking-widest focus:border-rootwork-teal focus:outline-none focus:ring-1 focus:ring-rootwork-teal/30"
          disabled={loading}
          maxLength={13}
        />
        <button
          type="button"
          onClick={handleJoin}
          disabled={!code.trim() || loading}
          className="rounded-lg bg-rootwork-teal px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Joining…" : "Join"}
        </button>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</p>
      )}
    </div>
  );
}
