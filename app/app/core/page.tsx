import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import CoreMountRuntime from "@/components/core-mount/CoreMountRuntime";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { isRoleAllowedForPath } from "@/lib/auth/routeAccess";
import { createCoreMountRuntime } from "@/lib/coreMount/runtime";

export default async function CoreMountPage() {
  const role = await getCurrentAppRole();

  if (!role) {
    return <ForbiddenPanel message="No valid role is assigned to your account." />;
  }

  if (!isRoleAllowedForPath("/app/core", role)) {
    return <ForbiddenPanel message="Your current role does not have access to this route." />;
  }

  const runtime = createCoreMountRuntime({ route: "/app/core", attempt: 1 });
  await runtime.mount();

  return <CoreMountRuntime initialStatus={runtime.status()} />;
}
