"use client";

import { useMemo, useState } from "react";

import type { StandardDescriptor } from "@/lib/standards/contracts/types";
import { readConfiguredStandards, writeConfiguredStandards } from "@/lib/standards/configStore";

function parseKeywords(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export default function StandardsManager() {
  const [standards, setStandards] = useState<StandardDescriptor[]>(() => readConfiguredStandards());
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");

  const canAdd = useMemo(() => title.trim().length > 0 && parseKeywords(keywords).length > 0, [title, keywords]);

  const addStandard = () => {
    if (!canAdd) {
      return;
    }

    const next: StandardDescriptor[] = [
      ...standards,
      {
        id: `rw.custom.${Date.now()}`,
        title: title.trim(),
        requiredKeywords: parseKeywords(keywords)
      }
    ];

    writeConfiguredStandards(next);
    setStandards(next);
    setTitle("");
    setKeywords("");
  };

  const removeStandard = (id: string) => {
    const next = standards.filter((standard) => standard.id !== id);
    writeConfiguredStandards(next);
    setStandards(next);
  };

  const resetDefaults = () => {
    const next = readConfiguredStandards();
    writeConfiguredStandards(next);
    setStandards(next);
  };

  return (
    <section className="space-y-4" data-tour="standards-page">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Standards</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">
        Configure standards used by local verification plugins.
      </p>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Configured Standards</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {standards.map((standard) => (
            <li key={standard.id} className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-900">{standard.title}</p>
              <p className="text-xs text-slate-600">{standard.id}</p>
              <p className="mt-1 text-xs text-slate-700">Keywords: {standard.requiredKeywords.join(", ")}</p>
              <button
                type="button"
                className="mt-2 rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                onClick={() => removeStandard(standard.id)}
              >
                Disable
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Add Standard</h2>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-700">Title</span>
          <input className="w-full rounded border border-slate-300 px-2 py-1" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-700">Required Keywords (comma-separated)</span>
          <input className="w-full rounded border border-slate-300 px-2 py-1" value={keywords} onChange={(event) => setKeywords(event.target.value)} />
        </label>
        <div className="flex gap-2">
          <button type="button" className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50" disabled={!canAdd} onClick={addStandard}>
            Add Standard
          </button>
          <button type="button" className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700" onClick={resetDefaults}>
            Reload
          </button>
        </div>
      </div>
    </section>
  );
}
