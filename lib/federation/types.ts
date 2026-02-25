export const FEDERATION_ROLE = ["planner", "worker", "reviewer", "safety", "router"] as const;

export type FederationRole = (typeof FEDERATION_ROLE)[number];

export type AgentCapability = {
  capabilityId: string;
  description: string;
  version: string;
  inputs: string[];
  outputs: string[];
};

export type AgentRegistration = {
  agentId: string;
  displayName: string;
  role: FederationRole;
  enabled: boolean;
  capabilities: AgentCapability[];
  updatedAtIso: string;
};

export type FederationTaskEnvelope = {
  taskId: string;
  correlationId: string;
  requestedByRole: string;
  assignedAgentId: string;
  capabilityId: string;
  payload: Record<string, unknown>;
};

export type FederationTaskResult = {
  taskId: string;
  correlationId: string;
  status: "success" | "error";
  output?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
};
