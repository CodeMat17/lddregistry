"use client"

import * as React from "react"

const listeners = new Map<string, Set<() => void>>()
const cache = new Map<string, string | null>()

function read(key: string): string | null {
  if (cache.has(key)) return cache.get(key)!
  let value: string | null = null
  try {
    value = window.localStorage.getItem(key)
  } catch {
    value = null
  }
  cache.set(key, value)
  return value
}

function write(key: string, value: string) {
  cache.set(key, value)
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage may be unavailable (private mode); keep the in-memory value.
  }
  listeners.get(key)?.forEach((l) => l())
}

/**
 * Per-viewer convenience preference stored in localStorage (recent records,
 * view mode, saved filter presets). Never used for registry data.
 */
export function useLocalPreference<T>(key: string, fallback: T): [T, (value: T | ((prev: T) => T)) => void] {
  const subscribe = React.useCallback(
    (cb: () => void) => {
      if (!listeners.has(key)) listeners.set(key, new Set())
      listeners.get(key)!.add(cb)
      return () => listeners.get(key)!.delete(cb)
    },
    [key],
  )
  const raw = React.useSyncExternalStore(subscribe, () => read(key), () => null)
  const value = React.useMemo<T>(() => {
    if (raw === null) return fallback
    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw])
  const set = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      const current = (() => {
        const r = read(key)
        if (r === null) return fallback
        try {
          return JSON.parse(r) as T
        } catch {
          return fallback
        }
      })()
      const resolved = typeof next === "function" ? (next as (p: T) => T)(current) : next
      write(key, JSON.stringify(resolved))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )
  return [value, set]
}

export function useOnline() {
  return React.useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb)
      window.addEventListener("offline", cb)
      return () => {
        window.removeEventListener("online", cb)
        window.removeEventListener("offline", cb)
      }
    },
    () => navigator.onLine,
    () => true,
  )
}

export function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
