"use client";

import { useEffect, useState } from "react";
import { BookOpen, Users } from "lucide-react";

type Tab = "mission-templates" | "cohort-setup";

interface CreatedMission {
  id: string;
  title: string;
  stage: string;
  learnerId: string;
  updatedAtIso: string;
}

const MISSION_TEMPLATES = [
  {
    id: "tpl-1",
    title: "Define Your Why",
    description:
      "Learners articulate their core purpose and intrinsic motivation. Structured reflection prompts guide them from surface-level goals to deeper personal mission statements.",
  },
  {
    id: "tpl-2",
    title: "Map Your Strengths",
    description:
      "A guided inventory of skills, values, and experiences. Learners create a personal asset map and identify connections to real-world opportunities.",
  },
];

export default function BuilderWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>("mission-templates");
  const [missions, setMissions] = useState<CreatedMission[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch existing missions on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchMissions() {
      try {
        const res = await fetch("/api/missions");
        if (!res.ok) return;
        const data = (await res.json()) as { missions: CreatedMission[] };
        if (!cancelled) {
          setMissions(data.missions ?? []);
        }
      } catch {
        // Non-blocking — builder still usable if fetch fails
      }
    }

    void fetchMissions();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateMission(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const title = draftTitle.trim();
    if (!title) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        setStatusMessage({ type: "error", text: "Failed to create mission — try again" });
        return;
      }

      const data = (await res.json()) as { mission: CreatedMission };
      setMissions((prev) => [data.mission, ...prev]);
      setDraftTitle("");
      setStatusMessage({ type: "success", text: "Mission created" });
    } catch {
      setStatusMessage({ type: "error", text: "Failed to create mission — try again" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6" data-tour="builder-workspace">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900" data-tour="page-title">
          Builder
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Create and configure missions and cohorts for your learners.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "mission-templates"}
          onClick={() => setActiveTab("mission-templates")}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 ${
            activeTab === "mission-templates"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BookOpen size={15} aria-hidden="true" />
          Mission Templates
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "cohort-setup"}
          onClick={() => setActiveTab("cohort-setup")}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 ${
            activeTab === "cohort-setup"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users size={15} aria-hidden="true" />
          Cohort Setup
        </button>
      </div>

      {/* Mission Templates tab */}
      {activeTab === "mission-templates" && (
        <div className="space-y-6">
          {/* Mission creation form */}
          <div className="max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Create New Mission</h2>
            <form onSubmit={(e) => { void handleCreateMission(e); }} className="flex gap-2">
              <input
                id="mission-title"
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Mission title…"
                disabled={isSubmitting}
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isSubmitting || draftTitle.trim() === ""}
                className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating…" : "Create"}
              </button>
            </form>

            {statusMessage && (
              <p
                role="status"
                aria-live="polite"
                className={`mt-3 text-sm font-medium ${
                  statusMessage.type === "success" ? "text-teal-700" : "text-red-600"
                }`}
              >
                {statusMessage.text}
              </p>
            )}
          </div>

          {/* Created missions list */}
          {missions.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold text-slate-900">Created Missions</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {missions.map((mission) => (
                  <li
                    key={mission.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                      <BookOpen size={16} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{mission.title}</p>
                      <p className="text-xs text-slate-500 capitalize">{mission.stage.replace("_", " ")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Template cards */}
          <div>
            <h2 className="mb-3 font-semibold text-slate-900">Mission Templates</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {MISSION_TEMPLATES.map((tpl) => (
                <article
                  key={tpl.id}
                  className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                      <BookOpen size={16} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">{tpl.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{tpl.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDraftTitle(tpl.title)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    >
                      Use Template
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cohort Setup tab */}
      {activeTab === "cohort-setup" && (
        <div className="max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">New Cohort</h2>
          <fieldset disabled className="space-y-4 opacity-60" aria-label="Cohort setup form (coming soon)">
            <div>
              <label htmlFor="cohort-name" className="block text-sm font-medium text-slate-700">
                Cohort Name
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500">
                  Coming soon
                </span>
              </label>
              <input
                id="cohort-name"
                type="text"
                disabled
                placeholder="e.g. Spring 2026 Cohort B"
                className="mt-1 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
              />
            </div>
            <div>
              <label htmlFor="cohort-start" className="block text-sm font-medium text-slate-700">
                Start Date
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500">
                  Coming soon
                </span>
              </label>
              <input
                id="cohort-start"
                type="date"
                disabled
                className="mt-1 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
              />
            </div>
            <div>
              <label htmlFor="cohort-capacity" className="block text-sm font-medium text-slate-700">
                Capacity
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500">
                  Coming soon
                </span>
              </label>
              <input
                id="cohort-capacity"
                type="number"
                disabled
                placeholder="0"
                min={1}
                className="mt-1 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
              />
            </div>
          </fieldset>
          <p className="mt-4 text-xs text-slate-400">
            Cohort creation will be wired in a future release.
          </p>
        </div>
      )}
    </section>
  );
}
