"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getViewerSession, isSupabaseConfigured } from "./auth";
import { getActiveBundle } from "./active";
import { createSupabaseServerClient } from "./supabase/server";
import { checkRateLimitShared } from "./rate-limit-shared";
import { getClientKey } from "./client-key";
import { buildSnapshotPayload, MAX_SNAPSHOTS_PER_USER } from "@/services/snapshot";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function back(kind: "notice" | "error", message: string): never {
  redirect(`/timeline?${kind}=${encodeURIComponent(message)}`);
}

/** Saves the active twin's derived state for the signed-in email user. Row-level security enforces ownership. */
export async function saveSnapshot(): Promise<void> {
  const session = await getViewerSession();
  if (session.source !== "supabase" || !isSupabaseConfigured() || !session.userId) {
    back("error", "Sign in with an email account to save snapshots.");
  }

  if (!(await checkRateLimitShared(`snapshot:${await getClientKey()}`, 10, 60_000)).allowed) {
    back("error", "Too many saves. Please wait a minute.");
  }

  const supabase = await createSupabaseServerClient();

  const { count, error: countError } = await supabase
    .from("twin_snapshots")
    .select("id", { count: "exact", head: true });
  if (countError) back("error", "We could not save the snapshot. Please try again.");
  if ((count ?? 0) >= MAX_SNAPSHOTS_PER_USER) {
    back("error", `You have ${MAX_SNAPSHOTS_PER_USER} saved snapshots. Delete an old one first.`);
  }

  const bundle = await getActiveBundle();
  const { error } = await supabase.from("twin_snapshots").insert({
    user_id: session.userId,
    twin_id: bundle.twin.twinId,
    payload: buildSnapshotPayload(bundle),
  });
  if (error) back("error", "We could not save the snapshot. Please try again.");

  revalidatePath("/timeline");
  back("notice", "Snapshot saved.");
}

export async function deleteSnapshot(formData: FormData): Promise<void> {
  const session = await getViewerSession();
  if (session.source !== "supabase" || !isSupabaseConfigured()) back("error", "Sign in to manage snapshots.");

  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) back("error", "That snapshot could not be found.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("twin_snapshots").delete().eq("id", id);
  if (error) back("error", "We could not delete that snapshot. Please try again.");

  revalidatePath("/timeline");
  back("notice", "Snapshot deleted.");
}
