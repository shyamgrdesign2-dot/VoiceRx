"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Editor } from "@tiptap/core"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"

import { cn } from "@/lib/utils"

export interface RxPadRichFieldProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  /** TP-style error state (border + ring) */
  error?: boolean
  disabled?: boolean
  /** Max height in px before the editor scrolls internally. Default 100px. */
  maxHeight?: number
}

/**
 * Rich text for Rx pad — outer chrome matches {@link TPRxPadSearchInput}
 * (slate border + hover; blue border + ring only while the editor is actually focused via TipTap onFocus/onBlur).
 *
 * Empty: fixed 40px tall. With content: height hugs content (min 40px), up to `maxHeight` then scrolls.
 */
export function RxPadRichField({
  value,
  onChange,
  placeholder,
  className,
  error = false,
  disabled = false,
  maxHeight = 100,
}: RxPadRichFieldProps) {
  const lastEmitted = useRef<string>(value)
  /** Drive border/ring from TipTap focus — avoids :focus-within sticking after blur or autofill. */
  const [isEditorFocused, setIsEditorFocused] = useState(false)

  const syncEditorHeight = useCallback(
    (ed: Editor) => {
      const dom = ed.view.dom as HTMLElement
      // Empty → 40px, matching TPRxPadSearchInput's compact baseline
      if (ed.isEmpty) {
        dom.style.minHeight = "40px"
        dom.style.maxHeight = `${maxHeight}px`
        dom.style.height = "40px"
        dom.style.overflowY = "hidden"
        return
      }
      // Measure content; grow to fit, cap at maxHeight, scroll beyond
      dom.style.minHeight = "40px"
      dom.style.maxHeight = `${maxHeight}px`
      dom.style.height = "auto"
      dom.style.overflowY = "hidden"
      const sh = dom.scrollHeight
      const next = Math.min(Math.max(sh, 40), maxHeight)
      dom.style.height = `${next}px`
      dom.style.overflowY = sh > maxHeight ? "auto" : "hidden"
    },
    [maxHeight],
  )

  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder ?? "",
      }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "rxpad-rich-editor tiptap overflow-x-hidden",
          "px-3 py-[10px] text-[14px] font-['Inter',sans-serif] leading-[1.45] text-tp-slate-700",
          "outline-none focus:outline-none",
          "transition-[height] duration-150 ease-out",
          "[caret-color:var(--tp-blue-500)]",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_p.is-empty:first-child::before]:pointer-events-none [&_p.is-empty:first-child::before]:float-left [&_p.is-empty:first-child::before]:h-0",
          "[&_p.is-empty:first-child::before]:text-tp-slate-400 [&_p.is-empty:first-child::before]:content-[attr(data-placeholder)]",
        ),
      },
    },
    onCreate: ({ editor: ed }) => {
      requestAnimationFrame(() => syncEditorHeight(ed))
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML()
      lastEmitted.current = html
      onChange(html)
      requestAnimationFrame(() => syncEditorHeight(ed))
    },
    onFocus: () => setIsEditorFocused(true),
    onBlur: () => setIsEditorFocused(false),
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
    requestAnimationFrame(() => syncEditorHeight(editor))
  }, [editor, disabled, syncEditorHeight])

  useEffect(() => {
    if (!editor) return
    if (value === lastEmitted.current) return
    lastEmitted.current = value || "<p></p>"
    const cur = editor.getHTML()
    if (value === cur) return
    // Remember focus before we mutate content — Tiptap's setContent can move
    // the selection/anchor which sometimes grabs the DOM focus; we don't want
    // an external auto-fill (e.g. VoiceRx) to make the field look "active".
    const wasFocused = editor.isFocused
    editor.commands.setContent(value || "<p></p>", { emitUpdate: false })
    if (!wasFocused) {
      // Blur defensively so focus chrome clears after VoiceRx / external autofill
      editor.commands.blur()
      try {
        ;(editor.view.dom as HTMLElement).blur()
      } catch {
        /* noop */
      }
      setIsEditorFocused(false)
    }
    requestAnimationFrame(() => syncEditorHeight(editor))
  }, [value, editor, syncEditorHeight])

  const chromeClass = cn(
    "rounded-[10px] border bg-white transition-[border-color,box-shadow] duration-150",
    disabled && "border-tp-slate-200 bg-tp-slate-50 opacity-70",
    error &&
      !disabled &&
      "border-tp-error-500 ring-2 ring-tp-error-500/25 [box-shadow:none]",
    !error &&
      !disabled &&
      (isEditorFocused
        ? "border-tp-blue-500 ring-2 ring-tp-blue-500/20 [box-shadow:none]"
        : "border-tp-slate-300 hover:border-tp-slate-400"),
  )

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-[40px] rounded-[10px] border border-tp-slate-300 bg-white transition-colors",
          !error && !disabled && "hover:border-tp-slate-400",
          error && "border-tp-error-500 ring-2 ring-tp-error-500/20",
          disabled && "border-tp-slate-200 bg-tp-slate-50 opacity-70",
          className,
        )}
      />
    )
  }

  return (
    <div className={cn(chromeClass, className)}>
      <EditorContent editor={editor} />
    </div>
  )
}
