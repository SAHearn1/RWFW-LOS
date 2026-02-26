import { NextResponse } from "next/server";

import { createFederationError, createFederationRequest, createFederationResponse } from "@/lib/federation/protocol";
import { buildCapabilityIndex } from "@/lib/federation/registryContracts";
import type { AgentRegistration, FederationTaskEnvelope } from "@/lib/federation/types";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

// Mock agent registry: 2 agents with distinct capabilities.
// Replace with a durable registry store (DB / config) when federation is fully implemented.
const AGENT_REGISTRY: AgentRegistration[] = [
  {
    agentId: "agent-planner-01",
    displayName: "Mission Planner",
    role: "planner",
    enabled: true,
    capabilities: [
      {
        capabilityId: "mission.plan",
        description: "Generates a structured mission plan from a learner goal.",
        version: "1.0.0",
        inputs: ["learnerGoal", "context"],
        outputs: ["missionPlan"]
      },
      {
        capabilityId: "mission.scaffold",
        description: "Scaffolds milestones and checkpoints for an existing mission.",
        version: "1.0.0",
        inputs: ["missionId", "stage"],
        outputs: ["milestones"]
      }
    ],
    updatedAtIso: "2026-02-01T00:00:00.000Z"
  },
  {
    agentId: "agent-reviewer-01",
    displayName: "Artifact Reviewer",
    role: "reviewer",
    enabled: true,
    capabilities: [
      {
        capabilityId: "artifact.review",
        description: "Reviews a learner artifact against standards and returns a verdict.",
        version: "1.0.0",
        inputs: ["artifactId", "artifactContent", "standards"],
        outputs: ["verdict", "feedback"]
      },
      {
        capabilityId: "artifact.summarize",
        description: "Produces a brief summary of a learner artifact.",
        version: "1.0.0",
        inputs: ["artifactContent"],
        outputs: ["summary"]
      }
    ],
    updatedAtIso: "2026-02-01T00:00:00.000Z"
  }
];

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const timestamp = new Date().toISOString();

  if (process.env.NEXT_PUBLIC_ENABLE_FEDERATION !== "true") {
    recordAuditEvent({
      traceId,
      eventType: "federation.request.blocked",
      role: "unknown",
      severity: "warning",
      createdAtIso: timestamp,
      metadata: { reason: "feature_disabled" }
    });

    return NextResponse.json(
      { error: "Federation is disabled by feature flag." },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  let body: { task?: FederationTaskEnvelope };
  try {
    body = (await request.json()) as { task?: FederationTaskEnvelope };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  if (!body.task) {
    return NextResponse.json(
      { error: "task payload is required" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const task = body.task;

  // Build the capability index from the agent registry.
  // The index maps capabilityId → agentId[].
  const capabilityIndex = buildCapabilityIndex(AGENT_REGISTRY);

  // Look up agents that advertise the requested capability.
  const candidateAgentIds = capabilityIndex[task.capabilityId] ?? [];

  // Filter to only enabled agents.
  const matchingAgent = AGENT_REGISTRY.find(
    (agent) => agent.enabled && candidateAgentIds.includes(agent.agentId)
  );

  if (!matchingAgent) {
    recordAuditEvent({
      traceId,
      eventType: "federation.dispatch.no_agent",
      role: task.requestedByRole,
      severity: "warning",
      createdAtIso: timestamp,
      metadata: {
        taskId: task.taskId,
        capabilityId: task.capabilityId
      }
    });

    const errorEnvelope = createFederationError(
      task.taskId,
      task.correlationId,
      "NO_AGENT_AVAILABLE",
      `No agent available for capability: ${task.capabilityId}`
    );

    return NextResponse.json(
      { error: "No agent available for capability", capabilityId: task.capabilityId, envelope: errorEnvelope },
      { status: 422, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  // Assign the task to the matched agent.
  const assignedTask: FederationTaskEnvelope = {
    ...task,
    assignedAgentId: matchingAgent.agentId
  };

  const requestEnvelope = createFederationRequest(assignedTask);

  const responseEnvelope = createFederationResponse({
    taskId: assignedTask.taskId,
    correlationId: assignedTask.correlationId,
    status: "success",
    output: {
      accepted: true,
      assignedAgentId: matchingAgent.agentId,
      protocol: requestEnvelope.version
    }
  });

  recordAuditEvent({
    traceId,
    eventType: "federation.dispatch.assigned",
    role: task.requestedByRole,
    severity: "info",
    createdAtIso: timestamp,
    metadata: {
      taskId: assignedTask.taskId,
      assignedAgentId: matchingAgent.agentId,
      capabilityId: assignedTask.capabilityId
    }
  });

  return NextResponse.json(
    {
      accepted: true,
      assignedAgentId: matchingAgent.agentId,
      taskId: assignedTask.taskId,
      envelope: responseEnvelope
    },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}

export function GET(request: Request): Response {
  const traceId = getTraceIdFromRequest(request);
  const timestamp = new Date().toISOString();

  if (process.env.NEXT_PUBLIC_ENABLE_FEDERATION !== "true") {
    return NextResponse.json(
      { error: "Federation is disabled by feature flag." },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const capabilityIndex = buildCapabilityIndex(AGENT_REGISTRY);

  // Collect all unique capabilities across the registry.
  const capabilities = AGENT_REGISTRY.flatMap((agent) => agent.capabilities).filter(
    (capability, index, all) => all.findIndex((c) => c.capabilityId === capability.capabilityId) === index
  );

  return NextResponse.json(
    {
      agents: AGENT_REGISTRY,
      capabilities,
      capabilityIndex,
      generatedAtIso: timestamp
    },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
