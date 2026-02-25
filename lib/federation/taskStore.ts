import type { FederationTaskResult } from "./types";

const store = new Map<string, FederationTaskResult>();

export function storeFederationResult(result: FederationTaskResult): void {
  store.set(result.taskId, result);
}

export function getFederationResult(taskId: string): FederationTaskResult | undefined {
  return store.get(taskId);
}

export function listFederationResults(): FederationTaskResult[] {
  return [...store.values()];
}
