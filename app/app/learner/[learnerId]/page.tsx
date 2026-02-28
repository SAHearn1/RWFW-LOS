import ForbiddenPanel from "@/components/app-shell/ForbiddenPanel";
import LearnerDetailView from "@/components/facilitator/LearnerDetailView";
import { getCurrentAppRole } from "@/lib/auth/currentRole";
import { FACILITATOR_ROLES } from "@/lib/auth/routeAccess";

type LearnerDetailPageProps = {
  params: Promise<{ learnerId: string }>;
};

export default async function LearnerDetailPage({ params }: LearnerDetailPageProps) {
  const { learnerId } = await params;
  const role = await getCurrentAppRole();

  if (!role || !(FACILITATOR_ROLES as readonly string[]).includes(role)) {
    return <ForbiddenPanel message="Learner detail view is restricted to facilitators." />;
  }

  if (!learnerId?.trim()) {
    return <ForbiddenPanel message="Invalid learner ID." />;
  }

  return <LearnerDetailView learnerId={learnerId} />;
}
