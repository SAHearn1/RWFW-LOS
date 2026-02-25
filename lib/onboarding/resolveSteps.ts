import type { AppRole } from "@/lib/auth/roles";
import { PHASE1_FEATURE_FLAG_KEYS, type Phase1FeatureFlagKey } from "@/lib/config/featureFlags";
import { ROLE_TOUR_STEPS, type TourStep } from "./tourSteps";

export type TourContext = {
  role: AppRole;
  flags: Readonly<Record<Phase1FeatureFlagKey, boolean>>;
};

export function getClientFlagSnapshot(): Readonly<Record<Phase1FeatureFlagKey, boolean>> {
  return PHASE1_FEATURE_FLAG_KEYS.reduce((accumulator, key) => {
    accumulator[key] = process.env[key] === "true";
    return accumulator;
  }, {} as Record<Phase1FeatureFlagKey, boolean>);
}

export function resolveTourSteps({ role, flags }: TourContext): TourStep[] {
  const steps = ROLE_TOUR_STEPS[role];

  return steps.filter((step) => {
    if (!step.requiredFlag) {
      return true;
    }

    return flags[step.requiredFlag];
  });
}
