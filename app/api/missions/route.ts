import { NextResponse } from "next/server";

import { createMission, deleteMission, listMissions } from "@/lib/runtime/missionStore";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const missions = listMissions();
  return NextResponse.json({ missions });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const action = payload.action;

  if (action === "create") {
    const title = payload.title;
    if (typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "title must be a non-empty string." }, { status: 400 });
    }
    const mission = createMission("anonymous", title.trim());
    return NextResponse.json({ mission });
  }

  if (action === "delete") {
    const id = payload.id;
    if (typeof id !== "string" || id.trim() === "") {
      return NextResponse.json({ error: "id must be a non-empty string." }, { status: 400 });
    }
    const ok = deleteMission(id.trim());
    return NextResponse.json({ ok });
  }

  return NextResponse.json(
    { error: `Unknown action "${String(action)}". Expected "create" or "delete".` },
    { status: 400 }
  );
}
