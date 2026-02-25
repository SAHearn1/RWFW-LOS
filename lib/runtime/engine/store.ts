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

export function dispatchRuntimeEvent(event: RuntimeEvent): RuntimeState {
  const current = readRuntimeState();
  const next = reduceRuntimeState(current, event);
  return writeRuntimeState(next);
}
