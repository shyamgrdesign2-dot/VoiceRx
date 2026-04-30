"use client"

import type { ReactNode } from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { Danger } from "iconsax-reactjs"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * TPConfirmDialog — canonical confirmation / alert shell for the TP
 * design system. Use this wherever you need an "Are you sure?" or
 * "this is important" modal (discarding edits, deleting, reverting,
 * marking done, etc.).
 *
 * Layout:
 *   ┌───────────────────────────────────────┐
 *   │  <title>                         [×]  │  header: title + filled close pill
 *   ├───────────────────────────────────────┤  hairline
 *   │  ⚠  <warning copy on amber chip>       │  optional amber warning callout
 *   │  <description copy>                    │  optional plain body
 *   │  <children — form, chips, preview>     │
 *   ├───────────────────────────────────────┤  hairline
 *   │                <secondary>  <primary>  │  footer
 *   └───────────────────────────────────────┘
 *
 * Primary-tone palette: primary (blue) | destructive (red) |
 * success (green) | warning (amber). Secondary defaults to an
 * underlined blue link; swap to "muted" for a bordered neutral button.
 */
const PRIMARY_TONE_CLASS: Record<
  "primary" | "destructive" | "success" | "warning",
  string
> = {
  primary: "bg-tp-blue-600 text-white hover:bg-tp-blue-700",
  destructive: "bg-rose-600 text-white hover:bg-rose-700",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  warning: "bg-amber-600 text-white hover:bg-amber-700",
}

export interface TPConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Amber-chip copy. Shown at the top of the body when set. */
  warning?: ReactNode
  /** Plain paragraph copy rendered below the warning callout. */
  description?: ReactNode
  /** Extra JSX — textareas, chip pickers, preview cards. */
  children?: ReactNode
  secondaryLabel?: string
  onSecondary?: () => void
  /** "link" (default, blue underlined) | "muted" (bordered neutral). */
  secondaryTone?: "link" | "muted"
  primaryLabel: string
  onPrimary: () => void
  primaryTone?: "primary" | "destructive" | "success" | "warning"
  primaryDisabled?: boolean
}

export function TPConfirmDialog({
  open,
  onOpenChange,
  title,
  warning,
  description,
  children,
  secondaryLabel = "Cancel",
  onSecondary,
  secondaryTone = "link",
  primaryLabel,
  onPrimary,
  primaryTone = "primary",
  primaryDisabled = false,
}: TPConfirmDialogProps) {
  const primaryBtnClass = cn(
    "inline-flex h-[40px] items-center justify-center rounded-[10px] px-[16px] text-[14px] font-semibold transition-colors",
    PRIMARY_TONE_CLASS[primaryTone] || PRIMARY_TONE_CLASS.primary,
    primaryDisabled && "opacity-50 cursor-not-allowed",
  )

  const secondaryBtnClass =
    secondaryTone === "muted"
      ? "inline-flex h-[40px] items-center justify-center rounded-[10px] border border-tp-slate-200 bg-white px-[16px] text-[14px] font-semibold text-tp-slate-700 hover:bg-tp-slate-50 transition-colors"
      : "inline-flex h-[40px] items-center justify-center rounded-[10px] bg-transparent px-[8px] text-[14px] font-semibold text-tp-blue-600 underline underline-offset-[4px] decoration-2 hover:text-tp-blue-700 transition-colors"

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <AlertDialogPrimitive.Content
          data-voice-allow
          className="fixed left-1/2 top-1/2 z-[201] w-[480px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.15)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 font-['Inter',sans-serif]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-[12px] px-[20px] py-[16px]">
            <AlertDialogPrimitive.Title className="text-[16px] font-semibold text-tp-slate-900">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Cancel asChild>
              <button
                type="button"
                aria-label="Close"
                className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-[6px] bg-tp-slate-900 text-white transition-colors hover:bg-tp-slate-700"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </AlertDialogPrimitive.Cancel>
          </div>

          {/* Divider between header and body */}
          <div className="h-px bg-tp-slate-100" aria-hidden />

          {/* Body — amber warning chip + description + extra children */}
          {(warning || description || children) && (
            <div className="flex flex-col gap-[14px] px-[20px] py-[16px]">
              {warning && (
                <div className="flex items-start gap-[12px] rounded-[10px] bg-amber-50 px-[16px] py-[14px]">
                  <Danger
                    size={20}
                    variant="Linear"
                    className="mt-[2px] shrink-0 text-amber-500"
                  />
                  <p className="text-[14px] leading-[1.45] text-tp-slate-700">
                    {warning}
                  </p>
                </div>
              )}
              {description && (
                <AlertDialogPrimitive.Description className="text-[14px] leading-[1.5] text-tp-slate-600">
                  {description}
                </AlertDialogPrimitive.Description>
              )}
              {children}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-[14px] border-t border-tp-slate-100 px-[20px] py-[14px]">
            <AlertDialogPrimitive.Cancel asChild>
              <button
                type="button"
                onClick={(e) => {
                  if (onSecondary) {
                    e.preventDefault()
                    onSecondary()
                  }
                }}
                className={secondaryBtnClass}
              >
                {secondaryLabel}
              </button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  if (!primaryDisabled) onPrimary()
                }}
                disabled={primaryDisabled}
                className={primaryBtnClass}
              >
                {primaryLabel}
              </button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}
