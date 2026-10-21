"use server";

import { getViewerSession } from "./auth";
import { checkRateLimit } from "./rate-limit";
import { getClientKey } from "./client-key";
import { importFhirBundle, type FhirImportResult } from "@/services/fhir";

export interface FhirActionState {
  result: FhirImportResult | null;
  error: string | null;
}

const MAX_BYTES = 1_000_000;

/** Stateless: parses, scores and returns. Nothing is stored or logged. */
export async function analyzeFhir(_prev: FhirActionState, formData: FormData): Promise<FhirActionState> {
  const session = await getViewerSession();
  if (session.source === "none") return { result: null, error: "Please sign in." };

  if (!checkRateLimit(`fhir:${await getClientKey()}`, 20, 60_000).allowed) {
    return { result: null, error: "Too many imports. Please wait a minute and try again." };
  }

  const file = formData.get("file");
  let text = String(formData.get("bundle") ?? "");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return { result: null, error: "File is larger than 1 MB." };
    text = await file.text();
  }
  if (!text.trim()) return { result: null, error: "Paste a FHIR Bundle or choose a file." };
  if (text.length > MAX_BYTES) return { result: null, error: "Input is larger than 1 MB." };

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { result: null, error: "That is not valid JSON." };
  }
  const result = importFhirBundle(json);
  return { result, error: result.ok ? null : result.errors.join(" ") };
}
