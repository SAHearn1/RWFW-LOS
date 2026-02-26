import { NextResponse } from "next/server";

import { CloudManagedProvider } from "@/lib/llm/providers/cloudManaged";
import { LocalOllamaProvider } from "@/lib/llm/providers/localOllama";
import { ModelRouter } from "@/lib/llm/router";
import type { RouterContext } from "@/lib/llm/routerContracts";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);

  const localEnabled = process.env.NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA === "true";
  const federationEnabled = process.env.NEXT_PUBLIC_ENABLE_FEDERATION === "true";

  if (!localEnabled && !federationEnabled) {
    recordAuditEvent({
      traceId,
      eventType: "inference.request.blocked",
      role: "unknown",
      severity: "warning",
      createdAtIso: new Date().toISOString(),
      metadata: { reason: "inference_disabled" }
    });

    return NextResponse.json(
      { error: "Inference not enabled", code: "INFERENCE_DISABLED" },
      { status: 503, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const body = (await request.json()) as { prompt?: string; context?: string };

  if (!body.prompt || typeof body.prompt !== "string" || body.prompt.trim() === "") {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const localProvider = new LocalOllamaProvider();
  const cloudProvider = new CloudManagedProvider();

  const cloudAvailable = await cloudProvider.isAvailable();

  const context: RouterContext = {
    policy: localEnabled ? "local_first" : "cloud_first",
    localProviderEnabled: localEnabled,
    cloudProviderEnabled: cloudAvailable
  };

  const router = new ModelRouter(localProvider, cloudProvider, context);

  const inferenceRequest = {
    requestId: traceId,
    model: "default",
    prompt: body.prompt,
    role: "user",
    privacyMode: "hybrid" as const,
    ...(body.context ? { context: body.context } : {})
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
      latencyMs: result.latencyMs
    }
  });

  return NextResponse.json(
    {
      result: result.outputText,
      provider: result.provider,
      usedFallback: result.usedFallback
    },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
