"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that keeps the Emergency and Guide screens
 * available offline. Production only — caching gets in the way during dev.
 */
export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is an enhancement; the app works without it.
    });
  }, []);

  return null;
}
