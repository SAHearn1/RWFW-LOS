import type { AgentRegistration } from "./types";

export type RegistryValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateAgentRegistration(registration: AgentRegistration): RegistryValidationResult {
  const errors: string[] = [];

  if (!registration.agentId.trim()) {
    errors.push("agentId is required");
  }

  if (!registration.displayName.trim()) {
    errors.push("displayName is required");
  }

  if (registration.capabilities.length === 0) {
    errors.push("capabilities must include at least one entry");
  }

  for (const capability of registration.capabilities) {
    if (!capability.capabilityId.trim()) {
      errors.push("capabilityId is required");
    }

    if (!capability.version.trim()) {
      errors.push("capability version is required");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function buildCapabilityIndex(registrations: AgentRegistration[]): Readonly<Record<string, string[]>> {
  const index: Record<string, string[]> = {};

  for (const registration of registrations) {
    for (const capability of registration.capabilities) {
      if (!index[capability.capabilityId]) {
        index[capability.capabilityId] = [];
      }
      index[capability.capabilityId].push(registration.agentId);
    }
  }

  return index;
}
