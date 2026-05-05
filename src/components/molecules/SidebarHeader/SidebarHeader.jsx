"use client";

/**
 * SidebarHeader — shared header strip for every sidebar / drawer panel.
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ [✕]│ [icon] Title                       [▶tutorial] | CTA  CTA  │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Spec (locked by design):
 *   – Strip height: 56px, bottom border-b tp-slate-100, 16px h-padding.
 *   – Close icon: 24px glyph in a 36px button.
 *   – Divider after close: full strip height (self-stretch), tp-slate-200,
 *     1px wide.
 *   – Optional title-prefix slot for branded badges (e.g. blue tile).
 *   – Title: 16px Inter semibold, tp-slate-800, truncates.
 *   – Optional `tutorial` element on the right (typically a 36px play
 *     icon button).
 *   – Optional `actions` slot for trailing CTAs (use 36px small variant).
 *   – Optional `actionsDivider` between tutorial and actions.
 *
 * Used by: RxCustomiseSidebar, CustomModulesDrawer, TemplatesListSidebar,
 * SaveTemplateSidebar, plus any new sidebar / drawer.
 */

import * as React from "react";

export function SidebarHeader({
  onClose,
  closeAriaLabel = "Close",
  closeIcon, // expected to render at 24px
  titlePrefix = null,
  title,
  tutorial = null,
  actionsDivider = null,
  actions = null,
}) {
  return (
    <header className="flex h-[56px] shrink-0 items-stretch justify-between gap-[12px] border-b border-tp-slate-100 px-[16px]">
      <div className="flex min-w-0 items-stretch gap-[12px]">
        <button
          type="button"
          onClick={onClose}
          aria-label={closeAriaLabel}
          className="my-auto flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[8px] text-tp-slate-700 transition-colors hover:bg-tp-slate-100 hover:text-tp-slate-900 active:scale-[0.96]">
          {closeIcon}
        </button>
        <span aria-hidden="true" className="w-px shrink-0 self-stretch bg-tp-slate-200" />
        {titlePrefix}
        <h3 className="my-auto truncate text-[16px] font-semibold tracking-[-0.1px] text-tp-slate-800">
          {title}
        </h3>
      </div>
      {(tutorial || actions) && (
        <div className="flex shrink-0 items-center gap-[10px]">
          {tutorial}
          {actionsDivider}
          {actions}
        </div>
      )}
    </header>
  );
}

SidebarHeader.displayName = "SidebarHeader";
