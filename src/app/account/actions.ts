"use server";

import { requireUser } from "@/lib/auth/guards";

type DeferredAccountResult = {
  ok: false;
  message: string;
};

export async function updateProfileAction(formData: FormData): Promise<DeferredAccountResult> {
  await requireUser("/account/profile");
  void formData;
  return {
    ok: false,
    message:
      "Profile updates require secure database-backed account storage and are not active yet.",
  };
}

export async function changePasswordAction(formData: FormData): Promise<DeferredAccountResult> {
  await requireUser("/account/security");
  void formData;
  return {
    ok: false,
    message:
      "Password changes require server-side credential verification and database integration and are not active yet.",
  };
}
