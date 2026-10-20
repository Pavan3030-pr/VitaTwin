import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_PERSONA_ID, PERSONAS, getPersona, isPersonaId } from "./cohort";
import { generateDemoBundle, type DemoBundle } from "./data";
import { fetchEnvironment, resolveCity } from "@/services/environment";

export const PATIENT_COOKIE = "vitatwin_patient";

/** The persona the viewer selected; unknown/tampered values fall back safely. */
export async function getActivePersonaId(): Promise<string> {
  const store = await cookies();
  const value = store.get(PATIENT_COOKIE)?.value;
  return isPersonaId(value) ? value : DEFAULT_PERSONA_ID;
}

/** Bundle for the active patient, with live city air quality/heat attached. */
export async function getActiveBundle(): Promise<DemoBundle> {
  const id = await getActivePersonaId();
  const env = await fetchEnvironment(resolveCity(getPersona(id).demographics.location));
  return generateDemoBundle(id, env);
}

/** Bundles for the whole cohort (clinician panel). Fetches run in parallel. */
export async function getCohortBundles(): Promise<DemoBundle[]> {
  return Promise.all(
    PERSONAS.map(async (persona) => {
      const env = await fetchEnvironment(resolveCity(persona.demographics.location));
      return generateDemoBundle(persona.id, env);
    }),
  );
}
