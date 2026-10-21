"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE, getViewerSession, isSupabaseConfigured } from "./auth";
import { PATIENT_COOKIE } from "./active";
import { ONBOARDING_COOKIE } from "./onboarding";
import { createSupabaseServerClient } from "./supabase/server";
import { checkRateLimit } from "./rate-limit";
import { getClientKey } from "./client-key";

const CONFIRM_WORD = "DELETE";

function accountUrl(error: string): string {
  return `/account?error=${encodeURIComponent(error)}`;
}

/**
 * Permanently deletes the signed-in account.
 *  - Supabase users: calls the `delete_my_account()` database function (see
 *    supabase/migrations/0002_account_lifecycle.sql). It runs as the user, so
 *    the service-role key is never needed; profile and snapshots cascade.
 *  - Demo users: there is nothing server-side to delete, so the demo cookies are cleared.
 */
export async function deleteAccount(formData: FormData): Promise<void> {
  const session = await getViewerSession();
  if (session.source === "none") redirect("/login");

  const limit = checkRateLimit(`delete:${await getClientKey()}`, 5, 15 * 60_000);
  if (!limit.allowed) redirect(accountUrl("Too many attempts. Please wait a few minutes."));

  if (String(formData.get("confirm") ?? "").trim() !== CONFIRM_WORD) {
    redirect(accountUrl(`Type ${CONFIRM_WORD} in capitals to confirm.`));
  }

  if (session.source === "supabase" && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      redirect(accountUrl("We could not delete your account. Nothing was removed. Please try again."));
    }
    await supabase.auth.signOut();
  }

  const store = await cookies();
  for (const name of [DEMO_COOKIE, PATIENT_COOKIE, ONBOARDING_COOKIE]) store.delete(name);

  redirect("/login?notice=" + encodeURIComponent("Your account and its data were deleted."));
}
