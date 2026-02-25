import { verifyArtifactText } from "@/lib/standards/verifier/localVerifier";
import type { FederationTaskEnvelope, FederationTaskResult } from "./types";

export function dispatchFederationTask(task: FederationTaskEnvelope, assignedAgentId: string): FederationTaskResult {
  void assignedAgentId;
  const base = {
    taskId: task.taskId,
    correlationId: task.correlationId
  };

  switch (task.capabilityId) {
    case "standards.verify": {
      const artifactText = task.payload.artifactText as string;
      const results = verifyArtifactText(artifactText);
      return {
        ...base,
        status: "success",
        output: { results }
      };
    }

    case "runtime.execute":
      return {
        ...base,
        status: "success",
        output: { message: "runtime.execute acknowledged" }
      };

    case "federation.route":
      return {
        ...base,
        status: "success",
        output: { message: "federation.route acknowledged" }
      };

    default:
      return {
        ...base,
        status: "error",
        errorCode: "capability_not_implemented",
        errorMessage: `capabilityId ${task.capabilityId} has no handler`
      };
  }
}
