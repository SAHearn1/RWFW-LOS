import { SignIn } from "@clerk/nextjs";

const ROLE_NOTES: Record<string, string> = {
  teacher: "Signing in as a teacher. Your account must be associated with an organization.",
  admin: "Signing in as an administrator. Contact your organization owner if access is restricted.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const note = role ? ROLE_NOTES[role] : undefined;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-12">
      {note && (
        <p className="mb-4 text-center text-sm text-slate-600">{note}</p>
      )}
      <SignIn />
    </main>
  );
}
