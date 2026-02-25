import type { RuntimeEvent } from "@/lib/runtime/contracts/types";

import { createInitialRuntimeState, reduceRuntimeState, type RuntimeState } from "./reducer";

const RUNTIME_STORAGE_KEY = "rootwork.runtime.state";

let runtimeFallbackState: RuntimeState = createInitialRuntimeState();

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readRuntimeState(): RuntimeState {
  if (!canUseLocalStorage()) {
    return runtimeFallbackState;
  }

  const raw = window.localStorage.getItem(RUNTIME_STORAGE_KEY);
  if (!raw) {
    return createInitialRuntimeState();
  }

  try {
    return JSON.parse(raw) as RuntimeState;
  } catch {
    return createInitialRuntimeState();
  }
}

export function writeRuntimeState(state: RuntimeState): RuntimeState {
  if (!canUseLocalStorage()) {
    runtimeFallbackState = state;
    return state;
  }

  window.localStorage.setItem(RUNTIME_STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function purgeRuntimeStateBefore(cutoffIso: string): RuntimeState {
  const current = readRuntimeState();

  const next: RuntimeState = {
    missions: Object.fromEntries(Object.entries(current.missions).filter(([, mission]) => mission.updatedAtIso >= cutoffIso)),
    artifacts: Object.fromEntries(Object.entries(current.artifacts).filter(([, artifact]) => artifact.updatedAtIso >= cutoffIso)),
    verifications: Object.fromEntries(Object.entries(current.verifications).filter(([, verification]) => verification.createdAtIso >= cutoffIso))
  };

  return writeRuntimeState(next);
}

export function deleteRuntimeStateByLearner(learnerId: string): RuntimeState {
  const current = readRuntimeState();

  const next: RuntimeState = {
    missions: Object.fromEntries(Object.entries(current.missions).filter(([, mission]) => mission.learnerId !== learnerId)),
    artifacts: Object.fromEntries(Object.entries(current.artifacts).filter(([, artifact]) => artifact.learnerId !== learnerId)),
    verifications: Object.fromEntries(
      Object.entries(current.verifications).filter(([, verification]) => {
        const mission = current.missions[verification.missionId];
        return mission?.learnerId !== learnerId;
      })
    )
  };

  return writeRuntimeState(next);
}

export function dispatchRuntimeEvent(event: RuntimeEvent): RuntimeState {
  const current = readRuntimeState();
  const next = reduceRuntimeState(current, event);
  return writeRuntimeState(next);
}
