import { SignUp } from "@clerk/nextjs";

import { sanitizePublishableKey } from "@/lib/config/envGuards";

export default function SignUpPage() {
  const publishableKey = sanitizePublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!publishableKey) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-3 px-6 py-12">
        <h1 className="text-2xl font-semibold">Sign-Up Unavailable</h1>
        <p className="text-sm text-slate-700">
          Authentication is temporarily unavailable due to invalid Clerk configuration.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12">
      <SignUp />
    </main>
  );
}
