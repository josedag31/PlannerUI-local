"use client";

import { useCallback, useEffect } from "react";
import type { RefObject } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function nowDateString(offsetMinutes = 0): string {
  const d = new Date(Date.now() + offsetMinutes * 60_000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function nowTimeString(offsetMinutes = 0): string {
  const d = new Date(Date.now() + offsetMinutes * 60_000);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Prefills empty date/time inputs with today's date / the current time, after
 * mount (client-only) to avoid a server/client hydration mismatch. Returns a
 * `fillDefaults` callback to re-apply the same fill after a form reset (native
 * form.reset() clears back to the HTML default, not the JS-set value).
 */
export function useNowDefaults(refs: {
  date?: RefObject<HTMLInputElement | null>;
  time?: RefObject<HTMLInputElement | null>;
  endTime?: RefObject<HTMLInputElement | null>;
}) {
  const fillDefaults = useCallback(() => {
    if (refs.date?.current) refs.date.current.value = nowDateString();
    if (refs.time?.current) refs.time.current.value = nowTimeString();
    if (refs.endTime?.current) refs.endTime.current.value = nowTimeString(60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fillDefaults();
  }, [fillDefaults]);

  return fillDefaults;
}
