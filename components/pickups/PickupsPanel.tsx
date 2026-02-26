import { phase1FeatureFlags } from "@/lib/config/featureFlags";
import { Inbox, UserCheck } from "lucide-react";

type PickupItem = {
  id: string;
  learnerName: string;
  mission: string;
};

const MOCK_PICKUPS: PickupItem[] = [
  { id: "pickup-1", learnerName: "Casey Nguyen", mission: "Reflect on Feedback Loops" },
  { id: "pickup-2", learnerName: "Morgan Blake", mission: "Connect Strengths to Community" },
];

export default function PickupsPanel() {
  if (!phase1FeatureFlags.enablePickup) {
    return (
      <section className="space-y-4" data-tour="pickups-panel">
        <h1 className="text-2xl font-semibold text-slate-900" data-tour="page-title">
          Pickups
        </h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <Inbox size={20} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-amber-800">Pickups Not Enabled</p>
              <p className="mt-1 text-sm text-amber-700">
                This feature is not yet active. Enable{" "}
                <code className="rounded bg-amber-100 px-1 font-mono text-xs">
                  NEXT_PUBLIC_ENABLE_PICKUP
                </code>{" "}
                to use pickup assignments.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6" data-tour="pickups-panel">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900" data-tour="page-title">
          Pickups
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Assign facilitators to learners who have requested a pickup session.
        </p>
      </div>

      <ul className="space-y-3">
        {MOCK_PICKUPS.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <UserCheck size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="font-medium text-slate-900">{item.learnerName}</p>
                <p className="mt-0.5 text-sm text-slate-500">Mission: {item.mission}</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Assign
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
