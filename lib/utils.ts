import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeClipboardWrite(text: string) {
  try {
    const result = navigator.clipboard?.writeText(text)
    // writeText returns a Promise that may reject asynchronously
    // (e.g., "Write permission denied" in non-active tabs / iframes).
    // Swallow the rejection so it doesn't bubble up as an uncaught error.
    if (result && typeof (result as Promise<void>).catch === "function") {
      (result as Promise<void>).catch(() => {})
    }
  } catch {
    /* permission denied (synchronous throw) */
  }
}
