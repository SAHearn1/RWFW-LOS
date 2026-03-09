import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseAppRole } from "@/lib/auth/userRole";
import { CloudManagedProvider } from "@/lib/llm/providers/cloudManaged";
import { LocalOllamaProvider } from "@/lib/llm/providers/localOllama";
import { getFederationDiscovery } from "@/lib/federation/registry";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);
  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role || !user?.id) {
    return NextResponse.json(
      { error: "Authenticated session required." },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }
  const local = new LocalOllamaProvider();
  const cloud = new CloudManagedProvider();

  const localEnabled = await local.isAvailable();
  const cloudEnabled = await cloud.isAvailable();
  const federationEnabled = process.env.NEXT_PUBLIC_ENABLE_FEDERATION === "true";
  const discovery = federationEnabled ? getFederationDiscovery() : null;

  return NextResponse.json(
    {
      localOllama: localEnabled ? "ready" : "disabled",
      cloudManaged: cloudEnabled ? "ready" : "unavailable",
      federation: federationEnabled ? "ready" : "disabled",
      discoveryCount: discovery?.registrations.length ?? 0
    },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
