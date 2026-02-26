import { NextResponse } from "next/server";

import { type AgentContext, buildAgentSystemInstruction } from "@/lib/agents/instructions";
import { ROOTWORK_CONSTITUTION } from "@/lib/agents/constitution";
import { GeminiProvider } from "@/lib/agents/geminiProvider";
import { MCP_GOVERNANCE, type AgentRole } from "@/lib/agents/roles";
import { CloudManagedProvider } from "@/lib/llm/providers/cloudManaged";
import { LocalOllamaProvider } from "@/lib/llm/providers/localOllama";
import { ModelRouter } from "@/lib/llm/router";
import type { RouterContext } from "@/lib/llm/routerContracts";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

const VALID_AGENT_ROLES = new Set<string>([
  "readiness-sentinel",
  "thinking-partner",
  "mission-architect",
  "evidence-curator",
  "restoration-coach",
  "educator-amplifier",
  "compliance-scribe",
]);

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);

  const localEnabled = process.env.NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA === "true";
  const federationEnabled = process.env.NEXT_PUBLIC_ENABLE_FEDERATION === "true";
  const geminiProvider = new GeminiProvider();
  const geminiAvailable = geminiProvider.isAvailable();

  if (!localEnabled && !federationEnabled && !geminiAvailable) {
    recordAuditEvent({
      traceId,
      eventType: "inference.request.blocked",
      role: "unknown",
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: { reason: "inference_disabled" },
    });

    return NextResponse.json(
      { error: "Inference not enabled", code: "INFERENCE_DISABLED" },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const body = (await request.json()) as {
    prompt?: string;
    context?: string;
    agentRole?: string;
    agentContext?: AgentContext;
  };

  if (!body.prompt || typeof body.prompt !== "string" || body.prompt.trim() === "") {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  // Agent-role path: use Gemini with constitution + MCP governance
  const agentRole = body.agentRole && VALID_AGENT_ROLES.has(body.agentRole)
    ? (body.agentRole as AgentRole)
    : null;

  if (agentRole && geminiAvailable) {
    const agentCtx: AgentContext = {
      userInput: body.prompt,
      ...(body.agentContext ?? {}),
    };

    const governance = MCP_GOVERNANCE[agentRole];
    const systemInstruction = `${ROOTWORK_CONSTITUTION}\n\n${buildAgentSystemInstruction(agentRole, agentCtx)}\n\nMCP GOVERNANCE:\n- Allowed: ${governance.allowed.join(", ")}\n- Blocked: ${governance.blocked.join(", ")}\n- Data Tier: ${governance.dataTier}`;

    const result = await geminiProvider.infer({
      prompt: body.prompt,
      systemInstruction,
    });

    recordAuditEvent({
      traceId,
      eventType: "inference.request.completed",
      role: "unknown",
      severity: "info",
      createdAtIso: new Date().toISOString(),
      metadata: {
        provider: "gemini",
        agentRole,
        usedFallback: result.usedFallback,
        latencyMs: result.latencyMs,
        dataTier: governance.dataTier,
      },
    });

    return NextResponse.json(
      {
        result: result.outputText,
        provider: result.provider,
        usedFallback: result.usedFallback,
        agentRole,
      },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  // Fallback: existing ModelRouter (Ollama / cloud)
  const localProvider = new LocalOllamaProvider();
  const cloudProvider = new CloudManagedProvider();

  const cloudAvailable = await cloudProvider.isAvailable();

  const context: RouterContext = {
    policy: localEnabled ? "local_first" : "cloud_first",
    localProviderEnabled: localEnabled,
    cloudProviderEnabled: cloudAvailable,
  };

  const router = new ModelRouter(localProvider, cloudProvider, context);

  const inferenceRequest = {
    requestId: traceId,
    model: "default",
    prompt: body.prompt,
    role: "user",
    privacyMode: "hybrid" as const,
    ...(body.context ? { context: body.context } : {}),
  };

  const result = await router.infer(inferenceRequest);

  recordAuditEvent({
    traceId,
    eventType: "inference.request.completed",
    role: "unknown",
    severity: "info",
    createdAtIso: new Date().toISOString(),
    metadata: {
      provider: result.provider,
      usedFallback: result.usedFallback,
      latencyMs: result.latencyMs,
    },
  });

  return NextResponse.json(
    {
      result: result.outputText,
      provider: result.provider,
      usedFallback: result.usedFallback,
    },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
