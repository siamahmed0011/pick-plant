import "server-only";

import { auth } from "@/auth";

export async function getOptionalSession() {
  try {
    return await auth();
  } catch {
    return null;
  }
}
