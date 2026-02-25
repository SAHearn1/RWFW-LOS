import type { AgentRegistration, FederationTaskEnvelope } from "./types";
import { buildCapabilityIndex, validateAgentRegistration } from "./registryContracts";

const nowIso = new Date().toISOString();

const REGISTRATIONS: AgentRegistration[] = [
  {
    agentId: "router.primary",
    displayName: "Primary Router",
    role: "router",
    enabled: true,
    updatedAtIso: nowIso,
    capabilities: [
      {
        capabilityId: "federation.route",
        description: "Routes incoming federation tasks to worker agents.",
        version: "v1",
        inputs: ["FederationTaskEnvelope"],
        outputs: ["routingDecision"]
      }
    ]
  },
  {
    agentId: "worker.runtime",
    displayName: "Runtime Worker",
    role: "worker",
    enabled: true,
    updatedAtIso: nowIso,
    capabilities: [
      {
        capabilityId: "runtime.execute",
        description: "Executes runtime orchestration tasks.",
        version: "v1",
        inputs: ["task payload"],
        outputs: ["task result"]
      },
      {
        capabilityId: "standards.verify",
        description: "Runs standards verification for artifacts.",
        version: "v1",
        inputs: ["artifact text"],
        outputs: ["verification results"]
      }
    ]
  }
];

export function getFederationRegistrations(): AgentRegistration[] {
  return REGISTRATIONS.filter((registration) => registration.enabled);
}

export function getFederationDiscovery() {
  const registrations = getFederationRegistrations();
  const capabilityIndex = buildCapabilityIndex(registrations);
  const validation = registrations.map((registration) => ({
    agentId: registration.agentId,
    ...validateAgentRegistration(registration)
  }));

  return {
    registrations,
    capabilityIndex,
    validation
  };
}

export function resolveFederationAssignment(task: FederationTaskEnvelope): { accepted: boolean; assignedAgentId?: string; reason?: string } {
  const registrations = getFederationRegistrations();
  const direct = registrations.find(
    (registration) => registration.agentId === task.assignedAgentId && registration.capabilities.some((capability) => capability.capabilityId === task.capabilityId)
  );

  if (direct) {
    return { accepted: true, assignedAgentId: direct.agentId };
  }

  const fallback = registrations.find((registration) => registration.capabilities.some((capability) => capability.capabilityId === task.capabilityId));
  if (!fallback) {
    return { accepted: false, reason: `capability_not_found:${task.capabilityId}` };
  }

  return { accepted: true, assignedAgentId: fallback.agentId };
}
