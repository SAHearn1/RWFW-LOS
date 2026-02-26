import { NextResponse } from "next/server";

import { TRACE_HEADER, createTraceId } from "@/lib/observability/trace";

function readFlag(key: string): boolean {
  return process.env[key] === "true";
}

export function GET(): Response {
  const traceId = createTraceId();
  const timestamp = new Date().toISOString();

  const env = process.env.NODE_ENV === "production" ? "production" : "development";

  const flags = {
    ledger: readFlag("NEXT_PUBLIC_ENABLE_LEDGER"),
    runtime: readFlag("NEXT_PUBLIC_ENABLE_RUNTIME"),
    federation: readFlag("NEXT_PUBLIC_ENABLE_FEDERATION"),
    ollama: readFlag("NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA"),
    mcp: readFlag("NEXT_PUBLIC_ENABLE_MCP"),
    offline: readFlag("NEXT_PUBLIC_ENABLE_OFFLINE"),
    coreViteMount: readFlag("NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT"),
    dbLedger: readFlag("NEXT_PUBLIC_ENABLE_DB_LEDGER"),
    standardsVerifier: readFlag("NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER"),
    pickup: readFlag("NEXT_PUBLIC_ENABLE_PICKUP")
  };

  return NextResponse.json(
    {
      timestamp,
      env,
      flags,
      routes: { total: 21, implemented: 21 }
    },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
