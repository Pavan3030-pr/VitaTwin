"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/client-monitoring";

/** Mounted once in the root layout: forwards uncaught browser errors to the server log. */
export function ErrorListener() {
  useEffect(() => {
    let sent = 0;
    const onError = (event: ErrorEvent) => {
      if (sent++ < 5) reportClientError("window.onerror", event.error ?? event.message);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (sent++ < 5) reportClientError("unhandledrejection", event.reason);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
