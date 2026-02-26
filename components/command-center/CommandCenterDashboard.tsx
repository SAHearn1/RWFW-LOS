"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ClipboardList, Users, Inbox } from "lucide-react";

import type { CommandCenterActivity, CommandCenterStats } from "@/app/api/command-center/route";

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
  const [stats, setStats] = useState<CommandCenterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await fetch("/api/command-center");
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json() as CommandCenterStats;
        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCohorts = stats?.activeCohorts ?? 0;
  const pendingReviews = stats?.pendingReviews ?? 0;
  const pickupQueueLength = stats?.pickupQueueLength ?? 0;
  const recentActivity: CommandCenterActivity[] = stats?.recentActivity ?? [];

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

      {loading && (
        <p className="text-sm text-slate-500" aria-live="polite">
          Loading...
        </p>
      )}

      {error && !loading && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Failed to load command center data: {error}
        </p>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <Users size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "—" : activeCohorts}
            </p>
            <p className="text-sm text-slate-600">Active Cohorts</p>
          </div>
        </article>

        <article className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ClipboardList size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "—" : pendingReviews}
            </p>
            <p className="text-sm text-slate-600">Pending Reviews</p>
          </div>
        </article>

        <article className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
            <Inbox size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "—" : pickupQueueLength}
            </p>
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
        {!loading && recentActivity.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            No recent activity to display.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentActivity.map((item, idx) => (
              <li
                key={`${item.type}-${item.timestampIso}-${idx}`}
                className="flex items-start justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-800">{item.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500 capitalize">{item.type}</p>
                </div>
                <time
                  dateTime={item.timestampIso}
                  className="shrink-0 whitespace-nowrap text-xs text-slate-400"
                >
                  {formatTimestamp(item.timestampIso)}
                </time>
              </li>
            ))}
          </ul>
        )}
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
