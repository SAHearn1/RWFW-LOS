import type { StandardDescriptor } from "@/lib/standards/contracts/types";

export type StandardsVerifyJobPayload = {
  jobType: "standards.verify";
  artifactText: string;
  standards?: StandardDescriptor[];
};

export type RuntimeSmokeJobPayload = {
  jobType: "runtime.smoke";
};

export type OrchestrationJobPayload = StandardsVerifyJobPayload | RuntimeSmokeJobPayload;
