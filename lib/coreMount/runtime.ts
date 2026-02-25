import { phase1FeatureFlags } from "@/lib/config/featureFlags";

import type { CoreMountContext, CoreMountLifecycle, CoreMountStatus } from "./contracts";

class FlagGatedCoreMount implements CoreMountLifecycle {
  #status: CoreMountStatus;

  constructor(initialStatus: CoreMountStatus) {
    this.#status = initialStatus;
  }

  async mount(): Promise<void> {
    if (!phase1FeatureFlags.enableCoreViteMount) {
      this.#status = "disabled";
      return;
    }

    this.#status = "ready";
  }

  async unmount(): Promise<void> {
    this.#status = phase1FeatureFlags.enableCoreViteMount ? "ready" : "disabled";
  }

  status(): CoreMountStatus {
    return this.#status;
  }
}

export function createCoreMountRuntime(context: CoreMountContext): CoreMountLifecycle {
  const initialStatus: CoreMountStatus = phase1FeatureFlags.enableCoreViteMount || context.attempt > 1 ? "ready" : "disabled";
  return new FlagGatedCoreMount(initialStatus);
}
