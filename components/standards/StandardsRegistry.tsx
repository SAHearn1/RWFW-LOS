"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Tag, Trash2 } from "lucide-react";

import type { StandardDescriptor, VerificationRuleResult } from "@/lib/standards/contracts/types";
import { DEFAULT_STANDARDS, verifyArtifactText } from "@/lib/standards/verifier/localVerifier";

const SAMPLE_TEXT =
  "My goal for this mission is to demonstrate a clear outcome by providing evidence of my learning. I will reflect on what I did, identify ways to improve, and describe my next steps.";

const VERDICT_STYLES: Record<VerificationRuleResult["verdict"], string> = {
  pass: "bg-green-100 text-green-800",
  partial: "bg-amber-100 text-amber-800",
  missing: "bg-red-100 text-red-700",
};

function deriveDescription(id: string): string {
  if (id === "rw.mission.clarity") {
    return "Checks that a mission artifact contains a clear goal, expected outcome, and evidence pointer.";
  }
  if (id === "rw.artifact.reflection") {
    return "Checks that an artifact demonstrates reflective practice — acknowledging what happened, improvements made, and next actions.";
  }
  return "Custom verification standard applied to submitted artifacts.";
}

export default function StandardsRegistry() {
  const [standards, setStandards] = useState<StandardDescriptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<VerificationRuleResult[] | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftKeywords, setDraftKeywords] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchStandards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/standards");
      if (!res.ok) {
        throw new Error(`Failed to load standards (${res.status})`);
      }
      const data = (await res.json()) as { standards: StandardDescriptor[] };
      const fetched = data.standards ?? [];
      // If DB is empty, seed with defaults for display
      setStandards(fetched.length > 0 ? fetched : [...DEFAULT_STANDARDS]);
    } catch {
      setError("Could not load standards from server. Showing built-in defaults.");
      setStandards([...DEFAULT_STANDARDS]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStandards();
  }, [fetchStandards]);

  function runVerificationTest() {
    const results = verifyArtifactText(SAMPLE_TEXT);
    setTestResults(results);
  }

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!draftTitle.trim()) {
      setFormError("Title is required.");
      return;
    }

    const keywords = draftKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/standards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle.trim(),
          requiredKeywords: keywords,
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setDraftTitle("");
      setDraftDescription("");
      setDraftKeywords("");
      setShowAddForm(false);
      await fetchStandards();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create standard.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(`Delete standard "${id}"? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/admin/standards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      await fetchStandards();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete standard.");
    }
  }

  return (
    <section className="space-y-6" data-tour="standards-registry">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-tour="page-title">
            Standards Registry
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Active verification standards applied to artifacts in Studio.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddForm((prev) => !prev);
            setFormError(null);
          }}
          className="rounded border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          {showAddForm ? "Cancel" : "Add Standard"}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={(e) => void handleAddSubmit(e)}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
        >
          <h2 className="text-base font-semibold text-slate-800">New Standard</h2>

          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}

          <div className="space-y-1">
            <label htmlFor="draft-title" className="block text-sm font-medium text-slate-700">
              Title <span aria-hidden="true">*</span>
            </label>
            <input
              id="draft-title"
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="e.g. Mission Clarity"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="draft-description" className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <input
              id="draft-description"
              type="text"
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Optional description of this standard"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="draft-keywords" className="block text-sm font-medium text-slate-700">
              Required Keywords
              <span className="ml-1 text-xs font-normal text-slate-500">(comma-separated)</span>
            </label>
            <input
              id="draft-keywords"
              type="text"
              value={draftKeywords}
              onChange={(e) => setDraftKeywords(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="e.g. goal, outcome, evidence"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving…" : "Save Standard"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormError(null);
              }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading standards…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {standards.map((std) => (
            <article
              key={std.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-slate-900 truncate">{std.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(std.id)}
                  className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                  aria-label={`Delete standard ${std.title}`}
                  title="Delete standard"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-1 font-mono text-xs text-slate-400">{std.id}</p>
              <p className="mt-2 text-sm text-slate-600">{deriveDescription(std.id)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                {std.requiredKeywords.length > 0 ? (
                  std.requiredKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No keywords defined</span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden="true" />
                <span className="text-xs font-medium text-green-700">Active</span>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-base font-semibold text-slate-800">Run Verification Test</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tests all active standards against a built-in sample artifact text to confirm the verifier
          is working correctly.
        </p>
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500 italic">
          &ldquo;{SAMPLE_TEXT}&rdquo;
        </div>
        <button
          type="button"
          onClick={runVerificationTest}
          className="mt-4 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Run Test
        </button>

        {testResults !== null && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Results</p>
            {testResults.map((result) => (
              <div
                key={result.standardId}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs text-slate-500">{result.standardId}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${VERDICT_STYLES[result.verdict]}`}
                >
                  {result.verdict}
                </span>
                {result.matchedKeywords.length > 0 && (
                  <span className="text-xs text-slate-500">
                    matched: {result.matchedKeywords.join(", ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        {standards.length} standard
        {standards.length !== 1 ? "s" : ""} registered.
      </p>
    </section>
  );
}
