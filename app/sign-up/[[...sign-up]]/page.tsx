import { SignUp } from "@clerk/nextjs";

import { getConfiguredPublishableKey } from "@/lib/config/envGuards";

export default function SignUpPage() {
  const hasClerkKey = Boolean(getConfiguredPublishableKey());

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12">
      {hasClerkKey ? (
        <SignUp />
      ) : (
        <div className="w-full max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-amber-900">Authentication Unavailable</h1>
          <p className="text-sm text-amber-800">
            Authentication is not configured. Set <code className="rounded bg-amber-100 px-1 font-mono text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
            <code className="rounded bg-amber-100 px-1 font-mono text-xs">CLERK_SECRET_KEY</code> in your environment to enable sign-up.
          </p>
        </div>
      )}
    </main>
  );
}