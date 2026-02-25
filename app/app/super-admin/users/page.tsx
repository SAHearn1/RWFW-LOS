import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import UserRoster from "@/components/super-admin/UserRoster";
import { getCurrentAppRole } from "@/lib/auth/currentRole";

export default async function SuperAdminUsersPage() {
  const role = await getCurrentAppRole();

  if (role !== "super_admin") {
    return <ForbiddenPanel message="User Roster is restricted to Super Admins." />;
  }

  return <UserRoster />;
}
