"use client";

import { useState } from "react";

import type { CoreMountStatus } from "@/lib/coreMount/contracts";

type CoreMountRuntimeProps = {
  initialStatus: CoreMountStatus;
};

export default function CoreMountRuntime({ initialStatus }: CoreMountRuntimeProps) {
  const [attempt, setAttempt] = useState(1);
  const [status, setStatus] = useState(initialStatus);

  const retry = () => {
    setAttempt((value) => value + 1);
    setStatus((current) => (current === "disabled" ? "disabled" : "ready"));
  };

  if (status === "disabled") {
    return (
      <section className="space-y-4" data-tour="core-mount">
        <h1 className="text-2xl font-semibold">Core Mount Disabled</h1>
        <p className="text-sm text-slate-700">
          `NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT` is off. Enable it to activate the temporary bridge.
        </p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="space-y-4" data-tour="core-mount">
        <h1 className="text-2xl font-semibold">Core Mount Recovery</h1>
        <p className="text-sm text-slate-700">Mount failed. Retry to recover while migration is in progress.</p>
        <button className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white" onClick={retry} type="button">
          Retry Mount
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-4" data-tour="core-mount">
      <h1 className="text-2xl font-semibold">Core Mount Bridge</h1>
      <p className="text-sm text-slate-700">
        Legacy LOS core integration is available behind adapter contracts.
      </p>
      <p className="text-xs text-slate-500">Recovery attempt: {attempt}</p>
    </section>
  );
}
