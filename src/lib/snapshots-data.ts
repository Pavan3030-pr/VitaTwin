import "server-only";
import { getViewerSession, isSupabaseConfigured } from "./auth";
import { createSupabaseServerClient } from "./supabase/server";
import { parseSnapshotPayload, type SnapshotPayload } from "@/services/snapshot";

export interface SavedSnapshot {
  id: string;
  capturedAt: string;
  payload: SnapshotPayload;
}

/** Newest-first list of the signed-in user's snapshots ([] for demo or on error). */
export async function listSnapshots(limit = 20): Promise<SavedSnapshot[]> {
  const session = await getViewerSession();
  if (session.source !== "supabase" || !isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("twin_snapshots")
    .select("id, captured_at, payload")
    .order("captured_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  return data.flatMap((row) => {
    const payload = parseSnapshotPayload(row.payload);
    return payload ? [{ id: String(row.id), capturedAt: String(row.captured_at), payload }] : [];
  });
}
