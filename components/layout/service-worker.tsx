"use client"

import * as React from "react"

/** Registers the offline app-shell cache in production builds only. */
export function ServiceWorkerRegistration() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline caching is an enhancement; the app works without it.
    })
  }, [])
  return null
}
