import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import TeacherAssignment from "@/components/super-admin/TeacherAssignment";
import { getCurrentAppRole } from "@/lib/auth/currentRole";

export default async function SuperAdminTeachersPage() {
  const role = await getCurrentAppRole();

  if (role !== "super_admin") {
    return <ForbiddenPanel message="Teacher Assignment is restricted to Super Admins." />;
  }

  return <TeacherAssignment />;
}
