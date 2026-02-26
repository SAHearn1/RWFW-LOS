import type { FederationTaskEnvelope } from "@/lib/federation/types";
import { persistTask, getRecentTasks } from "@/lib/federation/persistence";

export type DispatchResult =
  | { dispatched: true; agentId: string; taskId: string; acceptedAt: string }
  | { dispatched: false; reason: string };

/**
 * Dispatches a task envelope to the assigned agent.
 *
 * Persists the task to SQLite via the federation persistence adapter.
 * DB write failures are caught and logged — dispatch still returns success
 * so that transient storage errors do not break the federation control plane.
 *
 * A real implementation would HTTP POST to the agent's registered endpoint.
 */

export function dispatchTask(task: FederationTaskEnvelope): DispatchResult {
  if (!task.assignedAgentId) {
    return { dispatched: false, reason: "No agent assigned" };
  }

  const acceptedAt = new Date().toISOString();

  try {
    persistTask({ ...task, dispatchedAt: acceptedAt });
  } catch (err) {
    console.error("[federation/dispatch] Failed to persist task to DB:", err);
  }

  // In production: POST to agent endpoint via agent registry URL.
  // For now: persist to SQLite and return success.
  return {
    dispatched: true,
    agentId: task.assignedAgentId,
    taskId: task.taskId,
    acceptedAt,
  };
}

export function getDispatchedTasks(): Array<FederationTaskEnvelope & { dispatchedAt: string }> {
  try {
    return getRecentTasks();
  } catch (err) {
    console.error("[federation/dispatch] Failed to read tasks from DB:", err);
    return [];
  }
}
