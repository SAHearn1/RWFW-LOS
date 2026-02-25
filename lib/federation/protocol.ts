import type { FederationTaskEnvelope, FederationTaskResult } from "./types";

export const FEDERATION_PROTOCOL_VERSION = "v1" as const;

export type FederationRequestEnvelope = {
  version: typeof FEDERATION_PROTOCOL_VERSION;
  kind: "task.request";
  sentAtIso: string;
  task: FederationTaskEnvelope;
};

export type FederationResponseEnvelope = {
  version: typeof FEDERATION_PROTOCOL_VERSION;
  kind: "task.response";
  sentAtIso: string;
  result: FederationTaskResult;
};

export type FederationErrorEnvelope = {
  version: typeof FEDERATION_PROTOCOL_VERSION;
  kind: "task.error";
  sentAtIso: string;
  taskId: string;
  correlationId: string;
  code: string;
  message: string;
};

export function createFederationRequest(task: FederationTaskEnvelope): FederationRequestEnvelope {
  return {
    version: FEDERATION_PROTOCOL_VERSION,
    kind: "task.request",
    sentAtIso: new Date().toISOString(),
    task
  };
}

export function createFederationResponse(result: FederationTaskResult): FederationResponseEnvelope {
  return {
    version: FEDERATION_PROTOCOL_VERSION,
    kind: "task.response",
    sentAtIso: new Date().toISOString(),
    result
  };
}

export function createFederationError(taskId: string, correlationId: string, code: string, message: string): FederationErrorEnvelope {
  return {
    version: FEDERATION_PROTOCOL_VERSION,
    kind: "task.error",
    sentAtIso: new Date().toISOString(),
    taskId,
    correlationId,
    code,
    message
  };
}
