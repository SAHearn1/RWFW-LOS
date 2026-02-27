import { SignIn } from "@clerk/nextjs";

import { getConfiguredPublishableKey } from "@/lib/config/envGuards";

const INTENT_BANNERS: Readonly<Record<string, { heading: string; body: string }>> = {
  teacher: {
    heading: "Teacher sign-in",
    body: "Sign in to access your command center, cohorts, and review queue.",
  },
  admin: {
    heading: "Administrator sign-in",
    body: "Sign in to access standards, evidence, and export controls.",
  },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const { intent } = await searchParams;
  const hasClerkKey = Boolean(getConfiguredPublishableKey());
  const banner = intent ? (INTENT_BANNERS[intent] ?? null) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-4 px-6 py-12">
      {banner && (
        <div className="w-full max-w-md rounded-lg border border-sky-200 bg-sky-50 p-4 text-center">
          <p className="font-semibold text-sky-900">{banner.heading}</p>
          <p className="mt-1 text-sm text-sky-700">{banner.body}</p>
        </div>
      )}
      {hasClerkKey ? (
        <SignIn />
      ) : (
        <div className="w-full max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-amber-900">Authentication Unavailable</h1>
          <p className="text-sm text-amber-800">
            Authentication is not configured. Set{" "}
            <code className="rounded bg-amber-100 px-1 font-mono text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
            <code className="rounded bg-amber-100 px-1 font-mono text-xs">CLERK_SECRET_KEY</code> in your environment to enable sign-in.
          </p>
        </div>
      )}
    </main>
  );
}
