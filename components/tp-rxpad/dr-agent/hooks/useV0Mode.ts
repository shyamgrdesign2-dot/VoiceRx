"use client"

import { useCallback } from "react"

/**
 * Dr. Agent is V0-only in this product — summary-focused panel everywhere.
 * setIsV0Mode is retained as a no-op for call-site compatibility.
 */
export function useV0Mode() {
  const setIsV0Mode = useCallback((_val: boolean) => {}, [])
  return { isV0Mode: true as boolean, setIsV0Mode }
}
