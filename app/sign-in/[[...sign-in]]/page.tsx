import { SignIn } from "@clerk/nextjs";

import { getConfiguredPublishableKey } from "@/lib/config/envGuards";

type SignInPageProps = {
  searchParams: Promise<{ auth?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const hasValidKey = Boolean(getConfiguredPublishableKey());
  const authUnavailable = params.auth === "unavailable";

  if (!hasValidKey || authUnavailable) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center max-w-md w-full">
          <h1 className="text-lg font-semibold text-red-800 mb-2">Authentication Unavailable</h1>
          <p className="text-sm text-red-700">
            The authentication service is currently unavailable. Please contact your administrator or try again later.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12">
      <SignIn afterSignInUrl="/app" signUpUrl="/sign-up" />
    </main>
  );
}
