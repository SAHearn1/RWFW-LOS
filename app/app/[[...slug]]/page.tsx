import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import { getRouteDefinition, isKnownAppPath, isRoleAllowedForPath } from "@/lib/auth/routeAccess";
import { parseAppRole } from "@/lib/auth/userRole";

type AppCatchAllPageProps = {
  params: Promise<{ slug?: string[] }>;
};

function toPath(slug: string[] | undefined): string {
  if (!slug || slug.length === 0) {
    return "/app";
  }

  return `/app/${slug.join("/")}`;
}

export default async function AppCatchAllPage({ params }: AppCatchAllPageProps) {
  const { slug } = await params;
  const pathname = toPath(slug);

  if (!isKnownAppPath(pathname)) {
    notFound();
  }

  const user = await currentUser();
  const role = parseAppRole(user?.publicMetadata?.role);

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath(pathname, role)) {
    return <ForbiddenPanel message="Your current role does not have access to this route." />;
  }

  const definition = getRouteDefinition(pathname);
  if (!definition) {
    notFound();
  }

  if (pathname === "/app/profile") {
    const { orgId } = await auth();
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold" data-tour="page-title">Profile</h1>
        <dl className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" data-tour="page-description">
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <dt className="font-medium text-slate-600">Role</dt>
            <dd>{role}</dd>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <dt className="font-medium text-slate-600">Organization</dt>
            <dd>{orgId ?? "No organization assigned"}</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold" data-tour="page-title">{definition.title}</h1>
      <p className="text-sm text-slate-700" data-tour="page-description">{definition.description}</p>
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        Placeholder for the {definition.title} experience.
      </div>
    </section>
  );
}
