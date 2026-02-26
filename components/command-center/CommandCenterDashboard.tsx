import Link from "next/link";
import { Activity, ClipboardList, Users, Inbox } from "lucide-react";

const MOCK_ACTIVITY = [
  {
    id: "act-1",
    text: "Learner submitted Mission: Define Your Why",
    timestamp: "2026-02-26T09:14:00Z",
    who: "Jordan M.",
  },
  {
    id: "act-2",
    text: "Artifact flagged for review in Spring 2026 Cohort A",
    timestamp: "2026-02-26T08:47:00Z",
    who: "System",
  },
  {
    id: "act-3",
    text: "New pickup assigned: Reflection Practice",
    timestamp: "2026-02-26T08:20:00Z",
    who: "Riley K.",
  },
  {
    id: "act-4",
    text: "Learner submitted Mission: Map Your Strengths",
    timestamp: "2026-02-25T17:53:00Z",
    who: "Sam T.",
  },
];

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function CommandCenterDashboard() {
  return (
    <section className="space-y-6" data-tour="command-center-dashboard">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900" data-tour="page-title">
          Command Center
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Your real-time operational view — cohorts, reviews, and pickup queue at a glance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <Users size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900">4</p>
            <p className="text-sm text-slate-600">Active Cohorts</p>
          </div>
        </article>

        <article className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ClipboardList size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900">12</p>
            <p className="text-sm text-slate-600">Pending Reviews</p>
          </div>
        </article>

        <article className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
            <Inbox size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900">3</p>
            <p className="text-sm text-slate-600">Pickup Queue</p>
          </div>
        </article>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <Activity size={16} className="text-slate-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-700">Recent Activity</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {MOCK_ACTIVITY.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-800">{item.text}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.who}</p>
              </div>
              <time
                dateTime={item.timestamp}
                className="shrink-0 whitespace-nowrap text-xs text-slate-400"
              >
                {formatTimestamp(item.timestamp)}
              </time>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/cohorts"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <Users size={15} aria-hidden="true" />
            Manage Cohorts
          </Link>
          <Link
            href="/app/reviews"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <ClipboardList size={15} aria-hidden="true" />
            Open Review Queue
          </Link>
          <Link
            href="/app/pickups"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <Inbox size={15} aria-hidden="true" />
            View Pickups
          </Link>
        </div>
      </div>
    </section>
  );
}
