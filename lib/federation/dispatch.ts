import type { FederationTaskEnvelope } from "@/lib/federation/types";

export type DispatchResult =
  | { dispatched: true; agentId: string; taskId: string; acceptedAt: string }
  | { dispatched: false; reason: string };

/**
 * Dispatches a task envelope to the assigned agent.
 *
 * For now: records the task to a module-level in-memory log and returns success.
 * A real implementation would HTTP POST to the agent's registered endpoint.
 *
 * The in-memory log survives within a single server process, so
 * GET /api/federation can return pending/recent dispatched tasks.
 */

// In-memory task log (survives within a single server process)
const DISPATCHED_TASKS: Array<FederationTaskEnvelope & { dispatchedAt: string }> = [];

export function dispatchTask(task: FederationTaskEnvelope): DispatchResult {
  if (!task.assignedAgentId) {
    return { dispatched: false, reason: "No agent assigned" };
  }

  const record = { ...task, dispatchedAt: new Date().toISOString() };
  DISPATCHED_TASKS.push(record);

  // In production: POST to agent endpoint via agent registry URL.
  // For now: record in memory and return success.
  return {
    dispatched: true,
    agentId: task.assignedAgentId,
    taskId: task.taskId,
    acceptedAt: record.dispatchedAt,
  };
}

export function getDispatchedTasks(): Array<FederationTaskEnvelope & { dispatchedAt: string }> {
  return [...DISPATCHED_TASKS];
}
