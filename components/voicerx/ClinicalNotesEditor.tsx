"use client"

import { useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useTouchDevice } from "@/hooks/use-touch-device"

type ClinicalNotesEditorProps = {
  value: string
  onChange: (html: string) => void
  className?: string
  placeholder?: string
}

/**
 * Clinical Notes editor — patient-facing rich-text doc.
 *
 * Pre-fills from TP-EMR data on first open; doctor edits inline (sections
 * live as <h3>, items as <ul>/<ol>) and prints or copies. Toolbar mirrors
 * a basic word-processor: headings, bold/italic/underline/strike, bullet
 * + numbered lists, undo/redo. Deliberately minimal — printable plainness
 * over rich formatting.
 */
export function ClinicalNotesEditor({
  value,
  onChange,
  className,
  placeholder = "Start typing your clinical notes…",
}: ClinicalNotesEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "vrx-cn-editor focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Keep external value in sync if a parent replaces it (e.g. session reload).
  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false })
  }, [value, editor])

  // Touch devices (iPad / phones) hide the formatting toolbar — the
  // doctor uses the system keyboard for headings / bold / italic /
  // underline / lists / undo / redo via its built-in shortcuts
  // (Cmd+B, Cmd+I, Cmd+U, Cmd+Z, etc.).
  const isTouch = useTouchDevice()

  if (!editor) return null

  const btnBase =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-tp-slate-600 transition-colors hover:bg-tp-slate-100 hover:text-tp-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
  const btnActive = "bg-tp-slate-900 text-white hover:bg-tp-slate-900 hover:text-white"

  return (
      <div className={cn("vrx-cn-shiner-shell relative flex h-full flex-col rounded-xl", className)}>
        {/* Border now uses the same calm violet→indigo "shiner"
           gradient as the consultation-summary card on the agent
           chat — replaces the rotating conic, which read as harsh
           and clipped at the corners. */}

        <div className="flex-1 overflow-y-auto z-10 bg-white rounded-t-xl">
          <EditorContent editor={editor} className="vrx-cn-content min-h-[160px] px-4 py-3 text-[13.5px] leading-[1.6] text-tp-slate-800" />
        </div>
        {!isTouch && (
        <div className="flex flex-wrap items-center gap-0.5 border-t border-tp-slate-200 px-1.5 py-1.5 z-10 bg-white rounded-b-xl">
          <button type="button" aria-label="Heading 1" className={cn(btnBase, editor.isActive("heading", { level: 1 }) && btnActive)} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 size={14} strokeWidth={2} />
          </button>
          <button type="button" aria-label="Heading 2" className={cn(btnBase, editor.isActive("heading", { level: 2 }) && btnActive)} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={14} strokeWidth={2} />
          </button>
          <button type="button" aria-label="Heading 3" className={cn(btnBase, editor.isActive("heading", { level: 3 }) && btnActive)} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 size={14} strokeWidth={2} />
          </button>
          <span className="mx-1 h-4 w-px bg-tp-slate-200" aria-hidden />
          <button type="button" aria-label="Bold" className={cn(btnBase, editor.isActive("bold") && btnActive)} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={14} strokeWidth={2.4} />
          </button>
          <button type="button" aria-label="Italic" className={cn(btnBase, editor.isActive("italic") && btnActive)} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={14} strokeWidth={2.4} />
          </button>
          <button type="button" aria-label="Underline" className={cn(btnBase, editor.isActive("underline") && btnActive)} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={14} strokeWidth={2.4} />
          </button>
          <button type="button" aria-label="Strikethrough" className={cn(btnBase, editor.isActive("strike") && btnActive)} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough size={14} strokeWidth={2.4} />
          </button>
          <span className="mx-1 h-4 w-px bg-tp-slate-200" aria-hidden />
          <button type="button" aria-label="Bullet list" className={cn(btnBase, editor.isActive("bulletList") && btnActive)} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={14} strokeWidth={2.2} />
          </button>
          <button type="button" aria-label="Numbered list" className={cn(btnBase, editor.isActive("orderedList") && btnActive)} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={14} strokeWidth={2.2} />
          </button>
          <span className="mx-1 h-4 w-px bg-tp-slate-200" aria-hidden />
          <button type="button" aria-label="Undo" className={btnBase} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 size={14} strokeWidth={2.2} />
          </button>
          <button type="button" aria-label="Redo" className={btnBase} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 size={14} strokeWidth={2.2} />
          </button>
        </div>
        )}
      <style>{`
        .vrx-cn-editor { min-height: 240px; }
        .vrx-cn-editor h1 { font-size: 18px; font-weight: 700; margin: 14px 0 6px; color: #0f172a; }
        .vrx-cn-editor h2 { font-size: 15.5px; font-weight: 700; margin: 12px 0 4px; color: #0f172a; }
        .vrx-cn-editor h3 { font-size: 13.5px; font-weight: 700; margin: 10px 0 4px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; }
        .vrx-cn-editor p { margin: 4px 0; }
        .vrx-cn-editor ul { list-style: disc; padding-left: 22px; margin: 4px 0; }
        .vrx-cn-editor ol { list-style: decimal; padding-left: 22px; margin: 4px 0; }
        .vrx-cn-editor li { margin: 2px 0; }
        .vrx-cn-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgb(148, 163, 184);
          pointer-events: none;
          height: 0;
        }

        /* Shiner gradient border — matches the structured-rx chip on
           the agent chat. Boosted opacities (was 0.18 / 0.04 — barely
           visible against white) so the stroke actually reads at rest.
           Two-layer trick: white fill on padding-box, gradient on
           border-box, transparent 1px border for a crisp rounded
           edge. */
        .vrx-cn-shiner-shell {
          /* Solid white fill on padding-box, violet shiner gradient on
             border-box. Background is a flat white panel now (no
             rotating wash), so the inner fill is fully opaque. */
          border: 1px solid transparent;
          background-image:
            linear-gradient(#ffffff, #ffffff),
            linear-gradient(180deg,
              rgba(75, 74, 213, 0.55) 0%,
              rgba(75, 74, 213, 0.18) 28%,
              rgba(75, 74, 213, 0.10) 50%,
              rgba(75, 74, 213, 0.18) 72%,
              rgba(75, 74, 213, 0.55) 100%);
          background-origin: border-box;
          background-clip: padding-box, border-box;
          transition: background-image 180ms ease, box-shadow 180ms ease;
        }
        .vrx-cn-shiner-shell:focus-within {
          background-image:
            linear-gradient(#ffffff, #ffffff),
            linear-gradient(0deg, var(--tp-blue-500, #4B4AD5), var(--tp-blue-500, #4B4AD5));
          box-shadow: 0 0 0 3px rgba(75, 74, 213, 0.14);
        }
      `}</style>
    </div>
  )
}

/**
 * Convert TP-EMR sections into a TipTap-compatible HTML doc so the
 * Clinical Notes tab pre-fills with the same data the doctor saw on the
 * EMR tab — each section becomes an <h3> heading + <ul> body.
 */
export function emrSectionsToHtml(sections: { title: string; items: string[] }[]): string {
  return sections
    .map((s) => {
      const items = s.items.length
        ? `<ul>${s.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`
        : `<p>—</p>`
      return `<h3>${escapeHtml(s.title)}</h3>${items}`
    })
    .join("")
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
