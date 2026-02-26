"use client";

import { useState } from "react";
import { BookOpen, CheckCircle2, Tag } from "lucide-react";

import type { VerificationRuleResult } from "@/lib/standards/contracts/types";
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
  const [testResults, setTestResults] = useState<VerificationRuleResult[] | null>(null);

  function runVerificationTest() {
    const results = verifyArtifactText(SAMPLE_TEXT);
    setTestResults(results);
  }

  return (
    <section className="space-y-6" data-tour="standards-registry">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-tour="page-title">
            Standards Registry
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Active verification standards applied to artifacts in Studio. Read-only in this release.
          </p>
        </div>
        <div title="Standard authoring is not yet available." className="inline-block">
          <button
            type="button"
            disabled
            className="rounded border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed select-none"
            aria-disabled="true"
          >
            Add Standard &mdash; Coming soon
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {DEFAULT_STANDARDS.map((std) => (
          <article
            key={std.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-900">{std.title}</h2>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-400">{std.id}</p>
            <p className="mt-2 text-sm text-slate-600">{deriveDescription(std.id)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              {std.requiredKeywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                >
                  {kw}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden="true" />
              <span className="text-xs font-medium text-green-700">Active</span>
            </div>
          </article>
        ))}
      </div>

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
        {DEFAULT_STANDARDS.length} standard
        {DEFAULT_STANDARDS.length !== 1 ? "s" : ""} registered.
      </p>
    </section>
  );
}
