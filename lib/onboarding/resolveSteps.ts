import type { AppRole } from "@/lib/auth/roles";
import {
  PHASE1_FEATURE_FLAG_KEYS,
  PHASE3_FEATURE_FLAG_KEYS,
  type Phase1FeatureFlagKey,
  type Phase3FeatureFlagKey
} from "@/lib/config/featureFlags";
import { ROLE_TOUR_STEPS, type TourStep } from "./tourSteps";

export type TourFlagKey = Phase1FeatureFlagKey | Phase3FeatureFlagKey;

export type TourContext = {
  role: AppRole;
  flags: Readonly<Record<TourFlagKey, boolean>>;
};

export function getClientFlagSnapshot(): Readonly<Record<TourFlagKey, boolean>> {
  const allKeys = [...PHASE1_FEATURE_FLAG_KEYS, ...PHASE3_FEATURE_FLAG_KEYS];
  return allKeys.reduce((accumulator, key) => {
    accumulator[key as TourFlagKey] = process.env[key] === "true";
    return accumulator;
  }, {} as Record<TourFlagKey, boolean>);
}

export function resolveTourSteps({ role, flags }: TourContext): TourStep[] {
  const steps = ROLE_TOUR_STEPS[role];

  return steps.filter((step) => {
    if (!step.requiredFlag) {
      return true;
    }

    return flags[step.requiredFlag as TourFlagKey] === true;
  });
}
