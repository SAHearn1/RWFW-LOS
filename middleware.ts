import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getConfiguredPublishableKey } from "@/lib/config/envGuards";

const isAppRoute = createRouteMatcher(["/app(.*)"]);
const hasValidClerkKey = Boolean(getConfiguredPublishableKey());

const clerkProtectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (isAppRoute(req)) {
    await auth.protect();
  }
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!hasValidClerkKey) {
    if (isAppRoute(req)) {
      return NextResponse.redirect(new URL("/sign-in?auth=unavailable", req.url));
    }

    return NextResponse.next();
  }

  return (clerkProtectedMiddleware as unknown as (request: NextRequest, evt: NextFetchEvent) => Response | Promise<Response>)(req, event);
}

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"]
};
