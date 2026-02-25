"use client";

import { useEffect, useRef, useState } from "react";

import type { MissionRecord } from "@/lib/runtime/missionStore";

type LoadState = "loading" | "ready" | "error";

export default function MissionsList() {
  const [missions, setMissions] = useState<MissionRecord[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMissions();
  }, []);

  useEffect(() => {
    if (showForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showForm]);

  async function fetchMissions() {
    setLoadState("loading");
    try {
      const res = await fetch("/api/missions");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { missions: MissionRecord[] };
      setMissions(data.missions);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) {
      setFormError("Mission title cannot be empty.");
      return;
    }
    setCreating(true);
    setFormError(null);
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", title: newTitle.trim() }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { mission: MissionRecord };
      setMissions(prev => [data.mission, ...prev]);
      setNewTitle("");
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create mission.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMissions(prev => prev.filter(m => m.id !== id));
    } catch {
      // Non-fatal: the item remains visible; user can retry
    }
  }

  function handleCancelForm() {
    setShowForm(false);
    setNewTitle("");
    setFormError(null);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-tour="page-title">Missions</h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          New Mission
        </button>
      </div>

      <p className="text-sm text-slate-700">
        Track active missions, launch new learning cycles, and submit completed work for review.
      </p>

      {showForm && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 space-y-3">
          <label className="block text-sm font-medium text-slate-800" htmlFor="mission-title-input">
            Mission title
          </label>
          <input
            id="mission-title-input"
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") handleCancelForm(); }}
            placeholder="Describe your learning intention…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            disabled={creating}
          />
          {formError && (
            <p className="text-xs text-red-600">{formError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              {creating ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={handleCancelForm}
              disabled={creating}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loadState === "loading" && (
        <p className="text-sm text-slate-500">Loading missions…</p>
      )}

      {loadState === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load missions.{" "}
          <button
            type="button"
            onClick={fetchMissions}
            className="underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {loadState === "ready" && missions.length === 0 && !showForm && (
        <p className="mt-4 text-sm text-slate-500">
          No missions yet. Click <strong>New Mission</strong> to begin your first learning cycle.
        </p>
      )}

      {loadState === "ready" && missions.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {missions.map(mission => (
            <article
              key={mission.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900 break-words">{mission.title}</h2>
                <button
                  type="button"
                  onClick={() => handleDelete(mission.id)}
                  aria-label={`Delete mission: ${mission.title}`}
                  className="shrink-0 rounded p-0.5 text-slate-400 hover:text-red-600 focus:outline-none focus:ring-1 focus:ring-red-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
              <p className="mt-1 capitalize text-slate-600">
                Stage: <span className="font-medium">{mission.stage.replace(/_/g, " ")}</span>
              </p>
              <p className="mt-1 text-slate-400">{mission.createdAtIso.slice(0, 10)}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
