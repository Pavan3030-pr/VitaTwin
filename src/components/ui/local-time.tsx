"use client";

import { useEffect, useState } from "react";

const FORMAT: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };

/**
 * Shows a timestamp in the viewer's own timezone. The server renders UTC (labelled),
 * then the browser swaps in local time after hydration, so there is no mismatch.
 */
export function LocalTime({ iso }: { iso: string }) {
  const date = new Date(iso);
  const valid = !Number.isNaN(date.getTime());
  const [text, setText] = useState(() =>
    valid ? `${date.toLocaleString("en-GB", { ...FORMAT, timeZone: "UTC" })} UTC` : "Unknown time",
  );

  useEffect(() => {
    if (valid) setText(date.toLocaleString([], FORMAT));
  }, [iso]); // eslint-disable-line react-hooks/exhaustive-deps

  return <time dateTime={valid ? date.toISOString() : undefined}>{text}</time>;
}
