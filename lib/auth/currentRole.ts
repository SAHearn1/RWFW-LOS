import { currentUser } from "@clerk/nextjs/server";

import type { AppRole } from "./roles";
import { parseAppRole } from "./userRole";

export async function getCurrentAppRole(): Promise<AppRole | null> {
  const user = await currentUser();
  return parseAppRole(user?.publicMetadata?.role);
}
