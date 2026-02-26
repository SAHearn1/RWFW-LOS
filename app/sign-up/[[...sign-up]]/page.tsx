import { SignUp } from "@clerk/nextjs";

import { parseAppRole } from "@/lib/auth/userRole";

type SignUpPageProps = {
  searchParams: Promise<{ role?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const intendedRole = parseAppRole(params.role);

  // Pass the role hint through the post-signup redirect so the onboarding
  // wizard can pre-select the matching option.
  const afterSignUpUrl = intendedRole
    ? `/onboarding?role=${intendedRole}`
    : "/onboarding";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12">
      <SignUp afterSignUpUrl={afterSignUpUrl} signInUrl="/sign-in" />
    </main>
  );
}
