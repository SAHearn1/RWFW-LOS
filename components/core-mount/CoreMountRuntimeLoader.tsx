"use client";

import dynamic from "next/dynamic";

import type { CoreMountStatus } from "@/lib/coreMount/contracts";

const CoreMountRuntime = dynamic(() => import("@/components/core-mount/CoreMountRuntime"), {
  ssr: false,
  loading: () => <p className="text-sm text-slate-600">Loading core mount runtime...</p>
});

export default function CoreMountRuntimeLoader({ initialStatus }: { initialStatus: CoreMountStatus }) {
  return <CoreMountRuntime initialStatus={initialStatus} />;
}
