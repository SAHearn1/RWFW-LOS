"use client";

import { useEffect } from "react";

/**
 * Registers the service worker at /sw.js when the browser supports it.
 * Only mounted when NEXT_PUBLIC_ENABLE_OFFLINE=true (checked at the call site
 * in app/layout.tsx). The component renders nothing visible.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.info("[SW] Registered:", registration.scope);
      })
      .catch((err) => {
        console.warn("[SW] Registration failed:", err);
      });
  }, []);

  return null;
}
