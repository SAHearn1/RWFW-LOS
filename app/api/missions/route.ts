import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import type { RuntimeMission } from "@/lib/runtime/contracts/types";
import { dispatchRuntimeEvent, readRuntimeState } from "@/lib/runtime/engine/store";
import { getTraceIdFromRequest, TRACE_HEADER } from "@/lib/observability/trace";

export async function GET(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const state = readRuntimeState();
  const missions: RuntimeMission[] = Object.values(state.missions).filter(
    (mission) => mission.learnerId === userId
  );

  return NextResponse.json(
    { missions },
    { status: 200, headers: { [TRACE_HEADER]: traceId } }
  );
}

export async function POST(request: Request): Promise<Response> {
  const traceId = getTraceIdFromRequest(request);

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const body = (await request.json()) as { title?: string };

  if (!body.title || typeof body.title !== "string" || body.title.trim() === "") {
    return NextResponse.json(
      { error: "title is required and must be a non-empty string" },
      { status: 400, headers: { [TRACE_HEADER]: traceId } }
    );
  }

  const nowIso = new Date().toISOString();
  const missionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  const mission: RuntimeMission = {
    id: missionId,
    learnerId: userId,
    title: body.title.trim(),
    stage: "not_started",
    updatedAtIso: nowIso
  };

  dispatchRuntimeEvent({ type: "MISSION_STARTED", mission });

  return NextResponse.json(
    { mission },
    { status: 201, headers: { [TRACE_HEADER]: traceId } }
  );
}
