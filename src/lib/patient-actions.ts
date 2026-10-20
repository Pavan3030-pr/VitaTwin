"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getViewerSession } from "./auth";
import { isPersonaId } from "./cohort";
import { PATIENT_COOKIE } from "./active";

/** Switches the active synthetic patient. Whitelisted ids only. */
export async function selectPatient(formData: FormData): Promise<void> {
  const session = await getViewerSession();
  if (session.source === "none") return;
  const id = formData.get("patientId");
  if (!isPersonaId(id)) return;
  const store = await cookies();
  store.set(PATIENT_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  revalidatePath("/", "layout");
}
