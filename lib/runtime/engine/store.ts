import type { RuntimeEvent } from "@/lib/runtime/contracts/types";
import { decryptFromStorage, encryptForStorage } from "@/lib/crypto/localStorageEncryption";

import { createInitialRuntimeState, reduceRuntimeState, type RuntimeState } from "./reducer";

const RUNTIME_STORAGE_KEY = "rootwork.runtime.state";

let runtimeFallbackState: RuntimeState = createInitialRuntimeState();

// In-memory cache that is always authoritative for synchronous reads.
// Populated from localStorage (with decryption) on first access.
let runtimeMemoryCache: RuntimeState | null = null;
let runtimeCacheLoadInitiated = false;

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Initiates an async load from localStorage into runtimeMemoryCache (runs once).
 * Only executes in a browser context where window is available.
 */
async function initRuntimeCacheFromStorage(): Promise<void> {
  if (!canUseLocalStorage()) return;
  const raw = window.localStorage.getItem(RUNTIME_STORAGE_KEY);
  if (!raw) {
    runtimeMemoryCache = createInitialRuntimeState();
    return;
  }
  try {
    const decrypted = await decryptFromStorage(raw);
    runtimeMemoryCache = JSON.parse(decrypted) as RuntimeState;
  } catch {
    runtimeMemoryCache = createInitialRuntimeState();
  }
}

function ensureRuntimeCacheLoaded(): void {
  if (!runtimeCacheLoadInitiated) {
    runtimeCacheLoadInitiated = true;
    void initRuntimeCacheFromStorage();
  }
}

export function readRuntimeState(): RuntimeState {
  if (!canUseLocalStorage()) {
    return runtimeFallbackState;
  }

  ensureRuntimeCacheLoaded();
  return runtimeMemoryCache ?? createInitialRuntimeState();
}

export function writeRuntimeState(state: RuntimeState): RuntimeState {
  if (!canUseLocalStorage()) {
    runtimeFallbackState = state;
    return state;
  }

  // Update the in-memory cache synchronously so subsequent reads see the new state.
  runtimeMemoryCache = state;

  // Persist to localStorage asynchronously with encryption (fire-and-forget).
  // Guard: encryption utility uses Web Crypto which is only available in browser.
  if (typeof window !== "undefined") {
    const serialized = JSON.stringify(state);
    encryptForStorage(serialized)
      .then((stored) => {
        window.localStorage.setItem(RUNTIME_STORAGE_KEY, stored);
      })
      .catch(() => {
        // Encryption or storage failure — in-memory cache remains authoritative.
      });
  }

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
