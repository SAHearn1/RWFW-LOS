import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getConfiguredPublishableKey } from "@/lib/config/envGuards";
import { createTraceId, TRACE_HEADER } from "@/lib/observability/trace";

const isAppRoute = createRouteMatcher(["/app(.*)"]);
const hasValidClerkKey = Boolean(getConfiguredPublishableKey());

const clerkProtectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (isAppRoute(req)) {
    await auth.protect();
  }
});

function withTrace(response: Response, traceId: string): Response {
  response.headers.set(TRACE_HEADER, traceId);
  return response;
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const traceId = req.headers.get(TRACE_HEADER) ?? createTraceId();

  if (!hasValidClerkKey) {
    if (isAppRoute(req)) {
      const redirect = NextResponse.redirect(new URL("/sign-in?auth=unavailable", req.url));
      return withTrace(redirect, traceId);
    }

    return withTrace(NextResponse.next(), traceId);
  }

  const response = await (clerkProtectedMiddleware as unknown as (request: NextRequest, evt: NextFetchEvent) => Response | Promise<Response>)(
    req,
    event
  );

  return withTrace(response, traceId);
}

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"]
};
