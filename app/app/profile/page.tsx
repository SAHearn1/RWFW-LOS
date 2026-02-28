import { auth, currentUser } from "@clerk/nextjs/server";

import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import ProfileEditor from "@/components/profile/ProfileEditor";
import { getCurrentAppRole } from "@/lib/auth/currentRole";

export default async function ProfilePage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  const user = await currentUser();
  const { orgId } = await auth();

  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";
  const displayName = [firstName, lastName].filter(Boolean).join(" ");
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "—";

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">Profile</h1>
      <dl
        className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm"
        data-tour="page-description"
      >
        <div className="grid grid-cols-[140px_1fr] gap-3">
          <dt className="font-medium text-slate-600">Display Name</dt>
          <dd>{displayName || "—"}</dd>
        </div>
        <div className="grid grid-cols-[140px_1fr] gap-3">
          <dt className="font-medium text-slate-600">Email</dt>
          <dd>{email}</dd>
        </div>
        <div className="grid grid-cols-[140px_1fr] gap-3">
          <dt className="font-medium text-slate-600">Role</dt>
          <dd>{role}</dd>
        </div>
        <div className="grid grid-cols-[140px_1fr] gap-3">
          <dt className="font-medium text-slate-600">Organization</dt>
          <dd>{orgId ?? "No organization assigned"}</dd>
        </div>
      </dl>
      <ProfileEditor initialDisplayName={displayName} />
    </section>
  );
}
