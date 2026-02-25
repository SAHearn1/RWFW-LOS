import type { NextRequest } from "next/server";

export const TRACE_HEADER = "x-rootwork-trace-id";

export function createTraceId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getTraceIdFromRequest(request: Request | NextRequest): string {
  return request.headers.get(TRACE_HEADER) ?? createTraceId();
}

export function withTraceHeader(response: Response, traceId: string): Response {
  const next = new Response(response.body, response);
  next.headers.set(TRACE_HEADER, traceId);
  return next;
}
