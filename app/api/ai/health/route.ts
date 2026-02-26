import { NextResponse } from "next/server";

import { TRACE_HEADER, createTraceId } from "@/lib/observability/trace";

export async function GET(): Promise<Response> {
  const traceId = createTraceId();
  const timestamp = new Date().toISOString();

  if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA !== "true") {
    return NextResponse.json(
      { status: "disabled", timestampIso: timestamp },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
  if (!ollamaBaseUrl) {
    return NextResponse.json(
      { status: "unavailable", latencyMs: null, reason: "OLLAMA_BASE_URL not configured", timestampIso: timestamp },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const probeUrl = `${ollamaBaseUrl}/api/tags`;
  const probeStart = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(probeUrl, {
      method: "HEAD",
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - probeStart;

    if (response.ok || response.status === 405) {
      // 405 means the endpoint exists but HEAD is not allowed — treat as available
      return NextResponse.json(
        { status: "available", latencyMs, timestampIso: timestamp },
        { status: 200, headers: { [TRACE_HEADER]: traceId } }
      );
    }

    return NextResponse.json(
      { status: "unavailable", latencyMs, reason: `HTTP ${response.status}`, timestampIso: timestamp },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  } catch (err: unknown) {
    const latencyMs = Date.now() - probeStart;
    const reason = err instanceof Error && err.name === "AbortError" ? "timeout" : "connection_error";

    return NextResponse.json(
      { status: "unavailable", latencyMs, reason, timestampIso: timestamp },
      { status: 200, headers: { [TRACE_HEADER]: traceId } }
    );
  }
}
