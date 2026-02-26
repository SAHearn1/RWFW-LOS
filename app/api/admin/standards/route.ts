import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getCurrentAppRole } from "@/lib/auth/currentRole";
import {
  createStandard,
  deleteStandard,
  listStandards,
  updateStandard,
} from "@/lib/standards/adapter";
import type { StandardDescriptor } from "@/lib/standards/contracts/types";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

async function requireAdmin(
  request: Request
): Promise<{ userId: string; traceId: string } | Response> {
  const traceId = getTraceIdFromRequest(request);

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const role = await getCurrentAppRole();
  if (role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  return { userId, traceId };
}

export async function GET(request: Request): Promise<Response> {
  const result = await requireAdmin(request);
  if (result instanceof Response) return result;

  const { traceId } = result;
  const standards = listStandards();

  return NextResponse.json(
    { standards },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}

export async function POST(request: Request): Promise<Response> {
  const result = await requireAdmin(request);
  if (result instanceof Response) return result;

  const { traceId } = result;

  const body = (await request.json()) as Partial<StandardDescriptor>;

  if (!body.title || typeof body.title !== "string" || body.title.trim() === "") {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const created = createStandard({
    id: body.id,
    title: body.title.trim(),
    requiredKeywords: Array.isArray(body.requiredKeywords)
      ? body.requiredKeywords.filter((k) => typeof k === "string")
      : [],
  });

  return NextResponse.json(
    { standard: created },
    { status: 201, headers: { [TRACE_HEADER]: traceId } }
  );
}

export async function PUT(request: Request): Promise<Response> {
  const result = await requireAdmin(request);
  if (result instanceof Response) return result;

  const { traceId } = result;

  const body = (await request.json()) as Partial<StandardDescriptor> & { id?: string };

  if (!body.id || typeof body.id !== "string" || body.id.trim() === "") {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const patch: Partial<Omit<StandardDescriptor, "id">> = {};
  if (typeof body.title === "string") patch.title = body.title.trim();
  if (Array.isArray(body.requiredKeywords)) {
    patch.requiredKeywords = body.requiredKeywords.filter((k) => typeof k === "string");
  }

  const updated = updateStandard(body.id, patch);
  if (!updated) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  return NextResponse.json(
    { standard: updated },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}

export async function DELETE(request: Request): Promise<Response> {
  const result = await requireAdmin(request);
  if (result instanceof Response) return result;

  const { traceId } = result;

  const body = (await request.json()) as { id?: string };

  if (!body.id || typeof body.id !== "string" || body.id.trim() === "") {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const deleted = deleteStandard(body.id);
  if (!deleted) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  return NextResponse.json(
    { deleted: true, id: body.id },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}
