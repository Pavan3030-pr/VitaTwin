"use server";

import { cookies } from "next/headers";
import { ONBOARDING_COOKIE } from "./onboarding";

/** Remembers that this browser has finished (or skipped) the welcome tour. */
export async function completeOnboarding(): Promise<void> {
  const store = await cookies();
  store.set(ONBOARDING_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
